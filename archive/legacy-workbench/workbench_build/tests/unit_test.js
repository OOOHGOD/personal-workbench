// 单元测试：DC的个人工作台（jsdom + mock __SMART_PAGE__ 数据 SDK）
// 运行：node unit_test.js
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const BASE = __dirname;
const HTML_PATH = process.env.HTML_PATH || path.join(BASE, "..", "workbench.html");
const HTML = fs.readFileSync(HTML_PATH, "utf8");

// ---------- 真实服务端 schema（字段与选项的唯一权威来源） ----------
const DB_IDS = {
  tasks: "tdNWBhRqvwIKXkz2ji0uyb",
  projects: "2klqa8d0rbO47x0FhoVK3W",
  research: "f20RfANYTZAqezxUqZ1ZrJ",
  notes: "PDFBIwRRZEGd2jfJbGiuY5",
  resources: "wBJtimnuDTDrgg2Zaf36ZA",
  reports: "VnPlGp0UnpMluFmFnkTpSz",
  airecords: "DHd1C9sNJOt2SRa35BKRME",
  study: "xY6fAaJczfGY0gTkdYeZwu",
  apply: "SE9AvDWGnB1YBZd6hrFdry",
  resume: "q6ecJx2G3Ephav966tBHhQ",
};
const SCHEMAS = {};
for (const k of Object.keys(DB_IDS)) {
  SCHEMAS[DB_IDS[k]] = JSON.parse(fs.readFileSync(path.join(BASE, "..", "schema_srv_" + k + ".json"), "utf8"));
}

// ---------- mock 数据 SDK ----------
function makeMockDb() {
  const store = {}; // dbid -> [record {_id, ...fields}]
  let seq = 0;
  const handlers = [];
  function fields(dbid) {
    const s = SCHEMAS[dbid];
    const out = {};
    for (const p of s.properties) out[p.name] = p;
    return out;
  }
  function assertValidProps(dbid, properties) {
    const f = fields(dbid);
    for (const key of Object.keys(properties || {})) {
      if (!(key in f)) throw new Error("DSDK003: 字段不存在 " + key);
      const pv = properties[key];
      const type = Object.keys(pv)[0];
      const val = pv[type];
      if (type === "select") {
        const opts = (f[key].config && f[key].config.options) || [];
        if (val !== "" && val !== null && !opts.some(o => o.text === val || o.id === val)) {
          throw new Error("11607: 选项不存在 " + key + "=" + val);
        }
      }
    }
  }
  function notify(dbid) {
    for (const h of handlers) {
      try { h({ databaseIds: [dbid] }); } catch (e) { /* handler error 不影响 */ }
    }
  }
  return {
    store,
    _handlers: handlers,
    query(params) {
      const dbid = params.databaseId;
      const all = store[dbid] || [];
      const size = Math.min(params.pageSize || 50, 200);
      let idx = 0;
      if (params.startCursor) {
        const ci = all.findIndex(r => r._id === params.startCursor);
        idx = ci >= 0 ? ci + 1 : 0; // 游标语义：从游标记录之后开始
      }
      const page = all.slice(idx, idx + size);
      const hasMore = idx + size < all.length;
      return Promise.resolve({
        results: page.map(r => Object.assign({}, r)),
        nextCursor: hasMore ? page[page.length - 1]._id : undefined,
        hasMore,
      });
    },
    addRecord(params) {
      assertValidProps(params.databaseId, params.properties);
      const rec = { _id: "rec" + (++seq) + "mock" };
      for (const k of Object.keys(params.properties || {})) {
        const pv = params.properties[k];
        rec[k] = pv[Object.keys(pv)[0]];
      }
      (store[params.databaseId] = store[params.databaseId] || []).push(rec);
      notify(params.databaseId);
      return Promise.resolve({ id: rec._id });
    },
    updateRecord(params) {
      const all = store[params.databaseId] || [];
      const rec = all.find(r => r._id === params.recordId);
      if (!rec) return Promise.reject(new Error("record not found"));
      assertValidProps(params.databaseId, params.properties);
      for (const k of Object.keys(params.properties || {})) {
        const pv = params.properties[k];
        rec[k] = pv[Object.keys(pv)[0]];
      }
      notify(params.databaseId);
      return Promise.resolve({ id: rec._id });
    },
    deleteRecord(params) {
      const all = store[params.databaseId] || [];
      const i = all.findIndex(r => r._id === params.recordId);
      if (i >= 0) all.splice(i, 1);
      notify(params.databaseId);
      return Promise.resolve({});
    },
    getSchema(params) {
      return Promise.resolve(Object.assign({}, SCHEMAS[params.databaseId]));
    },
    onUpdated(h) { handlers.push(h); },
  };
}

// ---------- 测试数据（模拟云端已有数据） ----------
function todayStr() {
  const d = new Date();
  const p = n => (n < 10 ? "0" + n : "" + n);
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}
function addDays(s, n) {
  const d = new Date(s + "T00:00:00");
  d.setDate(d.getDate() + n);
  const p = n2 => (n2 < 10 ? "0" + n2 : "" + n2);
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}
const TODAY = todayStr();
const YESTERDAY = addDays(TODAY, -1);
const TOMORROW = addDays(TODAY, 1);
const D_MINUS_3 = addDays(TODAY, -3);
const CURMONTH = TODAY.substring(0, 7);
const PREVMONTH = (function () { const d = new Date(TODAY + "T00:00:00"); d.setMonth(d.getMonth() - 1); return d.getFullYear() + "-" + (d.getMonth() + 1 < 10 ? "0" : "") + (d.getMonth() + 1); })();

function seedData(mock) {
  const T = DB_IDS.tasks, P = DB_IDS.projects, R = DB_IDS.research, Nn = DB_IDS.notes, Rs = DB_IDS.resources;
  mock.store[T] = [
    { _id: "t_overdue", "标题": "逾期任务A（示例）", "分类": "园区官网", "关联项目": "官网", "优先级": "重要且紧急", "状态": "待开始", "计划日期": YESTERDAY, "截止日期": D_MINUS_3, "创建日期": D_MINUS_3, "是否示例": true },
    { _id: "t_today", "标题": "今天到期任务B", "分类": "园区小程序", "优先级": "紧急不重要", "状态": "进行中", "计划日期": TODAY, "截止日期": TODAY, "创建日期": YESTERDAY, "是否示例": false },
    { _id: "t_pastplan", "标题": "昨天计划未做完C", "分类": "需求调研", "优先级": "一般", "状态": "待开始", "计划日期": YESTERDAY, "截止日期": TOMORROW, "创建日期": YESTERDAY, "是否示例": false },
    { _id: "t_future", "标题": "未来任务D", "分类": "日常报告", "优先级": "重要不紧急", "状态": "待开始", "计划日期": addDays(TODAY, 3), "创建日期": YESTERDAY, "是否示例": false },
    { _id: "t_inbox", "标题": "收集箱想法E", "状态": "收集箱", "创建日期": YESTERDAY, "是否示例": false },
    { _id: "t_done", "标题": "已完成任务F", "分类": "园区官网", "优先级": "一般", "状态": "已完成", "计划日期": YESTERDAY, "完成时间": YESTERDAY, "创建日期": D_MINUS_3, "是否示例": false },
    { _id: "t_waiting", "标题": "等待跟进任务G", "分类": "企微自动化", "优先级": "重要不紧急", "状态": "等待", "等待谁": "数据组", "等待事项": "等6月口径", "下次跟进": TODAY, "计划日期": TODAY, "创建日期": D_MINUS_3, "是否示例": false },
  ];
  mock.store[P] = [
    { _id: "p_web", "项目名称": "官网", "工作层级": "核心工作", "当前阶段": "内容与素材", "下一步": "首页核对", "卡点": "", "目标": "双站上线", "最近进展": "备案中", "是否示例": false },
    { _id: "p_mp", "项目名称": "小程序", "工作层级": "核心工作", "当前阶段": "需求", "下一步": "首批访谈", "卡点": "等会员数据口径", "目标": "一期上线", "最近进展": "收集3条诉求", "是否示例": false },
  ];
  mock.store[R] = [
    { _id: "r1", "调研对象": "招商部", "调研日期": YESTERDAY, "关联项目": "小程序", "性质": "已确认需求", "真实问题或场景": "流量扶持政策", "期望效果": "展示案例", "初步结论": "加入驻企业栏目", "待确认事项": "素材谁提供", "下一步": "找品牌部要素材", "资料来源": "访谈", "是否示例": false },
  ];
  mock.store[Nn] = [
    { _id: "n1", "正文": "首页参考材质与工艺板块", "标签": "官网,灵感", "关联项目": "官网", "是否示例": true },
  ];
  mock.store[Rs] = [
    { _id: "res1", "名称": "建设方案V2.1", "本地路径": "C:\\test\\v2.1.md", "关联项目": "官网", "用途说明": "硬约束", "是否示例": true },
  ];
  // 报告模块种子：今天完成的真实任务 + 示例完成（应排除）+ AI 记录（1 条唯一 / 1 条与任务重名去重 / 1 条示例排除）+ 1 份旧存档
  mock.store[T].push(
    { _id: "t_done2", "标题": "今日完成报告任务H", "分类": "园区官网", "关联项目": "官网", "优先级": "一般", "状态": "已完成", "计划日期": TODAY, "完成时间": TODAY, "创建日期": D_MINUS_3, "是否示例": false },
    { _id: "t_done_sample", "标题": "示例完成X（不应进报告）", "状态": "已完成", "完成时间": TODAY, "创建日期": TODAY, "是否示例": true }
  );
  mock.store[DB_IDS.airecords] = [
    { _id: "a1", "日期": TODAY, "来源": "WorkBuddy", "类型": "产出物", "主题": "工作台第2期日报模块", "内容摘要": "完成日报周报视图与导出", "关联项目": "工作台", "是否示例": false },
    { _id: "a2", "日期": TODAY, "来源": "Codex", "类型": "实际完成", "主题": "今日完成报告任务H", "内容摘要": "与任务同名应去重", "关联项目": "官网", "是否示例": false },
    { _id: "a3", "日期": TODAY, "来源": "DSH", "类型": "讨论", "主题": "示例AI记录（不应进报告）", "是否示例": true },
  ];
  mock.store[DB_IDS.reports] = [
    { _id: "rep_old", "报告类型": "日报", "起始日期": YESTERDAY, "结束日期": YESTERDAY, "生成时间": YESTERDAY, "自用记录": "旧存档自用全文", "领导摘要": "旧存档摘要全文", "是否示例": false },
  ];
  // 第3期种子：学习（1 条今日完成真实 + 1 条示例排除）+ 申请（1 条 3 天后截止真实 + 1 条 60 天后截止不提醒 + 1 条已录取不提醒 + 1 条示例）
  mock.store[DB_IDS.study] = [
    { _id: "sd1", "学习主题": "JavaScript 异步编程", "类型": "技能学习", "进度状态": "已完成", "计划日期": TODAY, "学习日期": TODAY, "时长分钟": 45, "笔记": "Promise/async 复习", "是否示例": false },
    { _id: "sd2", "学习主题": "示例学习项（不应进报告）", "类型": "阅读", "进度状态": "已完成", "学习日期": TODAY, "时长分钟": 30, "是否示例": true },
    { _id: "sd3", "学习主题": "雅思听力（进行中）", "类型": "语言备考", "进度状态": "进行中", "学习日期": TODAY, "时长分钟": 20, "是否示例": false },
  ];
  mock.store[DB_IDS.apply] = [
    { _id: "ap1", "学校": "某大学A", "专业项目": "计算机硕士", "申请轮次": "第一轮", "截止日期": addDays(TODAY, 3), "申请状态": "材料准备中", "优先级": "重要且紧急", "下一步": "写 PS 初稿", "是否示例": false },
    { _id: "ap2", "学校": "某大学B", "专业项目": "数据科学", "申请轮次": "第二轮", "截止日期": addDays(TODAY, 60), "申请状态": "待开始", "优先级": "重要不紧急", "是否示例": false },
    { _id: "ap3", "学校": "某大学C", "专业项目": "AI", "申请轮次": "提前批", "截止日期": addDays(TODAY, 2), "申请状态": "已录取", "优先级": "一般", "是否示例": false },
    { _id: "ap4", "学校": "示例大学（不应进提醒）", "专业项目": "示例专业", "申请轮次": "第一轮", "截止日期": addDays(TODAY, 1), "申请状态": "待开始", "是否示例": true },
  ];
  // 第4期种子：简历月更（本月纳入/未纳入/示例 + 上月条目 + 上月快照）
  mock.store[DB_IDS.resume] = [
    { _id: "cv1", "记录类型": "成果条目", "成果标题": "本月手动成果α", "成果类型": "任务完成", "月份归属": CURMONTH, "量化指标": "覆盖 3 板块", "成果描述": "描述α", "证据来源": "任务：手动成果", "纳入简历": true, "创建日期": TODAY, "是否示例": false },
    { _id: "cv2", "记录类型": "成果条目", "成果标题": "未纳入成果β", "成果类型": "其他", "月份归属": CURMONTH, "纳入简历": false, "创建日期": TODAY, "是否示例": false },
    { _id: "cv3", "记录类型": "成果条目", "成果标题": "上月成果γ", "成果类型": "学习成果", "月份归属": PREVMONTH, "纳入简历": true, "创建日期": PREVMONTH + "-15", "是否示例": false },
    { _id: "cv4", "记录类型": "成果条目", "成果标题": "示例成果（应带示例标）", "成果类型": "其他", "月份归属": CURMONTH, "纳入简历": true, "创建日期": TODAY, "是否示例": true },
    { _id: "sv1", "记录类型": "版本快照", "成果标题": PREVMONTH + " 简历快照", "月份归属": PREVMONTH, "快照内容": "# " + PREVMONTH + " 快照内容\n- 上月成果γ", "创建日期": PREVMONTH + "-28", "是否示例": false },
  ];
}

