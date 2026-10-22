// README 用实际截图：本地起服务渲染（mock SDK + 种子数据），桌面今日/任务 + 手机端
"use strict";
const path = require("path");
const fs = require("fs");
const http = require("http");
const { chromium } = require("playwright-core");

const HTML = fs.readFileSync(path.join(__dirname, "..", "workbench.html"), "utf8");
const OUT = path.join(__dirname, "..", "..", "screenshots");
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const server = http.createServer((req, res) => { res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(HTML); });
function todayStr() { const d = new Date(); const p = n => (n < 10 ? "0" + n : "" + n); return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()); }
function addDays(s, n) { const d = new Date(s + "T00:00:00"); d.setDate(d.getDate() + n); const p = n2 => (n2 < 10 ? "0" + n2 : "" + n2); return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()); }
const TODAY = todayStr();
const DB = { tasks: "tdNWBhRqvwIKXkz2ji0uyb", projects: "2klqa8d0rbO47x0FhoVK3W", research: "f20RfANYTZAqezxUqZ1ZrJ", notes: "PDFBIwRRZEGd2jfJbGiuY5", resources: "wBJtimnuDTDrgg2Zaf36ZA", reports: "VnPlGp0UnpMluFmFnkTpSz", airecords: "DHd1C9sNJOt2SRa35BKRME", study: "xY6fAaJczfGY0gTkdYeZwu", apply: "SE9AvDWGnB1YBZd6hrFdry", resume: "q6ecJx2G3Ephav966tBHhQ" };
const STORE = {};
STORE[DB.tasks] = [
  { _id: "t1", "标题": "官网首页内容核对", "分类": "园区官网", "关联项目": "园区官网建设", "优先级": "重要且紧急", "状态": "进行中", "计划日期": TODAY, "截止日期": addDays(TODAY, 2), "下一步": "核对栏目文案与图片素材", "创建日期": addDays(TODAY, -1), "今日重点": true },
  { _id: "t2", "标题": "回复供应商报价确认邮件", "分类": "其他", "优先级": "紧急不重要", "状态": "待开始", "计划日期": addDays(TODAY, -2), "截止日期": addDays(TODAY, -1), "顺延次数": 1, "创建日期": addDays(TODAY, -3) },
  { _id: "t3", "标题": "小程序需求访谈准备", "分类": "园区小程序", "关联项目": "园区小程序建设", "优先级": "重要不紧急", "状态": "待开始", "计划日期": addDays(TODAY, 2), "截止日期": addDays(TODAY, 6), "创建日期": addDays(TODAY, -1) },
  { _id: "t4", "标题": "生成今日日报", "分类": "日常报告", "优先级": "一般", "状态": "已完成", "计划日期": TODAY, "完成时间": TODAY, "创建日期": addDays(TODAY, -1) },
  { _id: "t5", "标题": "备案材料提交", "分类": "园区官网", "关联项目": "园区官网建设", "优先级": "重要且紧急", "状态": "已完成", "计划日期": addDays(TODAY, -1), "完成时间": addDays(TODAY, -1), "创建日期": addDays(TODAY, -5) },
  { _id: "t6", "标题": "写 PS 初稿", "分类": "留学申请", "优先级": "重要不紧急", "状态": "进行中", "计划日期": addDays(TODAY, -1), "截止日期": addDays(TODAY, 3), "创建日期": addDays(TODAY, -6) },
  { _id: "t7", "标题": "截图核对移动端布局", "分类": "工作流优化", "优先级": "一般", "状态": "已完成", "计划日期": addDays(TODAY, -2), "完成时间": addDays(TODAY, -2), "创建日期": addDays(TODAY, -2) },
  { _id: "t8", "标题": "整理商户访谈结论", "分类": "需求调研", "优先级": "重要不紧急", "状态": "等待", "等待谁": "招商部", "等待事项": "确认流量扶持口径", "下次跟进": addDays(TODAY, 1), "计划日期": addDays(TODAY, -1), "截止日期": addDays(TODAY, 4), "创建日期": addDays(TODAY, -4) },
];
STORE[DB.projects] = [
  { _id: "p1", "项目名称": "园区官网建设", "工作层级": "核心工作", "当前阶段": "内容与素材", "阶段目标日期": addDays(TODAY, 12), "下一步": "首页内容核对后提交初审", "卡点": "", "目标": "完成 CN+GLOBAL 双站架构并上线", "最近进展": "ICP 备案进行中" },
  { _id: "p2", "项目名称": "园区小程序建设", "工作层级": "核心工作", "当前阶段": "需求", "阶段目标日期": addDays(TODAY, 40), "下一步": "完成首批需求访谈", "卡点": "等物业方提供现有会员数据口径", "目标": "小程序一期上线", "最近进展": "已收集到 3 条租户诉求" },
  { _id: "p3", "项目名称": "园区需求调研", "工作层级": "核心工作", "当前阶段": "访谈中", "阶段目标日期": addDays(TODAY, 20), "下一步": "整理访谈结论并区分已确认需求/待验证想法", "卡点": "", "目标": "形成需求清单支撑官网与小程序建设", "最近进展": "已完成招商部访谈" },
];
STORE[DB.research] = [
  { _id: "r1", "调研对象": "招商部", "调研日期": addDays(TODAY, -1), "关联项目": "园区小程序建设", "性质": "已确认需求", "真实问题或场景": "租户常问入驻后有哪些流量扶持政策", "初步结论": "建议官网增加「入驻企业」栏目", "下一步": "找品牌部确认首批案例素材", "资料来源": "访谈记录" },
  { _id: "r2", "调研对象": "鞋服品牌商户", "调研日期": addDays(TODAY, -3), "关联项目": "园区官网建设", "性质": "待验证想法", "真实问题或场景": "商户希望官网突出材质与工艺展示", "初步结论": "待进一步访谈验证", "下一步": "补充 2-3 家商户访谈", "资料来源": "现场沟通" },
];
STORE[DB.notes] = [{ _id: "n1", "正文": "官网首页可参考「材质与工艺」板块的设计，以鞋履为主体串联服装、手表、箱包", "标签": "官网,灵感", "关联项目": "园区官网建设" }];
STORE[DB.resources] = [{ _id: "res1", "名称": "园区官网建设方案 V2.1", "本地路径": "C:\\Users\\DC\\Documents\\Study_Notes\\园区官网建设方案V2.1.md", "关联项目": "园区官网建设", "用途说明": "建站硬约束依据" }];
STORE[DB.airecords] = [{ _id: "a1", "日期": TODAY, "来源": "WorkBuddy", "类型": "实际完成", "主题": "工作台改版上线", "内容摘要": "Bento + 玻璃拟态改造完成并发布", "关联项目": "工作台" }];
STORE[DB.study] = [
  { _id: "sd1", "学习主题": "JavaScript 异步编程", "类型": "技能学习", "进度状态": "已完成", "计划日期": TODAY, "学习日期": TODAY, "时长分钟": 45, "笔记": "Promise/async-await 复习" },
  { _id: "sd2", "学习主题": "雅思听力精听", "类型": "语言备考", "进度状态": "进行中", "学习日期": TODAY, "时长分钟": 30 },
];
STORE[DB.apply] = [
  { _id: "ap1", "学校": "某大学A", "专业项目": "计算机硕士", "申请轮次": "第一轮", "截止日期": addDays(TODAY, 5), "申请状态": "材料准备中", "优先级": "重要且紧急", "材料清单": "PS、推荐信 x2、成绩单", "下一步": "写 PS 初稿" },
  { _id: "ap2", "学校": "某大学B", "专业项目": "数据科学", "申请轮次": "第二轮", "截止日期": addDays(TODAY, 60), "申请状态": "待开始", "优先级": "重要不紧急", "下一步": "列选校对比表" },
];
const CURM = TODAY.substring(0, 7);
STORE[DB.resume] = [
  { _id: "cv1", "记录类型": "成果条目", "成果标题": "工作台玻璃拟态 + Bento 改版上线", "成果类型": "项目里程碑", "月份归属": CURM, "量化指标": "覆盖 10 大板块 / 282 项单测", "成果描述": "主导工作台界面改造与云端重建，建立单测/集成/lint/布局量测四道质量门", "证据来源": "项目：工作台", "证据链接": { text: "workbuddy.link 发布页", link: "https://workbuddy.link/p/MwXKAV7BlcR9zZAXXf0p3z" }, "纳入简历": true, "创建日期": TODAY },
  { _id: "cv2", "记录类型": "成果条目", "成果标题": "备案材料提交", "成果类型": "任务完成", "月份归属": CURM, "证据来源": "任务：备案材料提交（园区官网建设）", "纳入简历": true, "创建日期": TODAY },
  { _id: "cv3", "记录类型": "成果条目", "成果标题": "完成 JavaScript 异步编程学习", "成果类型": "学习成果", "月份归属": CURM, "量化指标": "投入 45 分钟", "证据来源": "学习记录：技能学习", "纳入简历": false, "创建日期": TODAY },
  { _id: "sv1", "记录类型": "版本快照", "成果标题": CURM.replace(/\d{2}$/, m => String(Number(m) - 1).padStart(2, "0")) + " 简历快照", "月份归属": CURM.replace(/\d{2}$/, m => String(Number(m) - 1).padStart(2, "0")), "快照内容": "# 上月简历增量草稿\n\n## 任务完成\n- 完成 ICP 备案材料提交", "创建日期": addDays(TODAY, -20) },
];
const SCHEMA = {};
SCHEMA[DB.tasks] = ["分类|园区官网,园区小程序,需求调研,工作流优化,企微自动化,日常报告,个人学习,留学申请,其他", "优先级|重要且紧急,紧急不重要,重要不紧急,一般", "状态|收集箱,待开始,进行中,等待,已完成,已取消"];
SCHEMA[DB.projects] = ["工作层级|核心工作,次要工作"];
SCHEMA[DB.research] = ["性质|已确认需求,待验证想法"];
SCHEMA[DB.reports] = ["报告类型|日报,周报"];
SCHEMA[DB.airecords] = ["来源|WorkBuddy,Codex,DSH,其他", "类型|实际完成,产出物,尝试失败,讨论"];
SCHEMA[DB.study] = ["类型|语言备考,专业课程,技能学习,证书备考,阅读", "进度状态|未开始,进行中,已完成,暂停"];
SCHEMA[DB.apply] = ["申请轮次|提前批,第一轮,第二轮,末轮", "申请状态|待开始,材料准备中,已提交,面试中,已录取,已放弃", "优先级|重要且紧急,紧急不重要,重要不紧急,一般"];
SCHEMA[DB.resume] = ["记录类型|成果条目,版本快照", "成果类型|任务完成,项目里程碑,学习成果,其他"];
function buildSchemaProps(lines) {
  return (lines || []).map(function (l) {
    var parts = l.split("|"); var name = parts[0], opts = parts[1];
    if (!opts) return { name: name, type: "text" };
    return { name: name, type: "select", config: { options: opts.split(",").map(function (t, i) { return { id: "o" + i, text: t, style: i + 1 }; }) } };
  }).concat([{ name: "是否示例", type: "checkbox" }]);
}
const SCHEMA_OBJ = {};
Object.keys(SCHEMA).forEach(function (k) { SCHEMA_OBJ[k] = buildSchemaProps(SCHEMA[k]); });

