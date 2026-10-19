// UI/UX 中期审查：本地起 HTTP 服务渲染工作台（注入 mock SDK + 示例数据），桌面+手机双视口截图 + 交互检查 + 布局度量
"use strict";
const path = require("path");
const fs = require("fs");
const http = require("http");
const { chromium } = require("playwright-core");

const HTML_PATH = process.env.HTML_PATH || path.join(__dirname, "..", "workbench.html");
const HTML = fs.readFileSync(HTML_PATH, "utf8");
const OUT = path.join(__dirname, "ux_shots");
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// ---------- 本地 HTTP 服务 ----------
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(HTML);
});
function todayStr() { const d = new Date(); const p = n => (n < 10 ? "0" + n : "" + n); return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()); }
function addDays(s, n) { const d = new Date(s + "T00:00:00"); d.setDate(d.getDate() + n); const p = n2 => (n2 < 10 ? "0" + n2 : "" + n2); return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()); }
const TODAY = todayStr();

// ---------- mock SDK 种子数据（与单测一致口径） ----------
const DB = {
  tasks: "l49vCiVLbpktS5cjT0lhIN", projects: "mSz8E9WaHkTvUE5U4Kupz8", research: "phzTOFqvt32Bz7ficmcP2f",
  notes: "mIwePYmB2y60zJIBcic0qQ", resources: "V3oLEwRkEaoYSdEaZCDHFX", reports: "bvsokQJzsZFP38OtkYXFLA",
  airecords: "GrSPRzmXmFwLxWJRJB2UKY", study: "sole16fronDUGBPBEHJCIJ", apply: "PCnEjp2fsObRBZug1Z2DPK",
};
const STORE = {};
STORE[DB.tasks] = [
  { _id: "t1", "标题": "官网首页内容核对（示例）", "分类": "园区官网", "关联项目": "园区官网建设", "优先级": "重要且紧急", "状态": "进行中", "计划日期": TODAY, "截止日期": addDays(TODAY, 2), "下一步": "核对栏目文案与图片素材", "创建日期": addDays(TODAY, -1), "今日重点": true, "是否示例": true },
  { _id: "t2", "标题": "回复供应商报价确认邮件（示例）", "分类": "其他", "优先级": "紧急不重要", "状态": "待开始", "计划日期": addDays(TODAY, -2), "截止日期": addDays(TODAY, -2), "顺延次数": 1, "创建日期": addDays(TODAY, -3), "是否示例": true },
  { _id: "t3", "标题": "小程序需求访谈准备（示例）", "分类": "园区小程序", "关联项目": "园区小程序建设", "优先级": "重要不紧急", "状态": "待开始", "计划日期": addDays(TODAY, 2), "截止日期": addDays(TODAY, 6), "创建日期": addDays(TODAY, -1), "是否示例": true },
  { _id: "t4", "标题": "生成今日日报（示例）", "分类": "日常报告", "优先级": "一般", "状态": "已完成", "计划日期": addDays(TODAY, -1), "完成时间": addDays(TODAY, -1), "创建日期": addDays(TODAY, -1), "是否示例": true },
  { _id: "t5", "标题": "已完成任务F", "分类": "园区官网", "优先级": "一般", "状态": "已完成", "计划日期": TODAY, "完成时间": TODAY, "创建日期": addDays(TODAY, -3), "是否示例": false },
];
STORE[DB.projects] = [
  { _id: "p1", "项目名称": "园区官网建设（示例）", "工作层级": "核心工作", "当前阶段": "内容与素材", "阶段目标日期": addDays(TODAY, 12), "下一步": "首页内容核对后提交初审", "卡点": "", "目标": "双站上线", "最近进展": "备案中", "是否示例": true },
  { _id: "p2", "项目名称": "园区小程序建设（示例）", "工作层级": "核心工作", "当前阶段": "需求", "阶段目标日期": addDays(TODAY, 40), "下一步": "完成首批需求访谈", "卡点": "等物业方提供会员数据口径", "目标": "一期上线", "最近进展": "收集3条诉求", "是否示例": true },
];
STORE[DB.research] = [
  { _id: "r1", "调研对象": "招商部（示例）", "调研日期": addDays(TODAY, -1), "关联项目": "园区小程序建设", "性质": "已确认需求", "真实问题或场景": "流量扶持政策", "初步结论": "加入驻企业栏目", "下一步": "找品牌部要素材", "资料来源": "访谈", "是否示例": true },
];
STORE[DB.notes] = [
  { _id: "n1", "正文": "官网首页可参考「材质与工艺」板块的设计（示例速记）", "标签": "官网,灵感", "关联项目": "园区官网建设", "是否示例": true },
];
STORE[DB.resources] = [
  { _id: "res1", "名称": "园区官网建设方案 V2.1（示例）", "本地路径": "C:\\Users\\DC\\Documents\\GitHub\\Study_Notes\\网站建设\\方案V2.1.md", "关联项目": "园区官网建设", "用途说明": "硬约束依据", "是否示例": true },
];
STORE[DB.airecords] = [
  { _id: "a1", "日期": TODAY, "来源": "WorkBuddy", "类型": "实际完成", "主题": "工作台第3期开发", "内容摘要": "学习+申请模块上线", "关联项目": "工作台", "是否示例": true },
];
STORE[DB.study] = [
  { _id: "sd1", "学习主题": "JavaScript 异步编程（示例）", "类型": "技能学习", "进度状态": "已完成", "计划日期": TODAY, "学习日期": TODAY, "时长分钟": 45, "笔记": "Promise/async 复习", "是否示例": true },
  { _id: "sd2", "学习主题": "雅思听力精听（示例）", "类型": "语言备考", "进度状态": "进行中", "学习日期": TODAY, "时长分钟": 30, "是否示例": true },
];
STORE[DB.apply] = [
  { _id: "ap1", "学校": "某大学A（示例）", "专业项目": "计算机硕士", "申请轮次": "第一轮", "截止日期": addDays(TODAY, 5), "申请状态": "材料准备中", "优先级": "重要且紧急", "材料清单": "PS、推荐信 x2、成绩单", "下一步": "写 PS 初稿", "是否示例": true },
  { _id: "ap2", "学校": "某大学B（示例）", "专业项目": "数据科学", "申请轮次": "第二轮", "截止日期": addDays(TODAY, 60), "申请状态": "待开始", "优先级": "重要不紧急", "是否示例": true },
];

