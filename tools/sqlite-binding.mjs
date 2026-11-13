// 本地持久 SQLite 与测试 adapter；生产使用 Cloudflare D1 binding。
export function sqliteBinding(database) {
  return {prepare(sql) {
    let values = [];
    return {
      bind(...params) {values = params; return this;},
      async first() {return database.prepare(sql).get(...values) ?? null;},
      async run() {const result = database.prepare(sql).run(...values); return {success: true, meta: {changes: Number(result.changes)}};},
    };
  }};
}
