import test from "node:test";
import assert from "node:assert/strict";
import {DatabaseSync} from "node:sqlite";
import {createWorker} from "../server/worker.mjs";
import {sqliteBinding} from "../tools/sqlite-binding.mjs";
import {readFileSync} from "node:fs";

const origin = "https://workbench.example";
function setup() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync(new URL("../migrations/0001_state.sql", import.meta.url), "utf8"));
  const env = {DB: sqliteBinding(sqlite), ADMIN_PASSWORD: "test-only-admin-password-32-characters", SESSION_SECRET: "test-only-session-secret-32-characters", WORKBENCH_READ_TOKEN: "test-only-read-token-32-characters"};
  let currentTime = Date.parse("2026-10-19T08:00:00Z");
  const worker = createWorker({now: () => currentTime});
  let cookie;
  async function call(path, {method = "GET", body, auth = true, headers = {}} = {}) {
    const response = await worker.fetch(new Request(origin + path, {
      method, headers: {...(auth && cookie ? {cookie} : {}), ...(body ? {"content-type": "application/json", origin, "x-workbench-request": "1"} : {}), ...headers},
      body: body ? JSON.stringify(body) : undefined,
    }), env);
    return response;
  }
  async function login() {
    const response = await call("/api/login", {method: "POST", body: {password: env.ADMIN_PASSWORD}});
    assert.equal(response.status, 200);
    cookie = response.headers.get("set-cookie").split(";")[0];
    assert.match(response.headers.get("set-cookie"), /HttpOnly/);
  }
  return {env, call, login, sqlite, advance(ms) {currentTime += ms;}};
}

test("网页关闭后由持久数据库直接读取快照；只读凭据不能写入或读报告", async () => {
  const {call, login, env} = setup();
  assert.equal((await call("/api/state")).status, 401);
  await login();
  const state = await (await call("/api/state")).json();
  const write = await call("/api/state", {method: "PATCH", headers: {"if-match": String(state.revision)}, body: {op: "add", collection: "tasks", properties: {标题: {text: "验证闭页同步"}, 状态: {select: "进行中"}, 今日重点: {checkbox: true}}}});
  assert.equal(write.status, 200);
  const headers = {authorization: `Bearer ${env.WORKBENCH_READ_TOKEN}`};
  const snapshot = await call("/v1/snapshot", {auth: false, headers});
  assert.equal(snapshot.status, 200);
  const data = await snapshot.json();
  assert.equal(data.tasks[0].标题, "验证闭页同步");
  assert.equal(data.tasks[0].状态, "进行中");
  assert.ok(!("reports" in data));
  assert.equal((await call("/api/state", {auth: false, headers})).status, 401);
  assert.equal((await call("/api/state", {method: "PATCH", auth: false, headers, body: {op: "delete"}})).status, 401);
});

test("过期版本写入返回冲突，不覆盖另一设备的新数据", async () => {
  const {call, login} = setup(); await login();
  const body = {op: "add", collection: "tasks", properties: {标题: "任务", 状态: "待开始"}};
  assert.equal((await call("/api/state", {method: "PATCH", headers: {"if-match": "0"}, body})).status, 200);
  assert.equal((await call("/api/state", {method: "PATCH", headers: {"if-match": "0"}, body})).status, 409);
  assert.equal((await (await call("/api/state")).json()).data.tasks.length, 1);
});

test("备份导入保留 ID、七表，失败整份回滚，合并幂等", async () => {
  const {call, login} = setup(); await login();
  const backup = {formatVersion: 2, tasks: [{_id: "original-id", 标题: "原任务", 状态: "进行中"}], projects: [], research: [], notes: [], resources: [], reports: [], airecords: []};
  const body = {mode: "merge", backup};
  assert.equal((await call("/api/import", {method: "POST", body, headers: {"if-match": "0"}})).status, 200);
  assert.equal((await call("/api/import", {method: "POST", body, headers: {"if-match": "1"}})).status, 200);
  const before = await (await call("/api/state")).json();
  assert.equal(before.data.tasks[0]._id, "original-id");
  assert.equal(before.data.tasks.length, 1);
  const invalid = {...backup, tasks: [...backup.tasks, {_id: "broken", 标题: "坏任务", 状态: "invalid"}]};
  assert.equal((await call("/api/import", {method: "POST", body: {mode: "replace", backup: invalid}, headers: {"if-match": String(before.revision)}})).status, 400);
  assert.deepEqual(await (await call("/api/state")).json(), before);
});

test("同源写入、鉴权、缺少数据初始化与配置均有明确失败", async () => {
  const {call, login, env} = setup();
  assert.equal((await call("/v1/snapshot", {headers: {authorization: `Bearer ${env.WORKBENCH_READ_TOKEN}`}})).status, 503);
  await login();
  assert.equal((await call("/api/state", {method: "PATCH", headers: {origin: "https://other.example"}, body: {}})).status, 403);
  env.WORKBENCH_READ_TOKEN = undefined;
  assert.equal((await call("/v1/snapshot")).status, 503);
});

test("登录会话过期、篡改和退出均失效，失败口令受到限速", async () => {
  const {call, login, advance} = setup();
  await login();
  assert.equal((await call("/api/session")).status, 200);
  assert.equal((await call("/api/session", {headers: {cookie: "__Host-workbench=forged"}})).status, 401);
  const out = await call("/api/logout", {method: "POST", body: {}});
  assert.match(out.headers.get("set-cookie"), /Max-Age=0/);
  assert.equal((await call("/api/session", {headers: {cookie: out.headers.get("set-cookie").split(";")[0]}})).status, 401);
  for (let i = 0; i < 9; i++) assert.equal((await call("/api/login", {method: "POST", body: {password: "wrong"}})).status, 401);
  assert.equal((await call("/api/login", {method: "POST", body: {password: "wrong"}})).status, 429);
  advance(12 * 3600000 + 1);
  assert.equal((await call("/api/session")).status, 401);
});

test("读写链接拒绝脚本协议，字段和凭据不会反射进错误响应", async () => {
  const {call, login} = setup(); await login();
  const response = await call("/api/state", {method: "PATCH", headers: {"if-match": "0"}, body: {
    op: "add", collection: "resources", properties: {名称: "资料", 网页链接: {url: {text: "测试", link: "javascript:private-test-string"}}}
  }});
  assert.equal(response.status, 400);
  assert.ok(!(await response.text()).includes("private-test-string"));
});
