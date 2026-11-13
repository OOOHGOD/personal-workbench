import {schemas} from "../.generated/assets.mjs";

export const COLLECTIONS = Object.freeze(["tasks", "projects", "research", "notes", "resources", "reports", "airecords"]);
export class ApiError extends Error {
  constructor(status, message) {super(message); this.status = status;}
}
export function requireCollection(name) {
  if (!COLLECTIONS.includes(name)) throw new ApiError(400, "数据表无效");
  return name;
}
function normalizeValue(field, input) {
  const type = field.type;
  let value = input;
  if (input && typeof input === "object" && !Array.isArray(input) && type in input) value = input[type];
  if (value == null) return null;
  if (["text", "select", "date"].includes(type)) {
    if (typeof value !== "string" || value.length > (type === "text" ? 64000 : 2000) || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(value)) throw new ApiError(400, "字段类型或长度无效");
    if (type === "select" && value) {
      const option = field.config?.options?.find((o) => o.text === value || o.id === value);
      if (!option) throw new ApiError(400, "选项无效");
      return option.text;
    }
    if (type === "date" && value && (!/^\d{4}-\d{2}-\d{2}(?:$|T)/.test(value) || !Number.isFinite(Date.parse(value)))) throw new ApiError(400, "日期无效");
    return value;
  }
  if (type === "checkbox" && typeof value === "boolean") return value;
  if (type === "number" && typeof value === "number" && Number.isFinite(value)) return value;
  if (type === "multi_select" && Array.isArray(value) && value.length <= 30 && value.every((x) => typeof x === "string" && x.length <= 200)) return value;
  if (type === "url" && value && typeof value === "object" && typeof value.link === "string" && value.link.length <= 2000 && typeof (value.text ?? "") === "string") {
    let url; try {url = new URL(value.link);} catch {throw new ApiError(400, "链接无效");}
    if (!["http:", "https:"].includes(url.protocol)) throw new ApiError(400, "链接仅支持 HTTP 或 HTTPS");
    return {text: value.text || value.link, link: value.link};
  }
  throw new ApiError(400, "字段类型无效");
}
export function normalizeRecord(collection, properties, base = {}) {
  requireCollection(collection);
  if (!properties || typeof properties !== "object" || Array.isArray(properties)) throw new ApiError(400, "记录无效");
  const result = {...base};
  for (const [key, input] of Object.entries(properties)) {
    if (key === "_id" || key === "_revision") continue;
    const field = schemas[collection].properties.find((p) => p.name === key);
    if (!field) throw new ApiError(400, "字段不存在");
    result[key] = normalizeValue(field, input);
    if (["tasks", "projects"].includes(collection) &&
        typeof result[key] === "string" && result[key].length > 2000) throw new ApiError(400, "任务与项目文本不能超过 2000 字符");
  }
  const title = schemas[collection].properties.find((p) => p.type === "text")?.name;
  if (title && (typeof result[title] !== "string" || !result[title].trim())) throw new ApiError(400, "标题不能为空");
  if (collection === "tasks" && !result.状态) throw new ApiError(400, "任务状态不能为空");
  return result;
}
export async function readState(db) {
  const row = await db.prepare("SELECT * FROM workbench_state WHERE id = 1").first();
  if (!row) throw new ApiError(503, "数据库尚未初始化");
  return {...row, data: JSON.parse(row.data)};
}
export async function saveState(db, state, data, now) {
  const encoded = JSON.stringify(data);
  if (new TextEncoder().encode(encoded).length > 950000) throw new ApiError(413, "工作台数据超过容量上限，请先归档报告");
  const result = await db.prepare("UPDATE workbench_state SET data = ?, updated_at = ?, initialized = 1, revision = revision + 1 WHERE id = 1 AND revision = ? RETURNING revision")
    .bind(encoded, new Date(now).toISOString(), state.revision).first();
  if (!result) throw new ApiError(409, "其他设备已更新，请刷新数据后重试");
  return {revision: result.revision};
}
export function mutate(state, body) {
  const collection = requireCollection(body.collection);
  const rows = state.data[collection];
  if (body.op === "add") {
    if (rows.length >= (collection === "projects" ? 500 : 2000)) throw new ApiError(413, "记录数量超过上限");
    const row = {...normalizeRecord(collection, body.properties), _id: crypto.randomUUID()};
    rows.push(row); return row;
  }
  const index = rows.findIndex((r) => r._id === body.id);
  if (index < 0) throw new ApiError(404, "记录不存在");
  if (body.op === "update") {
    rows[index] = {...normalizeRecord(collection, body.properties, rows[index]), _id: rows[index]._id};
    return rows[index];
  }
  if (body.op === "delete") return rows.splice(index, 1)[0];
  throw new ApiError(400, "操作无效");
}
export function importBackup(state, {mode, backup}) {
  if (!["merge", "replace"].includes(mode) || backup?.formatVersion !== 2) throw new ApiError(400, "备份格式或导入方式无效");
  const data = mode === "replace" ? {} : structuredClone(state.data);
  for (const name of COLLECTIONS) {
    if (!Array.isArray(backup[name]) || backup[name].length > (name === "projects" ? 500 : 2000)) throw new ApiError(400, "备份必须包含全部七张数据表且不超过容量上限");
    if (mode === "replace") data[name] = [];
    const ids = new Set(data[name].map((r) => r._id));
    const incoming = new Set();
    for (const raw of backup[name]) {
      const row = normalizeRecord(name, raw);
      const id = raw._id ?? crypto.randomUUID();
      if (typeof id !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(id) || incoming.has(id)) throw new ApiError(400, "备份记录 ID 无效或重复");
      incoming.add(id);
      if (!ids.has(id)) {data[name].push({...row, _id: id}); ids.add(id);}
    }
    if (data[name].length > (name === "projects" ? 500 : 2000)) throw new ApiError(413, "合并后的记录数量超过上限");
  }
  return data;
}
