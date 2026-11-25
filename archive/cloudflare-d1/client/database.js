(function () {
  "use strict";
  var cache = null, revision = null, schemas = null, callbacks = [];
  var resolveReady, loginBox;
  var ready = new Promise(function (resolve) {resolveReady = resolve;});
  function notice(message) {
    var box = document.getElementById("backendNotice");
    if (!box) {
      box = document.createElement("p"); box.id = "backendNotice"; box.setAttribute("role", "status");
      box.style.cssText = "padding:12px;margin:12px;background:#fff4d6;color:#533f00;border-radius:8px";
      var capture = document.querySelector(".capture-bar");
      if (capture) capture.before(box); else document.body.prepend(box);
    }
    box.textContent = message; box.hidden = !message;
  }
  async function api(path, options) {
    options = options || {};
    var response = await fetch(path, {method: options.method || "GET", credentials: "same-origin", cache: "no-store",
      headers: Object.assign({}, options.body ? {"content-type": "application/json", "x-workbench-request": "1"} : {}, options.headers || {}),
      body: options.body ? JSON.stringify(options.body) : undefined});
    var data = await response.json();
    if (!response.ok) {
      if (response.status === 401 && path !== "/api/login") showLogin();
      if (response.status === 409) notice("其他设备已更新。请先用顶部刷新按钮读取新数据，核对后再保存当前修改。");
      throw new Error(data.error || "工作台服务请求失败");
    }
    return data;
  }
  async function load() {
    cache = await api("/api/state"); revision = cache.revision;
    notice(cache.initialized ? "" : "新后端尚未导入数据。请在「数据与设置」导入 WorkBuddy JSON 备份；旧平台数据会保留。");
    return cache;
  }
  function notify() {callbacks.forEach(function (cb) {cb({databaseIds: Object.keys(schemas || {})});});}
  async function connected() {
    schemas = await api("/api/schemas"); await load();
    if (loginBox) loginBox.remove(); loginBox = null;
    resolveReady(); notify();
  }
  function showLogin() {
    if (loginBox || !document.body) return;
    loginBox = document.createElement("section");
    loginBox.setAttribute("aria-label", "登录工作台");
    loginBox.style.cssText = "position:fixed;inset:0;z-index:99999;background:#eef3f0;display:grid;place-items:center;padding:24px";
    loginBox.innerHTML = '<form style="background:white;padding:32px;max-width:400px;width:100%;border-radius:16px"><h2>个人工作学习工作台</h2><p style="margin:16px 0">登录后，数据将保存在独立云端；关闭网页不影响墨水屏读取。</p><label>工作台登录口令<input name="password" type="password" required autocomplete="current-password" style="display:block;width:100%;margin:8px 0 16px;padding:10px"></label><button type="submit" class="btn btn-primary">登录工作台</button><p role="status" style="margin-top:12px;color:#a32b35"></p></form>';
    loginBox.querySelector("form").addEventListener("submit", async function (event) {
      event.preventDefault();
      var form = event.currentTarget, button = form.querySelector("button"), status = form.querySelector('[role="status"]');
      button.disabled = true; status.textContent = "正在登录…";
      try {await api("/api/login", {method: "POST", body: {password: form.elements.password.value}}); form.elements.password.value = ""; await connected();}
      catch (error) {status.textContent = error.message; button.disabled = false;}
    });
    document.body.appendChild(loginBox);
  }
  async function write(body, path) {
    if (revision === null) await load();
    var data = await api(path || "/api/state", {method: path ? "POST" : "PATCH", headers: {"if-match": String(revision)}, body: body});
    revision = data.revision; cache = null;
    return data.row || data;
  }
  window.workbenchDatabase = {
    ready: ready,
    query: async function (input) {
      if ((input.databaseId === "tasks" && !input.startCursor) || !cache) await load();
      var rows = cache.data[input.databaseId];
      if (!rows) throw new Error("数据表不存在");
      var start = Number(input.startCursor || 0), end = start + 200;
      return {results: structuredClone(rows.slice(start, end)), hasMore: end < rows.length, nextCursor: end < rows.length ? String(end) : null};
    },
    getSchema: async function (input) {await ready; return schemas[input.databaseId];},
    addRecord: function (input) {return write({op: "add", collection: input.databaseId, properties: input.properties});},
    updateRecord: function (input) {return write({op: "update", collection: input.databaseId, id: input.recordId, properties: input.properties});},
    deleteRecord: function (input) {return write({op: "delete", collection: input.databaseId, id: input.recordId});},
    importBackup: function (backup, mode) {return write({backup: backup, mode: mode}, "/api/import");},
    onUpdated: function (callback) {callbacks.push(callback);},
    logout: async function () {await api("/api/logout", {method: "POST", body: {}}); cache = null; revision = null; location.reload();}
  };
  function boot() {
    api("/api/session").then(connected).catch(function () {showLogin();});
    setInterval(async function () {
      if (document.hidden || revision === null || loginBox) return;
      try {
        var current = await api("/api/state");
        if (current.revision !== revision) {cache = null; notify();}
      } catch (error) {var status = document.getElementById("syncStatus"); if (status) status.textContent = "同步失败，请刷新重试";}
    }, 30000);
    document.addEventListener("click", function (event) {if (event.target.id === "backendLogout") window.workbenchDatabase.logout().catch(function () {location.reload();});});
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