// schema：字段名+select 选项（按表）
const SCHEMA = {};
SCHEMA[DB.tasks] = ["分类|园区官网,园区小程序,需求调研,工作流优化,企微自动化,日常报告,个人学习,留学申请,其他", "优先级|重要且紧急,紧急不重要,重要不紧急,一般", "状态|收集箱,待开始,进行中,等待,已完成,已取消"];
SCHEMA[DB.projects] = ["工作层级|核心工作,次要工作"];
SCHEMA[DB.research] = ["性质|已确认需求,待验证想法"];
SCHEMA[DB.reports] = ["报告类型|日报,周报"];
SCHEMA[DB.airecords] = ["来源|WorkBuddy,Codex,DSH,其他", "类型|实际完成,产出物,尝试失败,讨论"];
SCHEMA[DB.study] = ["类型|语言备考,专业课程,技能学习,证书备考,阅读", "进度状态|未开始,进行中,已完成,暂停"];
SCHEMA[DB.apply] = ["申请轮次|提前批,第一轮,第二轮,末轮", "申请状态|待开始,材料准备中,已提交,面试中,已录取,已放弃", "优先级|重要且紧急,紧急不重要,重要不紧急,一般"];

function buildSchemaProps(lines) {
  return (lines || []).map(function (l) {
    var parts = l.split("|");
    var name = parts[0], opts = parts[1];
    if (!opts) return { name: name, type: "text" };
    return { name: name, type: "select", config: { options: opts.split(",").map(function (t, i) { return { id: "o" + i, text: t, style: i + 1 }; }) } };
  }).concat([{ name: "是否示例", type: "checkbox" }]);
}
const SCHEMA_OBJ = {};
Object.keys(SCHEMA).forEach(function (k) { SCHEMA_OBJ[k] = buildSchemaProps(SCHEMA[k]); });

const VIEWS = ["today", "tasks", "projects", "research", "notes", "resources", "study", "apply", "reports", "settings"];
const findings = [];
function finding(severity, area, desc) { findings.push({ severity: severity, area: area, desc: desc }); console.log("[" + severity + "] " + area + ": " + desc); }

