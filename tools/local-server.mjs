import {createServer} from "node:http";
import {DatabaseSync} from "node:sqlite";
import {readFileSync, mkdirSync} from "node:fs";
import {join, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import worker from "../server/worker.mjs";
import {sqliteBinding} from "./sqlite-binding.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const dataDir = resolve(root, process.env.WORKBENCH_LOCAL_DIR || ".local");
mkdirSync(dataDir, {recursive: true});
const database = new DatabaseSync(join(dataDir, "workbench.sqlite"));
database.exec("PRAGMA journal_mode=WAL");
if (!database.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='workbench_state'").get()) {
  database.exec(readFileSync(new URL("../migrations/0001_state.sql", import.meta.url), "utf8"));
}
const env = {DB: sqliteBinding(database)};
for (const name of ["ADMIN_PASSWORD", "SESSION_SECRET", "WORKBENCH_READ_TOKEN"]) {
  if (!process.env[name] || process.env[name].length < 32) throw new Error(`本地开发需要设置 ${name}（至少 32 字符，不输出值）`);
  env[name] = process.env[name];
}
const server = createServer(async (incoming, outgoing) => {
  try {
    const controller = new AbortController();
    incoming.on("aborted", () => controller.abort());
    const host = incoming.headers.host || "127.0.0.1";
    const request = new Request(`http://${host}${incoming.url}`, {method: incoming.method,
      headers: incoming.headers, signal: controller.signal,
      ...(!["GET", "HEAD"].includes(incoming.method) ? {body: incoming, duplex: "half"} : {})});
    const response = await worker.fetch(request, env);
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch {outgoing.writeHead(500); outgoing.end("本地服务失败");}
});
const port = Number(process.env.PORT || 8789);
server.listen(port, "127.0.0.1", () => console.log(`工作台本地预览：http://127.0.0.1:${port}（只监听本机）`));
for (const event of ["SIGINT", "SIGTERM"]) process.on(event, () => server.close(() => {database.close(); process.exit(0);}));
