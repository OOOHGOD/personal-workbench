import {ApiError} from "./state.mjs";
const encoder = new TextEncoder();
const hex = (bytes) => Array.from(new Uint8Array(bytes), (v) => v.toString(16).padStart(2, "0")).join("");
export function configured(env) {
  for (const key of ["ADMIN_PASSWORD", "SESSION_SECRET", "WORKBENCH_READ_TOKEN"]) {
    if (typeof env[key] !== "string" || env[key].length < 32 || /[\r\n]/.test(env[key])) throw new ApiError(503, "服务凭据尚未配置");
  }
  if (new Set([env.ADMIN_PASSWORD, env.SESSION_SECRET, env.WORKBENCH_READ_TOKEN]).size !== 3 || !env.DB) throw new ApiError(503, "服务凭据或数据库未正确配置");
}
export async function sameSecret(left, right) {
  if (typeof left !== "string" || left.length > 1000) return false;
  const [a, b] = await Promise.all([left, right].map((v) => crypto.subtle.digest("SHA-256", encoder.encode(v))));
  let difference = 0;
  const x = new Uint8Array(a), y = new Uint8Array(b);
  for (let i = 0; i < 32; i++) difference |= x[i] ^ y[i];
  return difference === 0;
}
async function sign(text, env) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(env.SESSION_SECRET), {name: "HMAC", hash: "SHA-256"}, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, encoder.encode(text)));
}
export async function createSession(env, now) {
  const payload = `${now + 12 * 3600000}.${crypto.randomUUID()}`;
  return `${payload}.${await sign(payload, env)}`;
}
export const cookie = (value, maxAge = 43200) => `__Host-workbench=${value}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`;
export async function requireSession(request, env, now) {
  const token = /(?:^|;\s*)__Host-workbench=([^;]+)/.exec(request.headers.get("cookie") ?? "")?.[1] ?? "";
  const match = /^(\d{13})\.([a-f0-9-]{36})\.([a-f0-9]{64})$/.exec(token);
  if (!match || Number(match[1]) <= now || Number(match[1]) > now + 12 * 3600000 ||
      !(await sameSecret(match[3], await sign(`${match[1]}.${match[2]}`, env)))) throw new ApiError(401, "请重新登录工作台");
}
export function requireOrigin(request) {
  if (request.headers.get("origin") !== new URL(request.url).origin || request.headers.get("x-workbench-request") !== "1") throw new ApiError(403, "仅允许工作台同源操作");
}
export async function limitLogin(request, env, now) {
  const digest = hex(await crypto.subtle.digest("SHA-256", encoder.encode(`${env.SESSION_SECRET}:${request.headers.get("cf-connecting-ip") ?? "local"}`)));
  const window = Math.floor(now / 300000);
  await env.DB.prepare("DELETE FROM login_attempts WHERE window < ?").bind(window - 1).run();
  const row = await env.DB.prepare("INSERT INTO login_attempts(client_hash, window, attempts) VALUES (?, ?, 1) ON CONFLICT(client_hash, window) DO UPDATE SET attempts = attempts + 1 RETURNING attempts").bind(digest, window).first();
  if (row.attempts > 10) throw new ApiError(429, "登录尝试过多，请稍后再试");
}
