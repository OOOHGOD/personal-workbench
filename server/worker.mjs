import {html, client, schemas, csp} from "../.generated/assets.mjs";
import {ApiError, readState, saveState, mutate, importBackup} from "./state.mjs";
import {configured, cookie, createSession, limitLogin, requireOrigin, requireSession, sameSecret} from "./auth.mjs";

const HEADERS = {"cache-control": "no-store", "x-content-type-options": "nosniff", "referrer-policy": "no-referrer", "content-security-policy": csp};
const json = (value, status = 200, headers = {}) => new Response(JSON.stringify(value), {status, headers: {...HEADERS, "content-type": "application/json; charset=utf-8", ...headers}});
async function jsonBody(request) {
  if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) throw new ApiError(415, "请发送 JSON 数据");
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "缺少请求内容");
  const decoder = new TextDecoder("utf-8", {fatal: true});
  let text = "", size = 0;
  try {
    while (true) {
      const {value, done} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 1024 * 1024) throw new ApiError(413, "导入内容超过 1 MiB");
      text += decoder.decode(value, {stream: true});
    }
    let body;
    try {body = JSON.parse(text + decoder.decode());} catch {throw new ApiError(400, "JSON 格式无效");}
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new ApiError(400, "请求内容无效");
    return body;
  } finally {await reader.cancel().catch(() => {}); reader.releaseLock();}
}
function checkRevision(request, state) {
  const value = request.headers.get("if-match");
  if (!value || !/^\d+$/.test(value)) throw new ApiError(428, "缺少数据版本，请先刷新");
  if (Number(value) !== state.revision) throw new ApiError(409, "其他设备已更新，请刷新后重试");
}
function snapshot(state) {
  if (!state.initialized) throw new ApiError(503, "工作台尚未导入或创建数据");
  const select = (records, keys) => records.map((row) => Object.fromEntries(keys.filter((k) => row[k] !== undefined && row[k] !== null).map((k) => [k, row[k]])));
  return {formatVersion: 2, exportedAt: state.updated_at,
    tasks: select(state.data.tasks, ["标题", "状态", "优先级", "关联项目", "下一步", "计划日期", "截止日期", "下次跟进", "完成时间", "今日重点", "是否示例"]),
    projects: select(state.data.projects, ["项目名称", "当前阶段", "下一步", "卡点", "是否示例"])};
}
export function createWorker({now = () => Date.now()} = {}) {
  return {async fetch(request, env) {
    const requestId = crypto.randomUUID();
    const path = new URL(request.url).pathname;
    try {
      if (request.method === "GET" && ["/", "/client.js"].includes(path)) {
        return new Response(path === "/" ? html : client, {headers: {...HEADERS, "content-type": path === "/" ? "text/html; charset=utf-8" : "text/javascript; charset=utf-8"}});
      }
      if (request.method === "GET" && path === "/health") return json({ok: true});
      configured(env);
      if (request.method === "GET" && path === "/ready") {
        await readState(env.DB); return json({ok: true});
      }
      if (path === "/v1/snapshot") {
        if (request.method !== "GET") throw new ApiError(405, "仅支持 GET");
        const token = (request.headers.get("authorization") ?? "").replace(/^Bearer /, "");
        if (!request.headers.get("authorization")?.startsWith("Bearer ") || !(await sameSecret(token, env.WORKBENCH_READ_TOKEN))) throw new ApiError(401, "只读凭据无效");
        return json(snapshot(await readState(env.DB)));
      }
      if (!path.startsWith("/api/")) throw new ApiError(404, "接口不存在");
      if (!["GET", "POST", "PATCH"].includes(request.method)) throw new ApiError(405, "请求方法无效");
      if (request.method !== "GET") requireOrigin(request);
      if (path === "/api/login" && request.method === "POST") {
        await limitLogin(request, env, now());
        const body = await jsonBody(request);
        if (!(await sameSecret(body.password, env.ADMIN_PASSWORD))) throw new ApiError(401, "登录口令无效");
        return json({ok: true}, 200, {"set-cookie": cookie(await createSession(env, now()))});
      }
      await requireSession(request, env, now());
      if (path === "/api/session" && request.method === "GET") return json({ok: true});
      if (path === "/api/logout" && request.method === "POST") return json({ok: true}, 200, {"set-cookie": cookie("", 0)});
      if (path === "/api/schemas" && request.method === "GET") return json(schemas);
      if (path === "/api/state" && request.method === "GET") {
        const state = await readState(env.DB);
        return json({data: state.data, revision: state.revision, updatedAt: state.updated_at, initialized: state.initialized === 1});
      }
      if ((path === "/api/state" && request.method === "PATCH") || (path === "/api/import" && request.method === "POST")) {
        const body = await jsonBody(request);
        const state = await readState(env.DB);
        checkRevision(request, state);
        const row = path === "/api/state" ? mutate(state, body) : undefined;
        const data = path === "/api/import" ? importBackup(state, body) : state.data;
        return json({...await saveState(env.DB, state, data, now()), row});
      }
      throw new ApiError(404, "接口不存在");
    } catch (error) {
      if (error instanceof ApiError) return json({error: error.message, requestId}, error.status);
      console.error(JSON.stringify({event: "workbench_request_failed", requestId}));
      return json({error: "服务暂时不可用，请稍后重试", requestId}, 500);
    }
  }};
}
export default createWorker();
