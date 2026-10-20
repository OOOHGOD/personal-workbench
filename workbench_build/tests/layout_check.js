// Bento 布局多宽度专项：本地起服务渲染 workbench.html（mock 数据），量测各视口下网格列数/卡片跨度/居中/横向滚动
"use strict";
const path = require("path");
const fs = require("fs");
const http = require("http");
const { chromium } = require("playwright-core");

const HTML = fs.readFileSync(path.join(__dirname, "..", "workbench.html"), "utf8");
const OUT = path.join(__dirname, "layout_shots");
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const server = http.createServer((req, res) => { res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(HTML); });
function todayStr() { const d = new Date(); const p = n => (n < 10 ? "0" + n : "" + n); return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()); }
function addDays(s, n) { const d = new Date(s + "T00:00:00"); d.setDate(d.getDate() + n); const p = n2 => (n2 < 10 ? "0" + n2 : "" + n2); return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()); }
const TODAY = todayStr();
const DB = { tasks: "tdNWBhRqvwIKXkz2ji0uyb", projects: "2klqa8d0rbO47x0FhoVK3W", research: "f20RfANYTZAqezxUqZ1ZrJ", notes: "PDFBIwRRZEGd2jfJbGiuY5", resources: "wBJtimnuDTDrgg2Zaf36ZA", reports: "VnPlGp0UnpMluFmFnkTpSz", airecords: "DHd1C9sNJOt2SRa35BKRME", study: "xY6fAaJczfGY0gTkdYeZwu", apply: "SE9AvDWGnB1YBZd6hrFdry" };
const STORE = {};
STORE[DB.tasks] = [
  { _id: "t1", "标题": "官网首页内容核对（示例）", "分类": "园区官网", "关联项目": "园区官网建设", "优先级": "重要且紧急", "状态": "进行中", "计划日期": TODAY, "截止日期": addDays(TODAY, 2), "下一步": "核对栏目文案与图片素材", "创建日期": addDays(TODAY, -1), "今日重点": true, "是否示例": true },
  { _id: "t2", "标题": "回复供应商报价确认邮件（示例）", "分类": "其他", "优先级": "紧急不重要", "状态": "待开始", "计划日期": addDays(TODAY, -2), "截止日期": addDays(TODAY, -2), "顺延次数": 1, "创建日期": addDays(TODAY, -3), "是否示例": true },
  { _id: "t3", "标题": "小程序需求访谈准备（示例）", "分类": "园区小程序", "关联项目": "园区小程序建设", "优先级": "重要不紧急", "状态": "待开始", "计划日期": addDays(TODAY, 2), "截止日期": addDays(TODAY, 6), "创建日期": addDays(TODAY, -1), "是否示例": true },
  { _id: "t4", "标题": "生成今日日报（示例）", "分类": "日常报告", "优先级": "一般", "状态": "已完成", "计划日期": TODAY, "完成时间": TODAY, "创建日期": addDays(TODAY, -1), "是否示例": true },
  { _id: "t5", "标题": "整理调研结论初稿（示例）", "分类": "需求调研", "优先级": "紧急不重要", "状态": "收集箱", "创建日期": addDays(TODAY, -1), "是否示例": true },
];
STORE[DB.projects] = [
  { _id: "p1", "项目名称": "园区官网建设（示例）", "工作层级": "核心工作", "当前阶段": "内容与素材", "阶段目标日期": addDays(TODAY, 12), "下一步": "首页内容核对后提交初审", "卡点": "", "目标": "双站上线", "最近进展": "备案中", "是否示例": true },
  { _id: "p2", "项目名称": "园区小程序建设（示例）", "工作层级": "核心工作", "当前阶段": "需求", "阶段目标日期": addDays(TODAY, 40), "下一步": "完成首批需求访谈", "卡点": "等物业方提供会员数据口径", "目标": "一期上线", "最近进展": "收集3条诉求", "是否示例": true },
];
STORE[DB.airecords] = [{ _id: "a1", "日期": TODAY, "来源": "WorkBuddy", "类型": "实际完成", "主题": "工作台第3期开发", "内容摘要": "学习+申请模块上线", "关联项目": "工作台", "是否示例": true }];
STORE[DB.study] = [{ _id: "sd1", "学习主题": "雅思听力精听（示例）", "类型": "语言备考", "进度状态": "进行中", "学习日期": TODAY, "时长分钟": 30, "是否示例": true }];
STORE[DB.apply] = [{ _id: "ap1", "学校": "某大学A（示例）", "专业项目": "计算机硕士", "申请轮次": "第一轮", "截止日期": addDays(TODAY, 5), "申请状态": "材料准备中", "优先级": "重要且紧急", "材料清单": "PS、推荐信 x2、成绩单", "下一步": "写 PS 初稿", "是否示例": true }];
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
    var parts = l.split("|"); var name = parts[0], opts = parts[1];
    if (!opts) return { name: name, type: "text" };
    return { name: name, type: "select", config: { options: opts.split(",").map(function (t, i) { return { id: "o" + i, text: t, style: i + 1 }; }) } };
  }).concat([{ name: "是否示例", type: "checkbox" }]);
}
const SCHEMA_OBJ = {};
Object.keys(SCHEMA).forEach(function (k) { SCHEMA_OBJ[k] = buildSchemaProps(SCHEMA[k]); });

const VIEWPORTS = [
  { name: "w2560", width: 2560, height: 1440 },
  { name: "w1920", width: 1920, height: 1080 },
  { name: "w1440", width: 1440, height: 900 },
  { name: "w1180", width: 1180, height: 820 },
  { name: "w900", width: 900, height: 800 },
  { name: "m390", width: 390, height: 844, mobile: true },
];
const findings = [];