async function newPage(ctx) {
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", function (m) { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", function (e) { errors.push(String(e)); });
  await page.addInitScript("window.__STORE = " + JSON.stringify(STORE) + "; window.__SCHEMA = " + JSON.stringify(SCHEMA_OBJ) + ";" +
    "window.__SMART_PAGE__ = { database: {" +
    "query: function (p) { return Promise.resolve({ results: (window.__STORE[p.databaseId] || []), hasMore: false }); }," +
    "getSchema: function (p) { return Promise.resolve({ properties: (window.__SCHEMA[p.databaseId] || []) }); }," +
    "addRecord: function (p) { var all = window.__STORE[p.databaseId] = window.__STORE[p.databaseId] || []; var id = 'new_' + Date.now() + '_' + Math.floor(Math.random()*1000); var row = { _id: id }; for (var k in p.properties) { var v = p.properties[k]; var t = Object.keys(v)[0]; row[k] = (t === 'url') ? { text: v[t].text, link: v[t].link } : v[t]; } all.push(row); return Promise.resolve({ id: id }); }," +
    "updateRecord: function (p) { return Promise.resolve({}); }," +
    "deleteRecord: function (p) { var all = window.__STORE[p.databaseId] || []; var i = -1; for (var j = 0; j < all.length; j++) { if (all[j]._id === p.recordId) { i = j; break; } } if (i >= 0) all.splice(i, 1); return Promise.resolve({}); }," +
    "onUpdated: function () {}" +
    "} };");
  return { page: page, errors: errors };
}