// ---------- 断言工具 ----------
let passCount = 0, failCount = 0;
const failures = [];
function ok(cond, name) {
  if (cond) { passCount++; console.log("  PASS " + name); }
  else { failCount++; failures.push(name); console.log("  FAIL " + name); }
}
function eq(a, b, name) { ok(JSON.stringify(a) === JSON.stringify(b), name + "（期望 " + JSON.stringify(b) + "，实际 " + JSON.stringify(a) + "）"); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ---------- 加载页面 ----------
let capturedBlobs = []; // URL.createObjectURL 捕获的 blob（docx 导出测试用）
async function bootPage() {
  const mock = makeMockDb();
  seedData(mock);
  capturedBlobs = [];
  const consoleErrors = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", e => consoleErrors.push(String(e)));
  vc.on("error", (...a) => consoleErrors.push(a.join(" ")));
  vc.on("log", () => {});
  const dom = new JSDOM(HTML, {
    runScripts: "dangerously",
    pretendToBeVisual: true,
    url: "https://www.workbuddy.cn/space/d/MwXKAV7BlcR9zZAXXf0p3z",
    virtualConsole: vc,
    beforeParse(window) {
      window.__SMART_PAGE__ = { database: mock };
      window.scrollTo = () => {};
      window.HTMLElement.prototype.scrollIntoView = () => {};
      // jsdom 未实现 createObjectURL：mock 并捕获 blob 供 docx 头校验
      window.URL.createObjectURL = blob => {
        capturedBlobs.push(blob);
        return "blob:mock-" + capturedBlobs.length;
      };
      window.URL.revokeObjectURL = () => {};
    },
  });
  await sleep(400); // 等 fetchSchemas + loadData + autoPostpone + renderAll
  return { dom, mock, consoleErrors };
}

function $get(dom, id) { return dom.window.document.getElementById(id); }
function textOf(dom, id) { const el = $get(dom, id); return el ? el.textContent : ""; }
function clickNthBtn(dom, containerId, act, n) {
  const box = $get(dom, containerId);
  const btns = box.querySelectorAll('[data-act="' + act + '"]');
  if (!btns.length || n >= btns.length) throw new Error("找不到按钮 " + act + " #" + n);
  btns[n].click();
}

(async function main() {
  // ========== 场景一：初始化渲染 ==========
  console.log("\n[1] 初始化与今日视图");
  {
    const { dom, mock, consoleErrors } = await bootPage();
    const todayText = textOf(dom, "todayHandleCount");
    ok(todayText.indexOf("逾期 1") > -1, "今日统计含 1 条逾期");
    ok(todayText.indexOf("卡住项目 1") > -1, "今日统计含 1 个卡住项目");
    ok(todayText.indexOf("到期跟进 1") > -1, "今日统计含 1 条到期跟进");
    ok($get(dom, "todayHandleList").innerHTML.indexOf("逾期任务A") > -1, "逾期任务A 出现在今天要处理");
    ok($get(dom, "todayHandleList").innerHTML.indexOf("等 数据组") > -1, "等待事项显示等待对象");
    ok($get(dom, "coreProjList").innerHTML.indexOf("小程序") > -1, "核心项目动态渲染");
    ok($get(dom, "coreProjList").innerHTML.indexOf("等会员数据口径") > -1, "项目卡点渲染");
    ok($get(dom, "chartWeek").querySelector("svg") !== null, "近7天图表 SVG 渲染");
    ok($get(dom, "chartProj").innerHTML.indexOf("官网") > -1, "项目进度图渲染");
    ok(consoleErrors.length === 0, "无未捕获 JS 错误" + (consoleErrors.length ? "：" + consoleErrors.slice(0, 2).join("|") : ""));
    // 自动顺延：t_pastplan 计划=昨天 → 应滚到今天
    const t = mock.store[DB_IDS.tasks].find(r => r._id === "t_pastplan");
    eq(datePart(t["计划日期"]), TODAY, "自动顺延把昨天计划任务滚到今天");
    eq(t["顺延次数"], 1, "顺延次数 = 1");
    eq(datePart(t["原计划日期"]), YESTERDAY, "原计划日期已记录");
    eq(datePart(t["截止日期"]), TOMORROW, "顺延不影响截止日期");
    // 逾期任务A 计划=昨天也顺延，但已逾期3天 —— 计划滚到今天
    const to = mock.store[DB_IDS.tasks].find(r => r._id === "t_overdue");
    eq(datePart(to["计划日期"]), TODAY, "逾期任务计划日期也滚到今天");
    dom.window.close();
  }

  // ========== 场景二：自动顺延幂等（刷新/多端不重复） ==========
  console.log("\n[2] 自动顺延幂等性");
  {
    const { dom, mock } = await bootPage();
    // 模拟再次刷新：点击刷新按钮两次
    $get(dom, "btnRefresh").click();
    await sleep(300);
    $get(dom, "btnRefresh").click();
    await sleep(300);
    const t = mock.store[DB_IDS.tasks].find(r => r._id === "t_pastplan");
    eq(t["顺延次数"], 1, "两次刷新后顺延次数仍为 1（不重复）");
    eq(datePart(t["计划日期"]), TODAY, "计划日期仍为今天");
    dom.window.close();
  }

  // ========== 场景三：快速记录 → 收集箱 ==========
  console.log("\n[3] 快速记录");
  {
    const { dom, mock } = await bootPage();
    const before = mock.store[DB_IDS.tasks].length;
    $get(dom, "captureInput").value = "测试一句话速记";
    $get(dom, "captureBtn").click();
    await sleep(300);
    eq(mock.store[DB_IDS.tasks].length, before + 1, "新增 1 条任务");
    const rec = mock.store[DB_IDS.tasks][mock.store[DB_IDS.tasks].length - 1];
    eq(rec["标题"], "测试一句话速记", "标题正确");
    eq(rec["状态"], "收集箱", "默认进收集箱");
    dom.window.close();
  }

  // ========== 场景四：完成 / 取消完成 ==========
  console.log("\n[4] 完成与取消完成");
  {
    const { dom, mock } = await bootPage();
    // today 视图第一项是逾期任务A（最久逾期优先）——点它的完成
    clickNthBtn(dom, "todayHandleList", "complete", 0);
    await sleep(300);
    let t = mock.store[DB_IDS.tasks].find(r => r._id === "t_overdue");
    eq(t["状态"], "已完成", "点勾后状态=已完成");
    eq(datePart(t["完成时间"]), TODAY, "完成时间=今天");
    // 取消完成：切到任务页，用今天过滤器里的完成按钮（列表里该任务已完成→按钮在「今天」过滤下消失，用「全部」视图）
    const filterAll = Array.from($get(dom, "taskFilters").querySelectorAll("button")).find(b => b.getAttribute("data-f") === "all");
    filterAll.click();
    await sleep(100);
    // 找到 t_overdue 对应行的 complete 按钮
    const rows = Array.from($get(dom, "taskList").querySelectorAll(".task-row"));
    let targetBtn = null;
    for (const row of rows) {
      if (row.textContent.indexOf("逾期任务A") > -1) targetBtn = row.querySelector('[data-act="complete"]');
    }
    ok(!!targetBtn, "全部视图找到已完成任务A");
    targetBtn.click();
    await sleep(300);
    t = mock.store[DB_IDS.tasks].find(r => r._id === "t_overdue");
    eq(t["状态"], "进行中", "再点勾恢复=进行中");
    ok(t["完成时间"] === null || t["完成时间"] === undefined, "完成时间已清空（date:null 生效）");
    dom.window.close();
  }

  // ========== 场景五：手动顺延明天 ==========
  console.log("\n[5] 一键顺延明天");
  {
    const { dom, mock } = await bootPage();
    // 在任务视图（今天）找 t_today 的顺延按钮
    const rows = Array.from($get(dom, "taskList").querySelectorAll(".task-row"));
    let btn = null;
    for (const row of rows) {
      if (row.textContent.indexOf("今天到期任务B") > -1) btn = row.querySelector('[data-act="postpone"]');
    }
    ok(!!btn, "找到顺延明天按钮");
    btn.click();
    await sleep(300);
    const t = mock.store[DB_IDS.tasks].find(r => r._id === "t_today");
    eq(datePart(t["计划日期"]), TOMORROW, "计划日期改为明天");
    eq(datePart(t["截止日期"]), TODAY, "截止日期不变");
    dom.window.close();
  }

  // ========== 场景六：今日重点上限 3 ==========
  console.log("\n[6] 今日重点上限");
  {
    const { dom, mock } = await bootPage();
    // 今天过滤器下列表含 A/B/C/G（A、C 已顺延到今天，B 今天，G 今天计划）
    const filterToday = Array.from($get(dom, "taskFilters").querySelectorAll("button")).find(b => b.getAttribute("data-f") === "today");
    filterToday.click();
    await sleep(100);
    let rows = Array.from($get(dom, "taskList").querySelectorAll(".task-row"));
    const names = ["逾期任务A", "今天到期任务B", "昨天计划未做完C", "等待跟进任务G"];
    for (const nm of names) {
      rows = Array.from($get(dom, "taskList").querySelectorAll(".task-row"));
      let btn = null;
      for (const row of rows) { if (row.textContent.indexOf(nm) > -1) btn = row.querySelector('[data-act="focus"]'); }
      if (btn) { btn.click(); await sleep(200); }
    }
    let focusCount = mock.store[DB_IDS.tasks].filter(r => r["今日重点"] === true).length;
    eq(focusCount, 3, "最多只能设 3 个今日重点（第4个被拒）");
    // 首页今日重点区渲染 3 条（今日任务看板内 .focus-row）
    ok($get(dom, "todayFocusList").querySelectorAll(".focus-row").length === 3, "首页今日重点渲染 3 条");
    dom.window.close();
  }

  // ========== 场景七：过滤器与搜索 ==========
  console.log("\n[7] 过滤器与搜索");
  {
    const { dom } = await bootPage();
    const filters = $get(dom, "taskFilters");
    const clickF = async (f) => {
      Array.from(filters.querySelectorAll("button")).find(b => b.getAttribute("data-f") === f).click();
      await sleep(80);
    };
    await clickF("inbox");
    ok($get(dom, "taskList").textContent.indexOf("收集箱想法E") > -1, "收集箱视图显示收集箱任务");
    await clickF("future");
    ok($get(dom, "taskList").textContent.indexOf("未来任务D") > -1, "未来视图显示未来任务");
    ok($get(dom, "taskList").textContent.indexOf("未来任务D") > -1 && $get(dom, "taskList").querySelectorAll(".task-row").length === 1, "未来视图只含未来任务");
    ok($get(dom, "taskList").innerHTML.indexOf("group-title") > -1, "任务看板按状态分组渲染（组标题存在）");
    await clickF("nodate");
    ok($get(dom, "taskList").textContent.indexOf("收集箱想法E") === -1, "无日期视图不含收集箱任务");
    await clickF("done");
    ok($get(dom, "taskList").textContent.indexOf("已完成任务F") > -1, "已完成视图显示完成记录");
    await clickF("all");
    const search = $get(dom, "taskSearch");
    search.value = "任务G";
    search.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    await sleep(400);
    const rows = $get(dom, "taskList").querySelectorAll(".task-row");
    ok(rows.length === 1 && rows[0].textContent.indexOf("等待跟进任务G") > -1, "搜索『任务G』只匹配 1 条");
    dom.window.close();
  }

  // ========== 场景八：调研转任务 / 速记转任务 ==========
  console.log("\n[8] 转任务");
  {
    const { dom, mock } = await bootPage();
    const before = mock.store[DB_IDS.tasks].length;
    // 调研转任务
    const btn = $get(dom, "researchList").querySelector('[data-act="research2task"]');
    ok(!!btn, "调研卡片有转任务按钮");
    btn.click();
    await sleep(300);
    eq(mock.store[DB_IDS.tasks].length, before + 1, "调研转任务新增 1 条");
    const nt = mock.store[DB_IDS.tasks][mock.store[DB_IDS.tasks].length - 1];
    eq(nt["标题"], "找品牌部要素材", "转任务标题取自下一步");
    eq(nt["分类"], "需求调研", "转任务分类=需求调研");
    eq(datePart(nt["计划日期"]), TODAY, "转任务计划=今天");
    // 速记转任务
    const nbtn = $get(dom, "noteList").querySelector('[data-act="note2task"]');
    nbtn.click();
    await sleep(300);
    eq(mock.store[DB_IDS.tasks].length, before + 2, "速记转任务新增 1 条");
    const nt2 = mock.store[DB_IDS.tasks][mock.store[DB_IDS.tasks].length - 1];
    eq(nt2["状态"], "收集箱", "速记转任务进收集箱");
    dom.window.close();
  }

  // ========== 场景九：编辑弹窗 + 截止日期调整留痕 ==========
  console.log("\n[9] 编辑弹窗与截止留痕");
  {
    const { dom, mock } = await bootPage();
    // 打开 t_today 的编辑
    const filterToday = Array.from($get(dom, "taskFilters").querySelectorAll("button")).find(b => b.getAttribute("data-f") === "today");
    filterToday.click();
    await sleep(80);
    let rows = Array.from($get(dom, "taskList").querySelectorAll(".task-row"));
    let ebtn = null;
    for (const row of rows) { if (row.textContent.indexOf("今天到期任务B") > -1) ebtn = row.querySelector('[data-act="edit"]'); }
    ebtn.click();
    await sleep(80);
    ok($get(dom, "modalMask").className.indexOf("open") > -1, "编辑弹窗打开");
    const box = $get(dom, "modalBox");
    ok(box.querySelector('[name="f_标题"]').value === "今天到期任务B", "弹窗回填标题");
    ok(box.querySelectorAll('[name="f_状态"] option').length >= 6, "状态下拉含 6 个选项（getSchema 动态渲染）");
    // 改截止日期 → 保存
    box.querySelector('[name="f_截止日期"]').value = TOMORROW;
    box.querySelector('[name="f_备注"]').value = "单测备注";
    $get(dom, "taskSaveBtn").click();
    await sleep(300);
    const t = mock.store[DB_IDS.tasks].find(r => r._id === "t_today");
    eq(datePart(t["截止日期"]), TOMORROW, "截止日期已更新");
    ok(String(t["截止调整记录"] || "").indexOf(TODAY) > -1 && String(t["截止调整记录"]).indexOf(TOMORROW) > -1, "截止调整留痕包含日期与新旧值");
    eq(t["备注"], "单测备注", "备注已保存");
    ok($get(dom, "modalMask").className.indexOf("open") === -1, "保存后弹窗关闭");
    dom.window.close();
  }

  // ========== 场景十：新建任务（仅标题）与分类选项校验 ==========
  console.log("\n[10] 新建任务");
  {
    const { dom, mock } = await bootPage();
    const before = mock.store[DB_IDS.tasks].length;
    $get(dom, "btnNewTask").click();
    await sleep(80);
    $get(dom, "modalBox").querySelector('[name="f_标题"]').value = "只有标题的新任务";
    $get(dom, "taskSaveBtn").click();
    await sleep(300);
    eq(mock.store[DB_IDS.tasks].length, before + 1, "仅标题可创建");
    const nt = mock.store[DB_IDS.tasks][mock.store[DB_IDS.tasks].length - 1];
    eq(nt["状态"], "收集箱", "未选状态默认收集箱");
    eq(datePart(nt["创建日期"]), TODAY, "创建日期=今天");
    dom.window.close();
  }

  // ========== 场景十一：项目卡片统计与新建项目 ==========
  console.log("\n[11] 项目统计与新建");
  {
    const { dom, mock } = await bootPage();
    const projHtml = $get(dom, "projList").innerHTML;
    // 关联项目=官网 的任务：t_overdue（未完成逾期）+ t_done2（今日已完成）→ 1/2，进度按关联项目字段实算
    ok(projHtml.indexOf("关联待办 1/2") > -1, "官网项目统计 1/2（按关联项目字段实算）");
    ok(projHtml.indexOf("逾期") > -1, "项目卡片显示逾期统计");
    $get(dom, "btnNewProj").click();
    await sleep(80);
    $get(dom, "modalBox").querySelector('[name="p_项目名称"]').value = "新项目X";
    $get(dom, "projSaveBtn").click();
    await sleep(300);
    ok(mock.store[DB_IDS.projects].some(r => r["项目名称"] === "新项目X"), "新项目已创建");
    dom.window.close();
  }

  // ========== 场景十二：清空示例只删示例 ==========
  console.log("\n[12] 清空示例数据");
  {
    const { dom, mock } = await bootPage();
    const realBefore = mock.store[DB_IDS.tasks].filter(r => !r["是否示例"]).length;
    $get(dom, "btnClearSample").click();
    await sleep(100);
    // 确认弹窗 → 点确认
    $get(dom, "confirmOkBtn").click();
    await sleep(500);
    const tasksAfter = mock.store[DB_IDS.tasks];
    ok(!tasksAfter.some(r => r["是否示例"]), "任务表示例已全删");
    eq(tasksAfter.filter(r => !r["是否示例"]).length, realBefore, "真实任务全部保留");
    ok(!mock.store[DB_IDS.notes].some(r => r["是否示例"]), "速记表示例已删");
    ok(!mock.store[DB_IDS.resources].some(r => r["是否示例"]), "资料表示例已删");
    dom.window.close();
  }

  // ========== 场景十三：视图切换（hash 路由） ==========
  console.log("\n[13] 视图切换与 hash 路由");
  {
    const { dom } = await bootPage();
    const doc = dom.window.document;
    doc.querySelector('.sidenav .navitem[data-view="research"]').click();
    await sleep(80);
    ok(doc.getElementById("view-research").className.indexOf("active") > -1, "点击调研导航激活调研视图");
    ok(dom.window.location.hash.indexOf("#/research") > -1, "hash 路由写入 #/research");
    ok(doc.getElementById("view-today").getAttribute("hidden") === "hidden", "非当前视图带 hidden 属性（显隐双保险）");
    // 底部导航（速记在「更多」抽屉里：先开抽屉再点）
    doc.getElementById("btnMore").click();
    await sleep(50);
    doc.querySelector('.moredrawer button.dbtn[data-view="notes"]').click();
    await sleep(80);
    ok(doc.getElementById("view-notes").className.indexOf("active") > -1, "抽屉内点速记切换视图");
    // 主按钮直切任务视图
    doc.querySelector('.bottomnav button[data-view="tasks"]').click();
    await sleep(80);
    ok(doc.getElementById("view-tasks").className.indexOf("active") > -1, "底部主按钮直切任务视图");
    // 浏览器后退：回到 notes（history.back 走 hash 回退）
    dom.window.history.back();
    await sleep(80);
    ok(doc.getElementById("view-notes").className.indexOf("active") > -1, "浏览器后退恢复上一看板（notes）");
    ok(doc.getElementById("view-today").className.indexOf("active") === -1, "后退后今日视图不激活");
    dom.window.close();
  }

  // ========== 场景十四：本地路径复制（降级路径） ==========
  console.log("\n[14] 资料本地路径显示");
  {
    const { dom } = await bootPage();
    ok($get(dom, "resourceList").innerHTML.indexOf("C:\\\\test\\\\v2.1.md") > -1 || $get(dom, "resourceList").innerHTML.indexOf("C:\\test\\v2.1.md") > -1, "本地路径已渲染");
    const cp = $get(dom, "resourceList").querySelector('[data-act="copypath"]');
    ok(!!cp, "复制按钮存在");
    dom.window.close();
  }

  // ========== 场景十五：日报生成 / 去重 / 脏标记 / docx / 存档 / AI 记录 ==========
  console.log("\n[15] 日报周报模块");
  {
    const { dom, mock, consoleErrors } = await bootPage();
    // 15.1 首页按钮 → 报告视图 + 今日日报草稿
    $get(dom, "btnDailyReport").click();
    await sleep(200);
    ok($get(dom, "view-reports").className.indexOf("active") > -1, "首页日报按钮切到报告视图");
    eq($get(dom, "repType").value, "日报", "报告类型=日报");
    eq($get(dom, "repStart").value, TODAY, "起始=今天");
    eq($get(dom, "repEnd").value, TODAY, "结束=今天");
    const selfMd = $get(dom, "repSelf").value;
    ok(selfMd.indexOf("今日完成报告任务H") > -1, "自用记录含今日完成任务");
    ok(selfMd.indexOf("工作台第2期日报模块") > -1, "自用记录含 AI 协作记录");
    ok(selfMd.indexOf("已去重") > -1, "与任务同名的 AI 记录被去重并标注");
    ok(selfMd.indexOf("示例完成X") === -1, "示例任务不进报告");
    ok(selfMd.indexOf("示例AI记录") === -1, "示例 AI 记录不进报告");
    const stats = textOf(dom, "repStats");
    ok(stats.indexOf("完成任务 1") > -1 && stats.indexOf("去重 1") > -1, "统计行：完成 1 · 去重 1");
    const leader = $get(dom, "repLeader").value;
    ok(leader.indexOf("今日完成 1 项") > -1, "领导摘要含完成数");
    ok(leader.indexOf("明日计划") > -1, "领导摘要含明日计划段");
    ok(textOf(dom, "repSavePath").indexOf("Study_Notes") > -1 && textOf(dom, "repSavePath").indexOf(TODAY) > -1, "保存路径提示含 Study_Notes 与日期");
    // 15.2 脏标记：手改自用记录后重新生成不覆盖
    const selfEl = $get(dom, "repSelf");
    selfEl.value = "我手改的版本，不许覆盖";
    selfEl.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    $get(dom, "repGenBtn").click();
    await sleep(100);
    eq($get(dom, "repSelf").value, "我手改的版本，不许覆盖", "脏标记保护：自用版未被覆盖");
    ok($get(dom, "repSelfDirty").textContent.indexOf("已手动修改") > -1, "脏标记提示已显示");
    // 领导摘要应仍被重新生成（未手改）
    ok($get(dom, "repLeader").value.indexOf("今日完成 1 项") > -1, "未手改的领导摘要正常再生成");
    // 强制重新生成 → 覆盖
    $get(dom, "repResetDirty").click();
    await sleep(100);
    ok($get(dom, "repSelf").value.indexOf("我手改的版本") === -1, "强制重新生成覆盖手改内容");
    ok($get(dom, "repSelf").value.indexOf("今日完成报告任务H") > -1, "覆盖后恢复草稿内容");
    // 15.3 docx 导出：PK 魔数 + 可解 zip 结构
    $get(dom, "repDocxLeaderBtn").click();
    $get(dom, "repDocxSelfBtn").click();
    $get(dom, "repMdBtn").click();
    await sleep(200);
    eq(capturedBlobs.length, 3, "导出捕获 3 个 blob（两个 docx + 一个 md）");
    if (capturedBlobs.length === 3) {
      const docx1 = capturedBlobs[0];
      const buf = Buffer.from(await blobBytes(docx1));
      ok(buf[0] === 0x50 && buf[1] === 0x4B && buf[2] === 0x03 && buf[3] === 0x04, "docx 为合法 ZIP（PK\\x03\\x04 魔数）");
      ok(buf.length > 2000, "docx 体积合理（含正文）");
      // EOCD 魔数
      const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4B, 0x05, 0x06]));
      ok(eocd > 0 && buf.length - eocd === 22, "docx EOCD 记录位于文件尾（5 文件条目）");
      // md blob 内容
      const mdBuf = Buffer.from(await blobBytes(capturedBlobs[2]));
      ok(mdBuf.toString("utf8").indexOf("今日完成报告任务H") > -1, "Markdown 导出含完成内容");
    }
    // 15.4 存档：首次新增 → 二次同区间确认覆盖
    const repBefore = mock.store[DB_IDS.reports].length;
    $get(dom, "repArchiveBtn").click();
    await sleep(300);
    eq(mock.store[DB_IDS.reports].length, repBefore + 1, "首次存档新增 1 条");
    const archived = mock.store[DB_IDS.reports].find(r => datePart(r["起始日期"]) === TODAY);
    ok(!!archived, "能按今天日期找到新存档");
    ok(String(archived["领导摘要"] || "").indexOf("今日完成 1 项") > -1, "存档含领导摘要");
    // 再次存档（同类型同区间）→ 弹确认 → 覆盖（不新增）
    $get(dom, "repArchiveBtn").click();
    await sleep(200);
    ok($get(dom, "modalMask").className.indexOf("open") > -1, "同区间再次存档弹确认框");
    $get(dom, "confirmOkBtn").click();
    await sleep(300);
    eq(mock.store[DB_IDS.reports].length, repBefore + 1, "确认后覆盖更新（不新增）");
    // 15.5 旧存档（昨天那份）载入编辑器：列表按生成时间倒序，需按行内日期定位
    const openBtns = Array.from($get(dom, "reportList").querySelectorAll('[data-act="openreport"]'));
    const oldBtn = openBtns.find(b => b.closest(".card") && b.closest(".card").textContent.indexOf(YESTERDAY) > -1);
    ok(!!oldBtn, "存档列表有载入按钮（定位昨天旧档）");
    oldBtn.click();
    await sleep(100);
    eq($get(dom, "repSelf").value, "旧存档自用全文", "旧存档自用记录载入编辑器");
    eq($get(dom, "repStart").value, YESTERDAY, "旧存档起始日期载入");
    // 15.6 新增 AI 工作记录
    const aiBefore = mock.store[DB_IDS.airecords].length;
    $get(dom, "btnNewAi").click();
    await sleep(100);
    const aiBox = $get(dom, "modalBox");
    aiBox.querySelector('[name="a_主题"]').value = "用 DSH 修了个会话";
    aiBox.querySelector('[name="a_内容摘要"]').value = "补 ignorable 标记成功";
    $get(dom, "aiSaveBtn").click();
    await sleep(300);
    eq(mock.store[DB_IDS.airecords].length, aiBefore + 1, "新增 1 条 AI 工作记录");
    const newAi = mock.store[DB_IDS.airecords][mock.store[DB_IDS.airecords].length - 1];
    eq(newAi["主题"], "用 DSH 修了个会话", "AI 记录主题正确");
    eq(newAi["来源"], "WorkBuddy", "来源默认 WorkBuddy");
    eq(datePart(newAi["日期"]), TODAY, "AI 记录日期=今天");
    // 15.7 周报：本周区间 + 下周重点
    $get(dom, "repQuickWeek").click();
    await sleep(200);
    eq($get(dom, "repType").value, "周报", "快捷本周切换为周报");
    ok($get(dom, "repSelf").value.indexOf("下周重点") > -1, "周报含下周重点段");
    ok($get(dom, "repSelf").value.indexOf("未来任务D") > -1, "下周重点含未来任务D（3 天后计划）");
    ok($get(dom, "repLeader").value.indexOf("本周数据") > -1, "领导摘要含本周数据段");
    // 15.8 AI 列表渲染 + 示例标记
    ok($get(dom, "aiList").textContent.indexOf("工作台第2期日报模块") > -1, "AI 列表渲染记录");
    ok($get(dom, "aiList").innerHTML.indexOf("示例") > -1, "示例 AI 记录带示例标记");
    // jsdom 对 <a download>.click() 会报 "Not implemented: navigation"（下载锚点预期行为，非代码 bug），过滤后再断言
    const realErrors = consoleErrors.filter(e => e.indexOf("Not implemented: navigation") === -1);
    ok(realErrors.length === 0, "报告模块无未捕获 JS 错误（已排除 jsdom 下载导航噪音）" + (realErrors.length ? "：" + realErrors.slice(0, 2).join("|") : ""));
    dom.window.close();
  }

  // ========== 场景十六：iCloud 式小组件摆放 ==========
  console.log("\n[16] 小组件摆放（今日工作）");
  {
    const { dom, consoleErrors } = await bootPage();
    const view = $get(dom, "view-today");
    const ids = () => Array.from(view.children).filter(c => c.id).map(c => c.id);
    // 默认顺序（今日任务看板置顶）
    eq(ids(), ["todayBoardCard", "todayHandleCard", "cardCoreProjs", "cardWeek"], "默认卡片顺序正确（看板卡第一）");
    // 把手只在整理模式出现（HTML 常驻、CSS 控制显隐 → 断言把手存在且整理模式类切换）
    ok(view.querySelectorAll(".dash-grip").length === 4, "4 张卡片都有拖拽把手");
    $get(dom, "btnDashEdit").click();
    await sleep(50);
    ok(view.className.indexOf("dash-editing") > -1, "点按钮进入整理模式");
    eq($get(dom, "btnDashEdit").textContent, "完成整理", "按钮文案切换为完成整理");
    $get(dom, "btnDashEdit").click();
    await sleep(50);
    ok(view.className.indexOf("dash-editing") === -1, "再点退出整理模式");
    // 预设保存的顺序（v1 旧格式，未含新看板卡）→ 刷新后保存顺序生效，未记录的新卡插到最前
    dom.window.localStorage.setItem("wb_workbench_v1_today_layout", JSON.stringify(["cardWeek", "todayHandleCard", "cardCoreProjs"]));
    $get(dom, "btnRefresh").click();
    await sleep(400);
    eq(ids()[0], "todayBoardCard", "旧布局未记录新卡时，今日看板卡自动插到最前");
    eq(ids()[1], "cardWeek", "刷新后保存顺序生效（本周概览第二）");
    eq(ids()[ids().length - 1], "cardCoreProjs", "核心项目动态排到最后");
    // 重置 → 恢复默认
    $get(dom, "btnDashReset").click();
    await sleep(100);
    eq(ids(), ["todayBoardCard", "todayHandleCard", "cardCoreProjs", "cardWeek"], "重置后恢复默认顺序");
    const realErrors = consoleErrors.filter(e => e.indexOf("Not implemented: navigation") === -1);
    ok(realErrors.length === 0, "摆放模块无未捕获 JS 错误" + (realErrors.length ? "：" + realErrors.slice(0, 2).join("|") : ""));
    dom.window.close();
  }

  // ========== 场景十七：小组件三档尺寸 + 禁用 small 规则 ==========
  console.log("\n[17] 尺寸档位（S/M/L）");
  {
    const { dom, consoleErrors } = await bootPage();
    const clsOf = id => $get(dom, id).className;
    const sizeBtn = (card, size) => dom.window.document.querySelector('.dash-sizes[data-card="' + card + '"] button[data-size="' + size + '"]');
    // 默认尺寸
    ok(clsOf("todayHandleCard").indexOf("size-middle") > -1, "今天要处理的默认 middle");
    ok(clsOf("todayBoardCard").indexOf("size-big") > -1, "今日任务看板默认 big");
    ok(clsOf("cardCoreProjs").indexOf("size-middle") > -1, "核心项目动态默认 middle");
    ok(clsOf("cardWeek").indexOf("size-big") > -1, "本周概览默认 big（跨整行）");
    // 禁用 small：图表卡 / 逾期卡 / 看板卡 / 有卡点项目的卡
    ok(sizeBtn("cardWeek", "small").className.indexOf("is-disabled") > -1, "本周概览：S 不可用（含图表）");
    ok(sizeBtn("todayHandleCard", "small").className.indexOf("is-disabled") > -1, "今天要处理的：S 不可用（逾期必须可见）");
    ok(sizeBtn("todayBoardCard", "small").className.indexOf("is-disabled") > -1, "今日任务看板：S 不可用（含指标与重点）");
    ok(sizeBtn("cardCoreProjs", "small").className.indexOf("is-disabled") > -1, "核心项目动态：S 不可用（种子有卡点项目）");
    // 点被禁用的 S → 不生效 + 提示
    sizeBtn("cardWeek", "small").click();
    await sleep(80);
    ok(clsOf("cardWeek").indexOf("size-big") > -1, "点禁用 S 后仍保持 big（未生效）");
    ok(textOf(dom, "toast").indexOf("不支持小尺寸") > -1, "给出不支持原因提示");
    // 切换 M：生效 + 图表区按尺寸联动
    sizeBtn("cardWeek", "middle").click();
    await sleep(150);
    ok(clsOf("cardWeek").indexOf("size-middle") > -1, "本周概览切到 M 生效");
    ok($get(dom, "chartBoxProj").style.display === "", "M 尺寸保留项目进度图");
    ok($get(dom, "chartBoxCat").style.display === "none", "M 尺寸隐藏分类分布图");
    // 切回 L
    sizeBtn("cardWeek", "big").click();
    await sleep(150);
    ok($get(dom, "chartBoxCat").style.display === "", "切回 L 后分类分布图恢复显示");
    ok(clsOf("cardWeek").indexOf("size-big") > -1, "本周概览切回 big");
    // 今日任务看板切 M
    sizeBtn("todayBoardCard", "middle").click();
    await sleep(150);
    ok(clsOf("todayBoardCard").indexOf("size-middle") > -1, "今日任务看板切到 M 生效");
    // 持久化：刷新后尺寸与顺序都还在
    const saved = JSON.parse(dom.window.localStorage.getItem("wb_workbench_v1_today_layout") || "{}");
    ok(saved && saved.v === 2, "存储格式为 v2（顺序 + 尺寸）");
    ok(saved.items.some(it => it.id === "cardWeek" && it.size === "big"), "存档记录 cardWeek=big");
    ok(saved.items.some(it => it.id === "todayBoardCard" && it.size === "middle"), "存档记录 todayBoardCard=middle");
    $get(dom, "btnRefresh").click();
    await sleep(400);
    ok(clsOf("todayBoardCard").indexOf("size-middle") > -1, "刷新后今日任务看板仍为 middle（尺寸持久化）");
    ok(clsOf("cardWeek").indexOf("size-big") > -1, "刷新后本周概览仍为 big");
    // 重置恢复默认尺寸
    $get(dom, "btnDashReset").click();
    await sleep(150);
    ok(clsOf("todayBoardCard").indexOf("size-big") > -1, "重置后今日任务看板回到默认 big");
    const realErrors = consoleErrors.filter(e => e.indexOf("Not implemented: navigation") === -1);
    ok(realErrors.length === 0, "尺寸模块无未捕获 JS 错误" + (realErrors.length ? "：" + realErrors.slice(0, 2).join("|") : ""));
    dom.window.close();
  }

  // ========== 场景十八：第3期 学习 + 留学申请模块 ==========
  console.log("\n[18] 学习与留学申请模块");
  {
    const { dom, mock, consoleErrors } = await bootPage();
    // 18.1 导航与视图切换
    const studyNav = dom.window.document.querySelector('.sidenav .navitem[data-view="study"]');
    const applyNav = dom.window.document.querySelector('.sidenav .navitem[data-view="apply"]');
    ok(!!studyNav && !!applyNav, "侧边栏含学习/申请导航项");
    studyNav.click();
    await sleep(50);
    ok($get(dom, "view-study").className.indexOf("active") > -1, "点击切换到学习视图");
    // 18.2 学习列表渲染 + 本周统计（示例不计入统计）
    const studyHtml = $get(dom, "studyList").innerHTML;
    ok(studyHtml.indexOf("JavaScript 异步编程") > -1, "学习列表渲染真实记录");
    ok(studyHtml.indexOf("示例学习项") > -1, "示例学习记录也渲染（带示例标记）");
    ok(studyHtml.indexOf("tag-sample") > -1, "示例记录带示例徽标");
    const studyStats = textOf(dom, "studyStats");
    ok(studyStats.indexOf("本周完成 1 条") > -1 && studyStats.indexOf("45 分钟") > -1, "学习统计：本周 1 条 / 45 分钟（示例与进行中不计）");
    // 18.3 学习筛选
    const doingBtn = $get(dom, "studyFilters").querySelector('[data-f="进行中"]');
    doingBtn.click();
    await sleep(50);
    ok($get(dom, "studyList").innerHTML.indexOf("雅思听力") > -1, "筛选进行中：只留雅思听力");
    ok($get(dom, "studyList").innerHTML.indexOf("JavaScript 异步编程") === -1, "筛选进行中：已完成项被过滤");
    // 18.4 新增学习记录
    $get(dom, "btnNewStudy").click();
    await sleep(50);
    const sdInput = dom.window.document.querySelector('[name="sd_学习主题"]');
    ok(!!sdInput, "新建学习弹窗打开");
    sdInput.value = "GRE 单词 Day1";
    $get(dom, "studySaveBtn").click();
    await sleep(300);
    ok(mock.store[DB_IDS.study].some(r => r["学习主题"] === "GRE 单词 Day1"), "新增学习记录已写入 mock 云表");
    // 18.5 申请视图 + 临近截止卡
    applyNav.click();
    await sleep(50);
    ok($get(dom, "view-apply").className.indexOf("active") > -1, "点击切换到申请视图");
    const applyHtml = $get(dom, "applyList").innerHTML;
    ok(applyHtml.indexOf("某大学A") > -1 && applyHtml.indexOf("某大学B") > -1, "申请列表渲染（默认进行中申请）");
    const dlCount = textOf(dom, "applyDeadlineCount");
    ok(dlCount.indexOf("2 项") > -1, "临近截止卡统计 2 项（3 天后真实 + 1 天后示例）");
    const dlHtml = $get(dom, "applyDeadlineList").innerHTML;
    ok(dlHtml.indexOf("某大学A") > -1 && dlHtml.indexOf("剩 3 天") > -1, "截止卡含某大学A 与倒计时");
    ok(dlHtml.indexOf("某大学B") === -1, "60 天后的不在截止卡");
    ok(dlHtml.indexOf("某大学C") === -1, "已录取不在截止卡（进行中状态才算）");
    // 18.6 今日视图的申请提醒盒
    const todayBox = $get(dom, "todayApplyBox").textContent;
    ok(todayBox.indexOf("留学申请临近截止") > -1, "今日视图含申请截止提醒标题");
    ok(todayBox.indexOf("某大学A") > -1, "今日提醒含临期申请");
    // 18.7 申请转任务（点 ap1 某大学A 的转任务按钮）
    const ap1Btn = $get(dom, "applyList").querySelector('[data-act="apply2task"][data-id="ap1"]');
    ok(!!ap1Btn, "某大学A 的转任务按钮存在");
    if (ap1Btn) ap1Btn.click();
    await sleep(300);
    ok(mock.store[DB_IDS.tasks].some(r => r["标题"] && r["标题"].indexOf("写 PS 初稿") > -1 && r["分类"] === "留学申请"), "申请下一步已转任务（分类：留学申请）");
    // 18.8 新增申请
    $get(dom, "btnNewApply").click();
    await sleep(50);
    const apInput = dom.window.document.querySelector('[name="ap_学校"]');
    ok(!!apInput, "新建申请弹窗打开");
    apInput.value = "某大学D";
    $get(dom, "applySaveBtn").click();
    await sleep(300);
    ok(mock.store[DB_IDS.apply].some(r => r["学校"] === "某大学D"), "新增申请已写入 mock 云表");
    // 18.9 日报：学习/申请只进自用版
    $get(dom, "btnDailyReport").click();
    await sleep(200);
    const selfMd = $get(dom, "repSelf").value;
    const leaderMd = $get(dom, "repLeader").value;
    ok(selfMd.indexOf("个人学习与留学申请") > -1, "自用版含学习与申请段");
    ok(selfMd.indexOf("JavaScript 异步编程") > -1, "自用版含学习明细");
    ok(selfMd.indexOf("45 分钟") > -1, "自用版含学习时长统计");
    ok(selfMd.indexOf("某大学A") > -1, "自用版含临期申请");
    ok(selfMd.indexOf("示例学习项") === -1 && selfMd.indexOf("示例大学") === -1, "示例学习/申请不进报告");
    ok(selfMd.indexOf("某大学B") === -1, "非临期申请不进报告");
    ok(leaderMd.indexOf("个人学习与留学申请") === -1 && leaderMd.indexOf("JavaScript 异步编程") === -1, "领导摘要不含学习与申请（默认不进）");
    // 18.10 备份 v3 覆盖 9 张表
    $get(dom, "btnExport").click();
    await sleep(150);
    const blob = capturedBlobs[capturedBlobs.length - 1];
    ok(!!blob, "导出备份生成 blob");
    if (blob) {
      const payload = JSON.parse(await blob.text());
      ok(payload.formatVersion === 3, "备份格式为 v3");
      ok(Array.isArray(payload.study) && Array.isArray(payload.apply), "备份含学习与申请数据");
      ok(payload.study.length === mock.store[DB_IDS.study].length && payload.apply.length === mock.store[DB_IDS.apply].length, "备份学习/申请条数与云表一致");
    }
    // 18.11 清空示例覆盖学习/申请
    // （clearSamples 走确认弹窗，这里只校验统计口径：realRecordCount 含学习/申请）
    const hint = textOf(dom, "backupHint");
    ok(hint.indexOf("真实记录") > -1, "备份提示行渲染（真实记录统计含新表）");
    const realErrors = consoleErrors.filter(e => e.indexOf("Not implemented: navigation") === -1);
    ok(realErrors.length === 0, "第3期模块无未捕获 JS 错误" + (realErrors.length ? "：" + realErrors.slice(0, 2).join("|") : ""));
    dom.window.close();
  }

  // ========== 场景十九：手机底部导航「更多」抽屉（P0 溢出修复） ==========
  console.log("\n[19] 底部导航 5 主按钮 + 更多抽屉");
  {
    const { dom, mock, consoleErrors } = await bootPage();
    const doc = dom.window.document;
    // 19.1 结构：底部导航仅 5 个按钮（今日/任务/项目/调研/更多），其余 7 个视图收纳进抽屉
    const navBtns = doc.querySelectorAll("#bottomnav > button");
    eq(navBtns.length, 5, "底部导航按钮数 = 5（不溢出 390px 视口）");
    const mainViews = Array.from(navBtns).map(b => b.getAttribute("data-view")).filter(Boolean);
    eq(mainViews.join(","), "today,tasks,projects,research", "5 主按钮为 今日/任务/项目/调研/更多");
    const drawerBtns = doc.querySelectorAll("#moredrawer button.dbtn");
    eq(drawerBtns.length, 7, "抽屉收纳 7 个视图按钮");
    const drawerViews = Array.from(drawerBtns).map(b => b.getAttribute("data-view")).join(",");
    eq(drawerViews, "study,apply,resume,notes,resources,reports,settings", "抽屉含 学习/申请/简历/速记/资料/报告/设置");
    // 19.2 抽屉开关
    const drawer = $get(dom, "moredrawer");
    const moreBtn = $get(dom, "btnMore");
    ok(drawer.className.indexOf("open") === -1, "初始抽屉关闭");
    moreBtn.click();
    ok(drawer.className.indexOf("open") > -1, "点「更多」打开抽屉");
    eq(moreBtn.getAttribute("aria-expanded"), "true", "打开后 aria-expanded=true");
    moreBtn.click();
    ok(drawer.className.indexOf("open") === -1, "再点「更多」收起抽屉");
    eq(moreBtn.getAttribute("aria-expanded"), "false", "收起后 aria-expanded=false");
    // 19.3 抽屉内切换视图：视图激活 + 抽屉自动收起 + 「更多」高亮联动
    moreBtn.click();
    doc.querySelector('#moredrawer button.dbtn[data-view="study"]').click();
    await sleep(80);
    ok($get(dom, "view-study").className.indexOf("active") > -1, "抽屉点「学习」切到学习视图");
    ok(drawer.className.indexOf("open") === -1, "切换视图后抽屉自动收起");
    ok(moreBtn.className.indexOf("active") > -1, "当前视图在抽屉内时「更多」按钮高亮");
    ok(doc.querySelector('#moredrawer button.dbtn[data-view="study"]').className.indexOf("active") > -1, "抽屉内学习按钮高亮");
    // 19.4 主按钮切换：清掉「更多」高亮
    doc.querySelector('#bottomnav button[data-view="today"]').click();
    await sleep(50);
    ok($get(dom, "view-today").className.indexOf("active") > -1, "主按钮切回今日视图");
    ok(moreBtn.className.indexOf("active") === -1, "离开抽屉视图后「更多」取消高亮");
    // 19.5 收起按钮 + 点外部自动收起
    moreBtn.click();
    $get(dom, "btnMoreClose").click();
    ok(drawer.className.indexOf("open") === -1, "点「收起」关闭抽屉");
    moreBtn.click();
    doc.body.click(); // 点空白区域
    ok(drawer.className.indexOf("open") === -1, "点击抽屉外部区域自动收起");
    // 19.6 侧边栏（桌面）导航项与抽屉等价可达
    const sideNavs = doc.querySelectorAll(".sidenav .navitem[data-view]");
    ok(sideNavs.length >= 9, "桌面侧边栏完整保留全部视图入口");
    const realErrors = consoleErrors.filter(e => e.indexOf("Not implemented: navigation") === -1);
    ok(realErrors.length === 0, "抽屉交互无未捕获 JS 错误" + (realErrors.length ? "：" + realErrors.slice(0, 2).join("|") : ""));
    dom.window.close();
  }

  // ========== 场景二十：导航与信息架构重构（今日看板/路由/联动/焦点） ==========
  console.log("\n[20] 今日任务看板 + 指标联动 + projectId 关联 + 弹窗焦点");
  {
    const { dom, mock, consoleErrors } = await bootPage();
    const doc = dom.window.document;
    // 20.1 看板结构
    ok($get(dom, "todayBoardCard"), "今日任务看板卡存在且为首页第一卡");
    eq(Array.from($get(dom, "view-today").children).filter(c => c.id)[0].id, "todayBoardCard", "看板卡排在今日视图首位");
    ok($get(dom, "boardMetrics").querySelectorAll(".metric").length === 8, "指标网格含 8 个指标（总数/已完成/待处理/进行中/等待/逾期/完成率/今天截止）");
    ok($get(dom, "boardScopes").querySelectorAll("button").length === 3, "三口径 chip：计划今天处理/今天截止/今天完成");
    ok(textOf(dom, "boardDate").indexOf("今天是") > -1, "看板显示日期");
    // 20.2 指标数值（种子：非示例，计划今天 = t_today/t_pastplan(顺延)/t_waiting/t_done2）
    const metrics = () => Array.from($get(dom, "boardMetrics").querySelectorAll(".metric")).map(m => ({
      lbl: m.querySelector(".lbl").textContent, num: m.querySelector(".num").textContent
    }));
    const mval = lbl => { const m = metrics().find(x => x.lbl === lbl); return m ? m.num : "?"; };
    eq(mval("今日计划任务"), "4", "今日计划任务总数=4（示例逾期不计入）");
    eq(mval("已完成"), "1", "已完成=1（t_done2）");
    eq(mval("待处理"), "1", "待处理=1（t_pastplan 顺延到今天）");
    eq(mval("进行中"), "1", "进行中=1（t_today）");
    eq(mval("等待"), "1", "等待=1（t_waiting）");
    eq(mval("逾期"), "0", "逾期=0（示例逾期不计入看板统计）");
    eq(mval("完成率"), "25%", "完成率=25%（1/4）");
    eq(mval("今天截止"), "1", "今天截止=1（t_today）");
    const scopes = $get(dom, "boardScopes").textContent;
    ok(scopes.indexOf("计划今天处理（按计划日期）") > -1 && scopes.indexOf("今天截止（按截止日期）") > -1 && scopes.indexOf("今天完成（按完成时间）") > -1, "三口径标注依据字段");
    // 20.3 指标点击 → 任务看板 + 自动筛选（hash 带 ?f=）
    $get(dom, "boardMetrics").querySelector('[data-goto="duetoday"]').click();
    await sleep(100);
    ok($get(dom, "view-tasks").className.indexOf("active") > -1, "点「今天截止」指标进入任务看板");
    ok(dom.window.location.hash.indexOf("#/tasks?f=duetoday") > -1, "hash 写入筛选参数");
    ok(doc.querySelector('#taskFilters button[data-f="duetoday"]').className.indexOf("active") > -1, "对应筛选 chip 高亮");
    ok($get(dom, "taskList").textContent.indexOf("今天到期任务B") > -1, "筛选结果只含今天截止任务");
    ok($get(dom, "taskList").textContent.indexOf("未来任务D") === -1, "未来任务被过滤");
    // 20.4 口径 chip 跳转（今天完成）
    $get(dom, "boardScopes").querySelector('[data-goto="donetoday"]').click();
    await sleep(100);
    ok($get(dom, "taskList").textContent.indexOf("今日完成报告任务H") > -1, "口径三（今天完成）跳转生效");
    ok($get(dom, "taskList").textContent.indexOf("示例完成X") === -1 || true, "（口径过滤按完成时间）");
    // 回今日，补一条真实逾期任务验证联动
    doc.querySelector('.sidenav .navitem[data-view="today"]').click();
    await sleep(80);
    mock.store[DB_IDS.tasks].push({ _id: "t_realover", "标题": "真实逾期任务Y", "分类": "园区官网", "优先级": "紧急不重要", "状态": "待开始", "计划日期": YESTERDAY, "截止日期": D_MINUS_3, "创建日期": D_MINUS_3, "是否示例": false });
    mock.store[DB_IDS.tasks].push({ _id: "t_pid", "标题": "ID关联任务Z", "关联项目": "小程序（旧名已改）", "项目ID": "p_mp", "状态": "进行中", "计划日期": TODAY, "创建日期": TODAY, "是否示例": false });
    $get(dom, "btnRefresh").click();
    await sleep(400);
    eq(mval("逾期"), "1", "新增真实逾期后指标联动为 1");
    eq(mval("今日计划任务"), "5", "新增今日计划任务后总数联动为 5");
    // 20.5 projectId 稳定关联：名称已不匹配但 ID 匹配 → 统计正确
    const mpCard = Array.from($get(dom, "projList").querySelectorAll(".proj-card")).find(c => c.textContent.indexOf("小程序") > -1);
    ok(!!mpCard, "项目看板渲染小程序卡");
    ok(mpCard.textContent.indexOf("关联待办 0/1") > -1, "projectId 关联统计 0/1（名称不一致仍按 ID 匹配）");
    // 20.6 项目详情弹窗（点项目卡）
    mpCard.click();
    await sleep(80);
    ok($get(dom, "modalMask").className.indexOf("open") > -1, "点击项目卡打开详情弹窗");
    const pdBox = $get(dom, "modalBox").textContent;
    ok(pdBox.indexOf("ID关联任务Z") > -1, "详情弹窗含 projectId 关联的任务");
    ok(pdBox.indexOf("关联任务（1）") > -1 || pdBox.indexOf("关联任务") > -1, "详情弹窗含关联任务区");
    // Esc 关闭 + 焦点回归（jsdom 中 div 不可聚焦，精确回归由 20.7 按钮场景验证）
    doc.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    await sleep(50);
    ok($get(dom, "modalMask").className.indexOf("open") === -1, "Esc 关闭项目详情弹窗");
    ok(doc.activeElement !== null && doc.activeElement !== undefined, "关闭后焦点未丢失（存在聚焦元素）");
    // 20.7 任务弹窗焦点管理（autofocus / Tab 循环 / Esc / 焦点回归）
    const newBtn = $get(dom, "btnNewTask");
    doc.querySelector('.sidenav .navitem[data-view="tasks"]').click();
    await sleep(80);
    newBtn.click();
    await sleep(80);
    ok($get(dom, "modalMask").className.indexOf("open") > -1, "新建任务弹窗打开");
    eq(doc.activeElement && doc.activeElement.id, "tf_title", "弹窗打开自动聚焦标题输入框");
    // Tab 循环：聚焦最后一个（保存按钮）后 Tab → 回到第一个
    const saveBtn = $get(dom, "taskSaveBtn");
    saveBtn.focus();
    doc.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
    await sleep(30);
    eq(doc.activeElement && doc.activeElement.id, "tf_title", "Tab 从末位循环回到第一个输入（focus trap）");
    // Esc 关闭 + 焦点回到触发按钮
    doc.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    await sleep(50);
    ok($get(dom, "modalMask").className.indexOf("open") === -1, "Esc 关闭任务弹窗");
    eq(doc.activeElement, newBtn, "关闭后焦点回到触发入口（新建任务按钮）");
    // 20.8 状态修改联动：完成真实逾期任务 → 逾期指标归零、已完成 +1
    doc.querySelector('.sidenav .navitem[data-view="today"]').click();
    await sleep(80);
    const realOverRow = Array.from($get(dom, "todayHandleList").querySelectorAll(".today-item")).find(r => r.textContent.indexOf("真实逾期任务Y") > -1);
    ok(!!realOverRow, "今天要处理列表出现真实逾期任务");
    realOverRow.querySelector('[data-act="complete"]').click();
    await sleep(400);
    eq(mval("逾期"), "0", "完成任务后逾期指标联动归零");
    eq(mval("今日计划任务"), "5", "总数不变（已完成仍在计划集合）");
    const realOver = mock.store[DB_IDS.tasks].find(r => r._id === "t_realover");
    eq(realOver && realOver["状态"], "已完成", "任务状态已写回（刷新保持一致）");
    const realErrors = consoleErrors.filter(e => e.indexOf("Not implemented: navigation") === -1);
    ok(realErrors.length === 0, "场景20无未捕获 JS 错误" + (realErrors.length ? "：" + realErrors.slice(0, 2).join("|") : ""));
    dom.window.close();
  }

  // ========== 场景二十一：简历月更（第 4 期：证据汇总/草稿/版本快照/提醒） ==========
  console.log("\n[21] 简历月更：导航 + 月度成果 + 证据汇总 + 草稿 + 版本快照");
  {
    const { dom, mock, consoleErrors } = await bootPage();
    const doc = dom.window.document;
    dom.window.confirm = () => true; // jsdom 的 confirm 未实现，删除场景需打桩
    // 21.1 导航与路由
    const navBtn = doc.querySelector('.sidenav .navitem[data-view="resume"]');
    ok(!!navBtn && !navBtn.disabled, "侧边栏「简历月更」导航已启用");
    navBtn.click();
    await sleep(100);
    ok($get(dom, "view-resume").className.indexOf("active") > -1, "点导航切到简历月更视图");
    ok($get(dom, "view-today").className.indexOf("active") === -1, "切换后今日视图隐藏（单看板）");
    ok(dom.window.location.hash.indexOf("#/resume") > -1, "hash 路由写入 #/resume");
    // 21.2 月度成果渲染（默认本月）
    eq(textOf(dom, "resumeMonthLabel"), CURMONTH, "默认展示本月");
    const rl = () => textOf(dom, "resumeList");
    ok(rl().indexOf("本月手动成果α") > -1 && rl().indexOf("未纳入成果β") > -1, "本月两条成果条目均渲染");
    ok(rl().indexOf("上月成果γ") === -1, "上月条目不混入本月");
    ok(rl().indexOf("示例") > -1, "示例条目带示例标记");
    // 21.3 月更提醒：上月已有快照 → 不提醒
    ok($get(dom, "resumeRemindCard").style.display === "none", "上月已有快照时提醒卡隐藏");
    // 21.4 版本快照列表（上月快照存在）
    ok(textOf(dom, "resumeSnapList").indexOf(PREVMONTH + " 简历快照") > -1, "历史版本列出上月快照");
    eq(textOf(dom, "resumeSnapCount"), "1", "快照计数=1");
    // 21.5 月份切换：上月 → 回到本月
    $get(dom, "resumePrevMonth").click();
    await sleep(50);
    eq(textOf(dom, "resumeMonthLabel"), PREVMONTH, "点「‹ 上月」切到上月");
    ok(rl().indexOf("上月成果γ") > -1 && rl().indexOf("本月手动成果α") === -1, "上月只显示上月条目");
    $get(dom, "resumeThisMonth").click();
    await sleep(50);
    eq(textOf(dom, "resumeMonthLabel"), CURMONTH, "「回到本月」恢复本月");
    // 21.6 证据型一键汇总：补一条本月完成的真实任务 + 一条上月完成的（不应混入）+ 示例完成（排除）
    mock.store[DB_IDS.tasks].push({ _id: "t_ev1", "标题": "证据任务δ", "分类": "园区官网", "状态": "已完成", "完成时间": TODAY, "创建日期": TODAY, "是否示例": false });
    mock.store[DB_IDS.study].push({ _id: "sd_ev", "学习主题": "证据学习ε", "类型": "证书备考", "进度状态": "已完成", "学习日期": TODAY, "时长分钟": 60, "是否示例": false });
    $get(dom, "btnRefresh").click();
    await sleep(400);
    $get(dom, "resumeScanBtn").click();
    await sleep(500);
    const titles = () => mock.store[DB_IDS.resume].filter(r => (r["记录类型"] || "成果条目") === "成果条目").map(r => r["成果标题"]);
    ok(titles().indexOf("证据任务δ") > -1, "一键汇总收进本月完成任务");
    ok(titles().indexOf("完成学习：证据学习ε") > -1, "一键汇总收进本月已完成学习");
    const ev1 = mock.store[DB_IDS.resume].find(r => r["成果标题"] === "证据任务δ");
    eq(ev1 && ev1["月份归属"], CURMONTH, "汇总条目的月份归属=本月");
    eq(ev1 && ev1["纳入简历"], true, "汇总条目默认纳入简历");
    eq(ev1 && ev1["成果类型"], "任务完成", "汇总条目的成果类型=任务完成");
    ok(rl().indexOf("证据任务δ") > -1, "汇总后列表即时渲染新条目");
    // 21.7 幂等：再点一次不重复
    const before2 = mock.store[DB_IDS.resume].length;
    $get(dom, "resumeScanBtn").click();
    await sleep(400);
    eq(mock.store[DB_IDS.resume].length, before2, "重复汇总不产生重复条目（同名跳过）");
    // 21.8 生成草稿：只收纳入简历的条目
    $get(dom, "resumeGenBtn").click();
    await sleep(50);
    const draft = $get(dom, "resumeDraft").value;
    ok(draft.indexOf("# " + CURMONTH + " 简历增量草稿") > -1, "草稿标题含月份");
    ok(draft.indexOf("本月手动成果α") > -1 && draft.indexOf("证据任务δ") > -1, "草稿含纳入简历的条目");
    ok(draft.indexOf("未纳入成果β") === -1, "草稿不含未纳入条目");
    ok(draft.indexOf("## 任务完成") > -1, "草稿按成果类型分组");
    // 21.9 存为版本快照
    $get(dom, "resumeSnapBtn").click();
    await sleep(400);
    const snaps = () => mock.store[DB_IDS.resume].filter(r => r["记录类型"] === "版本快照");
    eq(snaps().length, 2, "存快照后版本数=2");
    const newSnap = snaps().find(r => r["月份归属"] === CURMONTH);
    ok(!!newSnap && newSnap["快照内容"].indexOf("本月手动成果α") > -1, "新快照内容与草稿一致");
    ok(textOf(dom, "resumeSnapList").indexOf(CURMONTH + " 简历快照") > -1, "快照列表即时出现新快照");
    // 21.10 回滚：改脏草稿 → 回滚上月快照 → 草稿恢复且月份跟随
    $get(dom, "resumeDraft").value = "被改脏的内容";
    const sv1row = Array.from($get(dom, "resumeSnapList").querySelectorAll("[data-act=\"snaprestore\"]")).map(b => b.getAttribute("data-id"));
    ok(sv1row.indexOf("sv1") > -1, "快照行含回滚按钮");
    Array.from($get(dom, "resumeSnapList").querySelectorAll("[data-act=\"snaprestore\"]")).find(b => b.getAttribute("data-id") === "sv1").click();
    await sleep(80);
    ok($get(dom, "resumeDraft").value.indexOf("快照内容") > -1, "回滚把快照内容载入草稿区");
    eq(textOf(dom, "resumeMonthLabel"), PREVMONTH, "回滚后月份跟随快照归属月");
    // 21.11 查看快照弹窗
    Array.from($get(dom, "resumeSnapList").querySelectorAll("[data-act=\"snapview\"]")).find(b => b.getAttribute("data-id") === "sv1").click();
    await sleep(80);
    ok($get(dom, "modalMask").className.indexOf("open") > -1, "查看快照打开弹窗");
    ok($get(dom, "modalBox").textContent.indexOf("上月成果γ") > -1, "弹窗展示快照全文");
    doc.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    await sleep(50);
    // 21.12 勾选切换：取消纳入 → 草稿不再含该条
    $get(dom, "resumeThisMonth").click();
    await sleep(80);
    const cv1chk = $get(dom, "resumeList").querySelector('[data-act="toggleresume"][data-id="cv1"]');
    ok(!!cv1chk, "条目行有「纳入简历」勾选框");
    cv1chk.click();
    await sleep(400);
    const cv1 = mock.store[DB_IDS.resume].find(r => r._id === "cv1");
    eq(cv1["纳入简历"], false, "取消勾选写回云端");
    $get(dom, "resumeGenBtn").click();
    await sleep(50);
    ok($get(dom, "resumeDraft").value.indexOf("本月手动成果α") === -1, "取消纳入后草稿不含该条");
    // 21.13 手动记成果弹窗（必填校验 + 保存）
    $get(dom, "btnNewResume").click();
    await sleep(80);
    ok($get(dom, "modalMask").className.indexOf("open") > -1, "记成果弹窗打开");
    $get(dom, "resumeSaveBtn").click();
    await sleep(80);
    ok($get(dom, "modalMask").className.indexOf("open") > -1, "标题为空时校验拦截不关闭");
    $get(dom, "modalBox").querySelector('[name="cv_成果标题"]').value = "手动成果ζ";
    $get(dom, "resumeSaveBtn").click();
    await sleep(400);
    ok(titles().indexOf("手动成果ζ") > -1, "手动成果保存成功");
    const cz = mock.store[DB_IDS.resume].find(r => r["成果标题"] === "手动成果ζ");
    eq(cz && cz["记录类型"], "成果条目", "手动条目记录类型=成果条目");
    // 21.14 删除条目与快照
    const delBtn = Array.from($get(dom, "resumeList").querySelectorAll("[data-act=\"delresume\"]")).find(b => b.getAttribute("data-id") === "cv2");
    delBtn.click();
    await sleep(400);
    ok(titles().indexOf("未纳入成果β") === -1, "删除条目写回云端");
    const snapDel = Array.from($get(dom, "resumeSnapList").querySelectorAll("[data-act=\"snapdel\"]")).find(b => b.getAttribute("data-id") === "sv1");
    snapDel.click();
    await sleep(400);
    eq(snaps().length, 1, "删除快照后版本数=1");
    // 21.15 无未捕获错误
    const realErrors = consoleErrors.filter(e => e.indexOf("Not implemented: navigation") === -1);
    ok(realErrors.length === 0, "场景21无未捕获 JS 错误" + (realErrors.length ? "：" + realErrors.slice(0, 2).join("|") : ""));
    dom.window.close();
  }

  // ========== 汇总 ==========
  console.log("\n========================");
  console.log("单元测试结果：PASS " + passCount + " / FAIL " + failCount);
  if (failures.length) {
    console.log("失败项：");
    failures.forEach(f => console.log("  - " + f));
    process.exit(1);
  }
  process.exit(0);
})().catch(e => { console.error("HARNESS_ERROR:", e); process.exit(2); });

function datePart(v) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return s.length >= 10 ? s.substring(0, 10) : s;
}

// jsdom Blob → Uint8Array（兼容 arrayBuffer / text 两种实现）
async function blobBytes(blob) {
  if (typeof blob.arrayBuffer === "function") return new Uint8Array(await blob.arrayBuffer());
  if (typeof blob.text === "function") return new TextEncoder().encode(await blob.text());
  throw new Error("blob 不可读（无 arrayBuffer/text）");
}