(async () => {
  await new Promise(r => server.listen(18766, "127.0.0.1", r));
  const URL = "http://127.0.0.1:18766/workbench.html#/today";
  const browser = await chromium.launch({ headless: true, executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.mobile, hasTouch: !!vp.mobile, deviceScaleFactor: vp.mobile ? 2 : 1 });
    const page = await ctx.newPage();
    const errs = [];
    page.on("pageerror", e => errs.push(String(e).slice(0, 120)));
    await page.addInitScript("window.__STORE = " + JSON.stringify(STORE) + "; window.__SCHEMA = " + JSON.stringify(SCHEMA_OBJ) + ";" +
      "window.__SMART_PAGE__ = { database: {" +
      "query: function (p) { return Promise.resolve({ results: (window.__STORE[p.databaseId] || []), hasMore: false }); }," +
      "getSchema: function (p) { return Promise.resolve({ properties: (window.__SCHEMA[p.databaseId] || []) }); }," +
      "addRecord: function (p) { var all = window.__STORE[p.databaseId] = window.__STORE[p.databaseId] || []; var id = 'new_' + Date.now(); var row = { _id: id }; for (var k in p.properties) { var v = p.properties[k]; var t = Object.keys(v)[0]; row[k] = (t === 'url') ? { text: v[t].text, link: v[t].link } : v[t]; } all.push(row); return Promise.resolve({ id: id }); }," +
      "updateRecord: function () { return Promise.resolve({}); }," +
      "deleteRecord: function () { return Promise.resolve({}); }," +
      "onUpdated: function () {}" +
      "} };");
    await page.goto(URL, { waitUntil: "load", timeout: 30000 });
    await page.waitForTimeout(1500);

    const m = await page.evaluate(() => {
      const de = document.documentElement;
      const grid = document.getElementById("view-today");
      const cs = getComputedStyle(grid);
      const content = document.querySelector(".content");
      const cr = content.getBoundingClientRect();
      const cards = {};
      ["todayBoardCard", "todayHandleCard", "cardCoreProjs", "cardWeek"].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const r = el.getBoundingClientRect();
        cards[id] = { w: Math.round(r.width), x: Math.round(r.left), y: Math.round(r.top) };
      });
      return {
        cols: cs.gridTemplateColumns.split(" ").length,
        contentW: Math.round(cr.width),
        contentX: Math.round(cr.left),
        hScroll: de.scrollWidth > de.clientWidth + 2,
        boardW: cards.todayBoardCard ? cards.todayBoardCard.w : 0,
        handleW: cards.todayHandleCard ? cards.todayHandleCard.w : 0,
        projsW: cards.cardCoreProjs ? cards.cardCoreProjs.w : 0,
        weekW: cards.cardWeek ? cards.cardWeek.w : 0,
        row1sameY: cards.todayBoardCard && cards.todayHandleCard ? cards.todayBoardCard.y === cards.todayHandleCard.y : null,
        row2sameY: cards.cardCoreProjs && cards.cardWeek ? cards.cardCoreProjs.y === cards.cardWeek.y : null,
      };
    });
    console.log(vp.name, JSON.stringify(m), errs.length ? "ERR:" + errs[0] : "");

    // 校验规则
    if (m.hScroll) findings.push(vp.name + " 出现横向滚动");
    if (!vp.mobile) {
      if (vp.width >= 1200 && m.cols !== 12) findings.push(vp.name + " 应为 12 列，实际 " + m.cols);
      if (vp.width >= 768 && vp.width < 1200 && m.cols !== 6) findings.push(vp.name + " 应为 6 列，实际 " + m.cols);
      // 居中度量：内容区左右留白应接近（在侧栏之外的可用区域内）
      if (vp.width >= 1200) {
        const sidenavW = 196;
        const avail = vp.width - sidenavW;
        const leftPad = m.contentX - sidenavW;
        const rightPad = avail - leftPad - m.contentW;
        if (Math.abs(leftPad - rightPad) > 8) findings.push(vp.name + " 未居中：左 " + leftPad + " 右 " + rightPad);
      }
      if (vp.width >= 1200) {
        // 12 列下：board(8) 与 handle(4) 同行、projs(4) 与 week(8) 同行
        if (m.row1sameY === false) findings.push(vp.name + " 看板与待处理未同行（Bento 第1行错位）");
        if (m.row2sameY === false) findings.push(vp.name + " 项目与本周未同行（Bento 第2行错位）");
        if (!(m.boardW > m.handleW)) findings.push(vp.name + " 今日任务大卡应宽于待处理卡");
      }
      if (vp.width >= 768 && vp.width < 1200) {
        if (!(m.boardW > m.handleW)) findings.push(vp.name + " 中屏看板应占整行（宽于待处理）");
      }
      if (vp.width >= 2000 && m.contentW > 1521) findings.push(vp.name + " 超宽屏未限宽：" + m.contentW);
    } else {
      if (m.cols !== 1) findings.push(vp.name + " 移动端应单列，实际 " + m.cols);
    }
    await page.screenshot({ path: path.join(OUT, "layout-" + vp.name + ".png") });
    await ctx.close();
  }
  await browser.close();
  server.close();
  console.log("\n===== 布局审查汇总 =====");
  console.log("截图:", OUT);
  if (!findings.length) console.log("全部通过，无布局问题");
  else { findings.forEach(f => console.log("[FAIL]", f)); process.exit(1); }
})().catch(e => { console.error("HARNESS:", e); process.exit(2); });
