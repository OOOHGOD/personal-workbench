import {resolve, join} from "node:path";
import {pathToFileURL} from "node:url";
import {mkdir, writeFile} from "node:fs/promises";
import {deflateSync} from "node:zlib";

const repository = process.argv[2];
if (!repository) throw new Error("用法：node tools/check-paperboard.mjs <epaper-dashboard目录>");
const base = resolve(repository);
const {createWorker} = await import(pathToFileURL(join(base, "render-worker/src/index.mjs")));
const {parseFrame, unpackIndex3, crc32} = await import(pathToFileURL(join(base, "render-worker/src/protocol.mjs")));
const target = process.env.WORKBENCH_LOCAL_URL || "http://127.0.0.1:8789";
const url = new URL(target);
if (!["127.0.0.1", "localhost"].includes(url.hostname)) throw new Error("此验证工具只连接本地测试服务");
const token = process.env.WORKBENCH_READ_TOKEN;
if (!token) throw new Error("需在环境中设置本地测试只读凭据");
const nativeFetch = globalThis.fetch;
try {
  globalThis.fetch = (source, init) => {
    if (String(source) !== "https://snapshot.example/v1/snapshot") throw new Error("意外上游读取");
    return nativeFetch(`${url.origin}/v1/snapshot`, init);
  };
  const renderer = createWorker({reportFailure() {}});
  const response = await renderer.fetch(new Request("https://render.example/v1/render", {
    method: "POST", headers: {"content-type": "application/json", authorization: "Bearer local-test-device-token-32-characters"},
    body: JSON.stringify({layout: 1, request_id: crypto.randomUUID().replaceAll("-", ""),
      location_name: "本地验证", location_id: "101270106", latitude: "30", longitude: "103"})
  }), {LAYOUT1_CONTENT: "workbench", WORKBENCH_SNAPSHOT_URL: "https://snapshot.example/v1/snapshot", WORKBENCH_READ_TOKEN: token,
    REQUIRE_DEVICE_AUTH: "true", DEVICE_TOKEN: "local-test-device-token-32-characters"});
  if (!response.ok) throw new Error(`渲染未成功：HTTP ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer()), frame = parseFrame(bytes);
  if (frame.layout !== 1 || bytes.length !== 144048) throw new Error("完整帧合同不匹配");
  const palette = [[0,0,0],[255,255,255],[0,180,70],[20,80,210],[210,25,35],[250,220,20],[245,125,25]];
  const rows = Buffer.alloc(480 * 2401);
  for (let y = 0; y < 480; y++) for (let x = 0; x < 800; x++) {
    const rgb = palette[unpackIndex3(frame.payload, 300, x, y)];
    for (let k = 0; k < 3; k++) rows[y * 2401 + 1 + x * 3 + k] = rgb[k];
  }
  function chunk(type, data) {
    const name = Buffer.from(type), length = Buffer.alloc(4), crc = Buffer.alloc(4);
    length.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
    return Buffer.concat([length, name, data, crc]);
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(800); header.writeUInt32BE(480, 4); header[8] = 8; header[9] = 2;
  await mkdir(".local", {recursive: true});
  await writeFile(".local/closed-browser-frame.pbf", bytes);
  await writeFile(".local/closed-browser-frame.png", Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk("IHDR", header), chunk("IDAT", deflateSync(rows)), chunk("IEND", Buffer.alloc(0))]));
  console.log("后台快照 → 鉴权 POST /v1/render → 800×480 完整 PBF：144048 字节，双 CRC 通过；预览保存在 .local/");
} finally {globalThis.fetch = nativeFetch;}