(async () => {
  await new Promise(r => server.listen(18767, "127.0.0.1", r));
  const URL = "http://127.0.0.1:18767/workbench.html";
  const browser = await chromium.launch({ headless: true, executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
  const init = "window.__STORE = " + JSON.stringify(STORE) + "; window.__SCHEMA = " + JSON.stringify(SCHEMA_OBJ) + ";" +
    "window.__SMART_PAGE__ = { database: {" +
    "query: function (p) { return Promise.resolve({ results: (window.__STORE[p.databaseId] || []), hasMore: false }); }," +
    "getSchema: function (p) { return Promise.resolve({ properties: (window.__SCHEMA[p.databaseId] || []) }); }," +
    "addRecord: function (p) { var all = window.__STORE[p.databaseId] = window.__STORE[p.databaseId] || []; var id = 'new_' + Date.now(); var row = { _id: id }; for (var k in p.properties) { var v = p.properties[k]; var t = Object.keys(v)[0]; row[k] = (t === 'url') ? { text: v[t].text, link: v[t].link } : v[t]; } all.push(row); return Promise.resolve({ id: id }); }," +
    "updateRecord: function () { return Promise.resolve({}); }," +
    "deleteRecord: function () { return Promise.resolve({}); }," +
    "onUpdated: function () {}" +
    "} };";

  // 桌面 1440：今日 / 任务
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  {
    const page = await desktop.newPage();
    await page.addInitScript(init);
    await page.goto(URL + "#/today", { waitUntil: "load", timeout: 30000 });
    await page.waitForTimeout(1800);
    await page.screenshot({ path: path.join(OUT, "desktop-today.png"), fullPage: true });
    await page.evaluate(() => { location.hash = "#/tasks?f=all"; });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT, "desktop-tasks.png"), fullPage: false });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.evaluate(() => { location.hash = "#/resume"; });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT, "desktop-resume.png"), fullPage: true });
  }
  await desktop.close();

  // 手机 390：今日
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  {
    const page = await mobile.newPage();
    await page.addInitScript(init);
    await page.goto(URL + "#/today", { waitUntil: "load", timeout: 30000 });
    await page.waitForTimeout(1800);
    await page.screenshot({ path: path.join(OUT, "mobile-today.png") });
  }
  await mobile.close();

  await browser.close();
  server.close();
  console.log("screenshots ->", OUT);
  fs.readdirSync(OUT).forEach(f => console.log(" ", f, Math.round(fs.statSync(path.join(OUT, f)).size / 1024) + "KB"));
})().catch(e => { console.error("HARNESS:", e); process.exit(2); });
