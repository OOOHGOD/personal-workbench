import {readFile, mkdir, writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";

const root = new URL("../", import.meta.url);
const names = ["tasks", "projects", "research", "notes", "resources", "reports", "airecords"];
const schemas = {};
let html = (await readFile(new URL("个人工作学习工作台-离线版.html", root), "utf8")).replace(/\r\n/g, "\n");
for (const name of names) {
  const schema = JSON.parse(await readFile(new URL(`workbench_build/schema_srv_${name}.json`, root), "utf8"));
  html = html.replaceAll(schema.database_id, name);
  schemas[name] = {properties: schema.properties.map(({name, type, config}) => ({name, type, ...(config ? {config} : {})}))};
}
function replaceOnce(from, to) {
  if (!html.includes(from)) throw new Error("工作台源文件结构已变化，请更新构建适配");
  html = html.replace(from, to);
}
replaceOnce('<meta charset="UTF-8">', '<meta charset="UTF-8">\n<script src="/client.js"></script>');
replaceOnce('try { db = window.__SMART_PAGE__ && window.__SMART_PAGE__.database ? window.__SMART_PAGE__.database : null; } catch (e) { db = null; }', 'db = window.workbenchDatabase;');
const start = html.indexOf("  function runImport() {");
const end = html.indexOf("  /* ---------- 清空示例数据", start);
if (start < 0 || end < 0) throw new Error("未找到备份导入入口");
html = html.slice(0, start) + `  function runImport() {
    if (!importPayload || !db) return;
    var mode = $("importMode").value;
    function run() {
      $("importRunBtn").disabled = true;
      db.importBackup(importPayload, mode).then(function () {
        toast("全部数据已原子导入"); closeModal(); return loadData();
      }).then(refreshAll).catch(function (error) {
        $("importRunBtn").disabled = false; toast(error.message);
      });
    }
    if (mode === "replace") confirmDialog("替换会覆盖独立后端的全部记录，请先保留 JSON 备份。确定替换？", run);
    else run();
  }
\n` + html.slice(end);
replaceOnce('if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);\n  else init();', 'db.ready.then(init);');
html = html.replaceAll("WorkBuddy 资料库在线数据表（云端，与你的账号绑定）", "独立云端数据库（网页与墨水屏共用）")
  .replaceAll("网页改动即时写表；在数据表里的改动，本页自动收到并刷新", "网页改动保存到云端；其他设备的改动每 30 秒检查一次")
  .replaceAll("手机 / 电脑登录同一账号打开本页即共用全部数据", "手机 / 电脑登录此工作台即共用全部数据；关闭网页不影响墨水屏读取")
  .replaceAll("先删除云端全部记录再写入文件内容（危险）", "完整校验后一次性替换全部数据（请保留备份）")
  .replaceAll("替换（删云端全部后写入）", "替换（原子覆盖全部数据）")
  .replaceAll("数据存在云端资料库数据表：手机、电脑登录同一账号打开本页即共用；直接改数据表，页面会自动收到更新。", "数据保存在独立云端后端，手机与电脑共用；墨水屏通过单独的只读凭据获取任务与项目摘要。")
  .replaceAll("离线 HTML 版（可下载）仅支持查看缓存数据，本地新增需通过导出/导入 JSON 与云端合并，暂不支持自动补同步——此能力如实标注为「半自动」。", "WorkBuddy 旧页面与本工作台不会自动双向同步；迁移后请在本页继续编辑，旧平台保留作备份。")
  .replaceAll("本工作台通过 WorkBuddy「资料库」skill 搭建、存储和部署", "独立数据后端构建：原界面来自本仓库离线工作台");
replaceOnce("<h2>数据与同步</h2>", '<h2>数据与同步</h2><button class="btn btn-ghost btn-mini" id="backendLogout">退出登录</button>');
if (html.includes("window.__SMART_PAGE__")) throw new Error("构建仍依赖 WorkBuddy 页面宿主");
const hashes = Array.from(html.matchAll(/<script>([\s\S]*?)<\/script>/g), (m) => `'sha256-${createHash("sha256").update(m[1]).digest("base64")}'`);
const csp = `default-src 'self'; script-src 'self' ${hashes.join(" ")}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'`;
const client = await readFile(new URL("client/database.js", root), "utf8");
await mkdir(new URL(".generated/", root), {recursive: true});
await writeFile(new URL(".generated/assets.mjs", root), `export const html=${JSON.stringify(html)};\nexport const client=${JSON.stringify(client)};\nexport const schemas=${JSON.stringify(schemas)};\nexport const csp=${JSON.stringify(csp)};\n`);
console.log("已构建独立工作台页面、数据客户端和七表 schema");
