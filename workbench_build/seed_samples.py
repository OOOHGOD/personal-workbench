# -*- coding: utf-8 -*-
import subprocess, json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
PY = r"C:/Users/DC/.workbuddy/binaries/python/versions/3.13.12/python.exe"
SKILL = r"C:/Program Files/WorkBuddy/resources/app.asar.unpacked/resources/plugins/workbuddy-builtin/skills/library"
PAGE = "MwXKAV7BlcR9zZAXXf0p3z"
DBS = {
    "tasks": "tdNWBhRqvwIKXkz2ji0uyb",
    "projects": "2klqa8d0rbO47x0FhoVK3W",
    "research": "f20RfANYTZAqezxUqZ1ZrJ",
    "notes": "PDFBIwRRZEGd2jfJbGiuY5",
    "resources": "wBJtimnuDTDrgg2Zaf36ZA",
}

def run(script, *args):
    out = subprocess.run([PY, SKILL + "/" + script] + list(args), capture_output=True, text=True, encoding="utf-8")
    return out.stdout.strip()

def space_api(api, *args):
    out = subprocess.run([PY, SKILL + "/space_api.py", api] + list(args), capture_output=True, text=True, encoding="utf-8")
    return out.stdout.strip()

# 1) 挂载 5 张表到页面下
for key, dbid in DBS.items():
    r = space_api("space.workspace.move-node", "--node-id", dbid, "--target-parent-id", PAGE)
    ok = '"api"' in r and '"error"' not in r
    print("move", key, "OK" if ok else "FAIL " + r[:200])

# 2) 示例数据
def add(dbid, records):
    r = run("database/batch_add_database_records.py", "--database-id", dbid, "--records", json.dumps(records, ensure_ascii=False))
    return r

T = lambda v: {"text": v}
S = lambda v: {"select": v}
D = lambda v: {"date": v}
C = lambda v: {"checkbox": v}
N = lambda v: {"number": v}
U = lambda v: {"url": {"text": v, "link": v}}

r1 = add(DBS["tasks"], [
    {"标题": T("官网首页内容核对（示例）"), "分类": S("园区官网"), "关联项目": T("园区官网建设"), "优先级": S("重要且紧急"), "状态": S("进行中"), "计划日期": D("2026-10-14"), "截止日期": D("2026-10-16"), "下一步": T("核对栏目文案与图片素材"), "创建日期": D("2026-10-13"), "今日重点": C(True), "是否示例": C(True)},
    {"标题": T("小程序需求访谈准备（示例）"), "分类": S("园区小程序"), "关联项目": T("园区小程序建设"), "优先级": S("重要不紧急"), "状态": S("待开始"), "计划日期": D("2026-10-16"), "截止日期": D("2026-10-20"), "下一步": T("列出访谈提纲，约招商部时间"), "创建日期": D("2026-10-13"), "是否示例": C(True)},
    {"标题": T("整理调研结论初稿（示例）"), "分类": S("需求调研"), "优先级": S("紧急不重要"), "状态": S("收集箱"), "创建日期": D("2026-10-13"), "是否示例": C(True)},
    {"标题": T("回复供应商报价确认邮件（示例）"), "分类": S("其他"), "优先级": S("紧急不重要"), "状态": S("待开始"), "计划日期": D("2026-10-12"), "截止日期": D("2026-10-12"), "原计划日期": D("2026-10-11"), "顺延次数": N(1), "最近顺延": D("2026-10-13"), "创建日期": D("2026-10-11"), "是否示例": C(True)},
    {"标题": T("生成今日日报（示例）"), "分类": S("日常报告"), "优先级": S("一般"), "状态": S("已完成"), "计划日期": D("2026-10-13"), "完成时间": D("2026-10-13"), "创建日期": D("2026-10-13"), "是否示例": C(True)},
])
print("add tasks:", r1[:260])

r2 = add(DBS["projects"], [
    {"项目名称": T("园区官网建设（示例）"), "工作层级": S("核心工作"), "当前阶段": T("内容与素材"), "阶段目标日期": D("2026-10-31"), "下一步": T("首页内容核对后提交初审"), "卡点": T(""), "目标": T("完成 CN+GLOBAL 双站架构并上线"), "最近进展": T("ICP 备案进行中，宣传视频与展示图片拍摄中"), "是否示例": C(True)},
    {"项目名称": T("园区小程序建设（示例）"), "工作层级": S("核心工作"), "当前阶段": T("需求"), "阶段目标日期": D("2026-11-30"), "下一步": T("完成首批需求访谈"), "卡点": T("等物业方提供现有会员数据口径"), "目标": T("小程序一期上线"), "最近进展": T("已收集到 3 条租户诉求"), "是否示例": C(True)},
    {"项目名称": T("园区需求调研（示例）"), "工作层级": S("核心工作"), "当前阶段": T("访谈中"), "阶段目标日期": D("2026-11-15"), "下一步": T("整理访谈结论并区分已确认需求/待验证想法"), "卡点": T(""), "目标": T("形成需求清单支撑官网与小程序建设"), "最近进展": T("已完成招商部访谈"), "是否示例": C(True)},
])
print("add projects:", r2[:200])

r3 = add(DBS["research"], [
    {"调研对象": T("招商部（示例）"), "调研日期": D("2026-10-13"), "关联项目": T("园区小程序建设（示例）"), "性质": S("已确认需求"), "真实问题或场景": T("租户常问入驻后有哪些流量扶持政策"), "期望效果": T("官网和小程序能展示入驻企业案例"), "初步结论": T("建议官网增加「入驻企业」栏目"), "待确认事项": T("案例素材由品牌部还是租户提供"), "下一步": T("找品牌部确认首批案例素材"), "资料来源": T("访谈记录"), "是否示例": C(True)},
    {"调研对象": T("鞋服品牌商户（示例）"), "调研日期": D("2026-10-12"), "关联项目": T("园区官网建设（示例）"), "性质": S("待验证想法"), "真实问题或场景": T("商户希望官网突出材质与工艺展示"), "期望效果": T("提升品牌调性吸引力"), "初步结论": T("待进一步访谈验证"), "待确认事项": T("是否有足够素材支撑工艺专栏"), "下一步": T("补充 2-3 家商户访谈"), "资料来源": T("现场沟通"), "是否示例": C(True)},
])
print("add research:", r3[:200])

r4 = add(DBS["notes"], [
    {"正文": T("官网首页可参考「材质与工艺」板块的设计，以鞋履为主体串联服装、手表、箱包（示例速记）"), "标签": T("官网,灵感"), "关联项目": T("园区官网建设（示例）"), "是否示例": C(True)},
])
print("add notes:", r4[:200])

r5 = add(DBS["resources"], [
    {"名称": T("园区官网建设方案 V2.1（示例）"), "本地路径": T("C:\\Users\\DC\\Documents\\GitHub\\Study_Notes\\工作\\金峰\\网站建设\\园区官网建设方案V2.1.md"), "关联项目": T("园区官网建设（示例）"), "用途说明": T("建站硬约束依据：无表单、首页4屏、CN+GLOBAL双站"), "是否示例": C(True)},
])
print("add resources:", r5[:200])