(async () => {
  await new Promise(r => server.listen(18765, "127.0.0.1", r));
  const URL = "http://127.0.0.1:18765/workbench.html";
  const browser = await chromium.launch({ headless: true, executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });

  // ---------- 桌面 1440x900 ----------
  console.log("===== 桌面端 1440x900 =====");
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  {
    const d = await newPage(desktop);
    const dp = d.page, errors = d.errors;
    await dp.goto(URL, { waitUntil: "load", timeout: 30000 });
    await dp.waitForTimeout(1200);
    console.log("页面标题:", await dp.title());
    await dp.screenshot({ path: path.join(OUT, "d01-today.png") });

    for (const v of VIEWS.slice(1)) {
      const nav = dp.locator('.sidenav .navitem[data-view="' + v + '"]');
      if (await nav.count()) {
        await nav.click();
        await dp.waitForTimeout(500);
        await dp.screenshot({ path: path.join(OUT, "d-" + v + ".png") });
      } else finding("P1", "桌面导航", "侧边栏缺少视图 " + v);
    }

    // 弹窗检查
    await dp.locator('.sidenav .navitem[data-view="tasks"]').click();
    await dp.waitForTimeout(300);
    await dp.locator("#btnNewTask").click();
    await dp.waitForTimeout(400);
    if (await dp.locator("#modalMask.open").count()) {
      await dp.screenshot({ path: path.join(OUT, "d-modal-task.png") });
      await dp.locator("#modalBox [data-close]").first().click();
      await dp.waitForTimeout(200);
    } else finding("P0", "任务弹窗", "点「新建任务」弹窗未打开");

    await dp.locator('.sidenav .navitem[data-view="study"]').click();
    await dp.waitForTimeout(300);
    await dp.locator("#btnNewStudy").click();
    await dp.waitForTimeout(400);
    if (await dp.locator("#modalMask.open").count()) {
      await dp.screenshot({ path: path.join(OUT, "d-modal-study.png") });
      await dp.locator("#modalBox [data-close]").first().click();
    } else finding("P0", "学习弹窗", "点「记学习」弹窗未打开");

    await dp.locator('.sidenav .navitem[data-view="apply"]').click();
    await dp.waitForTimeout(300);
    await dp.locator("#btnNewApply").click();
    await dp.waitForTimeout(400);
    if (await dp.locator("#modalMask.open").count()) {
      await dp.screenshot({ path: path.join(OUT, "d-modal-apply.png") });
      await dp.locator("#modalBox [data-close]").first().click();
    } else finding("P0", "申请弹窗", "点「加申请」弹窗未打开");

    // 今日视图：申请截止提醒
    await dp.locator('.sidenav .navitem[data-view="today"]').click();
    await dp.waitForTimeout(400);
    const boxText = await dp.locator("#todayApplyBox").textContent().catch(() => "");
    if (boxText && boxText.indexOf("临近截止") > -1 && boxText.indexOf("某大学A") > -1) console.log("OK 今日申请截止提醒正常显示");
    else finding("P1", "今日提醒", '申请截止提醒盒内容异常: "' + String(boxText).slice(0, 60) + '"');
    await dp.screenshot({ path: path.join(OUT, "d02-today-full.png"), fullPage: true });

    // 报告生成
    await dp.locator('.sidenav .navitem[data-view="reports"]').click();
    await dp.waitForTimeout(300);
    await dp.locator("#repQuickToday").click();
    await dp.waitForTimeout(600);
    const repSelf = await dp.locator("#repSelf").inputValue().catch(() => "");
    if (repSelf && repSelf.indexOf("个人学习与留学申请") > -1) console.log("OK 自用版日报含学习与申请段");
    else finding("P1", "日报生成", "自用版日报未包含学习与申请段");
    const repLeader = await dp.locator("#repLeader").inputValue().catch(() => "");
    if (repLeader && repLeader.indexOf("个人学习与留学申请") === -1) console.log("OK 领导摘要不含学习与申请段");
    else finding("P1", "日报生成", "领导摘要不应包含学习与申请段");
    await dp.screenshot({ path: path.join(OUT, "d-reports-gen.png") });

    // 申请视图截止卡
    await dp.locator('.sidenav .navitem[data-view="apply"]').click();
    await dp.waitForTimeout(400);
    const dlText = await dp.locator("#applyDeadlineList").textContent().catch(() => "");
    if (dlText && dlText.indexOf("某大学A") > -1 && dlText.indexOf("剩 5 天") > -1) console.log("OK 申请页临近截止卡含倒计时");
    else finding("P1", "申请截止卡", '截止卡内容异常: "' + String(dlText).slice(0, 60) + '"');
    if (dlText && dlText.indexOf("某大学B") > -1) finding("P2", "申请截止卡", "60 天后的远期申请不应出现在截止卡");

    const realD = errors.filter(e => e.indexOf("net::") === -1 && e.indexOf("favicon") === -1);
    if (realD.length) finding("P0", "控制台", "桌面端有 " + realD.length + " 个 JS 错误：" + realD.slice(0, 3).join(" | ").slice(0, 200));
    else console.log("OK 桌面端无 JS 控制台错误");
  }
  await desktop.close();

  // ---------- 手机 390x844 ----------
  console.log("\n===== 手机端 390x844 =====");
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  {
    const m = await newPage(mobile);
    const mp = m.page, mErrors = m.errors;
    await mp.goto(URL, { waitUntil: "load", timeout: 30000 });
    await mp.waitForTimeout(1200);
    await mp.screenshot({ path: path.join(OUT, "m01-today.png") });

    const navMetrics = await mp.evaluate(() => {
      const nav = document.getElementById("bottomnav");
      if (!nav) return null;
      const btns = Array.from(nav.querySelectorAll("button"));
      const rows = new Set();
      btns.forEach(b => { const r = b.getBoundingClientRect(); rows.add(Math.round(r.top)); });
      return {
        btnCount: btns.length,
        navClientWidth: nav.clientWidth,
        navScrollWidth: nav.scrollWidth,
        overflow: nav.scrollWidth > nav.clientWidth + 2,
        wrappedRows: rows.size,
        btnMinWidth: btns.length ? Math.min(...btns.map(b => b.getBoundingClientRect().width)) : 0,
        btnHeight: btns.length ? btns[0].getBoundingClientRect().height : 0,
        bodyHScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      };
    }).catch(() => null);
    if (navMetrics) {
      console.log("底部导航度量:", JSON.stringify(navMetrics));
      if (navMetrics.overflow || navMetrics.wrappedRows > 1) finding("P0", "手机底部导航", "底部导航 " + navMetrics.btnCount + " 个按钮溢出/换行（" + navMetrics.wrappedRows + " 行，scrollWidth " + navMetrics.navScrollWidth + " > " + navMetrics.navClientWidth + "）");
      else console.log("OK 底部导航未溢出");
      if (navMetrics.bodyHScroll) finding("P1", "手机横向滚动", "页面出现横向滚动条");
      if (navMetrics.btnMinWidth && navMetrics.btnMinWidth < 40) finding("P1", "触控目标", "底部导航按钮最小宽度 " + navMetrics.btnMinWidth.toFixed(0) + "px < 40px 触控标准");
    } else finding("P1", "手机底部导航", "未找到底部导航元素");

    /* 视图可达性：主按钮直切；抽屉视图需经「更多」抽屉到达 */
    const DRAWER_VIEWS = ["projects", "research", "notes", "resources", "reports", "settings"];
    for (const v of VIEWS.slice(1)) {
      const nav = mp.locator('#bottomnav button[data-view="' + v + '"]');
      if (await nav.count()) {
        await nav.click();
        await mp.waitForTimeout(500);
        await mp.screenshot({ path: path.join(OUT, "m-" + v + ".png") });
      } else if (DRAWER_VIEWS.indexOf(v) > -1) {
        /* 经抽屉到达 */
        const moreBtn = mp.locator("#btnMore");
        if (!(await moreBtn.count())) { finding("P1", "手机导航", "缺少「更多」按钮（视图 " + v + " 不可达）"); continue; }
        await moreBtn.click();
        await mp.waitForTimeout(400);
        const drawerOpen = await mp.locator("#moredrawer.open").count();
        if (!drawerOpen) { finding("P1", "手机导航", "「更多」抽屉无法打开（视图 " + v + " 不可达）"); continue; }
        await mp.screenshot({ path: path.join(OUT, "m-drawer-open.png") });
        const dbtn = mp.locator('#moredrawer button.dbtn[data-view="' + v + '"]');
        if (!(await dbtn.count())) { finding("P1", "手机导航", "抽屉缺少视图 " + v); continue; }
        const btnRect = await dbtn.boundingBox();
        if (!btnRect || btnRect.width < 40 || btnRect.height < 40) { finding("P1", "触控目标", "抽屉内视图 " + v + " 按钮触控区不足 40px"); continue; }
        await dbtn.click();
        await mp.waitForTimeout(500);
        const active = await mp.locator('#view-' + v + ".active").count();
        if (!active) { finding("P1", "手机导航", "抽屉切换视图 " + v + " 未生效"); continue; }
        await mp.screenshot({ path: path.join(OUT, "m-" + v + ".png") });
        /* 抽屉应已自动收起 */
        if (await mp.locator("#moredrawer.open").count()) finding("P1", "手机导航", "切换视图后抽屉未自动收起");
        console.log("OK 抽屉可达: " + v);
      } else {
        finding("P1", "手机导航", "视图 " + v + " 在底部导航与抽屉均不可达");
      }
    }

    // 手机弹窗
    await mp.locator('#bottomnav button[data-view="tasks"]').click();
    await mp.waitForTimeout(300);
    await mp.locator("#btnNewTask").click();
    await mp.waitForTimeout(400);
    if (await mp.locator("#modalMask.open").count()) {
      await mp.screenshot({ path: path.join(OUT, "m-modal-task.png") });
      const mRect = await mp.locator("#modalBox").boundingBox();
      if (mRect && (mRect.width > 390 + 4 || mRect.x < -4)) finding("P1", "移动端弹窗", "任务弹窗宽度 " + mRect.width.toFixed(0) + "px 超出 390px 视口");
      else console.log("OK 移动端任务弹窗宽度正常");
      await mp.locator("#modalBox [data-close]").first().click();
    } else finding("P0", "移动端弹窗", "手机点「新建任务」弹窗未打开");

    const touchMetrics = await mp.evaluate(() => {
      const els = Array.from(document.querySelectorAll(".btn-mini"));
      return els.length ? Math.min(...els.map(e => e.getBoundingClientRect().height)) : null;
    });
    console.log("btn-mini 最小高度:", touchMetrics, "px");
    if (touchMetrics && touchMetrics < 28) finding("P2", "触控目标", "btn-mini 最小高度 " + touchMetrics.toFixed(0) + "px 偏小（建议 >=44px）");

    const realM = mErrors.filter(e => e.indexOf("net::") === -1 && e.indexOf("favicon") === -1);
    if (realM.length) finding("P0", "控制台", "手机端有 " + realM.length + " 个 JS 错误：" + realM.slice(0, 3).join(" | ").slice(0, 200));
    else console.log("OK 手机端无 JS 控制台错误");
  }
  await mobile.close();
  await browser.close();
  server.close();

  console.log("\n===== UI/UX 审查汇总 =====");
  console.log("截图保存于:", OUT);
  fs.writeFileSync(path.join(OUT, "findings.json"), JSON.stringify(findings, null, 2));
  if (!findings.length) console.log("未发现问题");
  else console.log("共 " + findings.length + " 项发现（P0=" + findings.filter(f => f.severity === "P0").length + " P1=" + findings.filter(f => f.severity === "P1").length + " P2=" + findings.filter(f => f.severity === "P2").length + "）");
})().catch(e => { console.error("HARNESS_ERROR:", e); process.exit(2); });
