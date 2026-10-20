# -*- coding: utf-8 -*-
"""集成测试：云端 9 张数据表真实 CRUD 回环 + 已发布产物校验 + 页面-数据表关系
（第3期：新增学习记录表、留学申请表；页面为云重建后的新节点）"""
import subprocess, json, sys, io, os, tempfile
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
PY = r"C:/Users/DC/.workbuddy/binaries/python/versions/3.13.12/python.exe"
SKILL = r"C:/Program Files/WorkBuddy/resources/app.asar.unpacked/resources/plugins/workbuddy-builtin/skills/library"
PAGE = "MwXKAV7BlcR9zZAXXf0p3z"
TABLES = {
    "工作任务表": ("tdNWBhRqvwIKXkz2ji0uyb", {
        "标题": {"text": "[TEST] 集成测试任务"},
        "分类": {"select": "园区官网"},
        "优先级": {"select": "重要且紧急"},
        "状态": {"select": "待开始"},
        "计划日期": {"date": "2026-10-19"},
        "截止日期": {"date": "2026-10-21"},
        "是否示例": {"checkbox": False},
    }, [
        ("状态改为等待", {"状态": {"select": "等待"}, "等待谁": {"text": "[TEST]数据组"}, "下次跟进": {"date": "2026-10-20"}}),
        ("date:null 清空截止日期", {"截止日期": {"date": None}}),
    ]),
    "项目表": ("2klqa8d0rbO47x0FhoVK3W", {
        "项目名称": {"text": "[TEST] 集成测试项目"},
        "工作层级": {"select": "核心工作"},
        "当前阶段": {"text": "需求"},
        "是否示例": {"checkbox": False},
    }, [
        ("更新卡点", {"卡点": {"text": "[TEST]等数据"}, "下一步": {"text": "[TEST]催一下"}}),
    ]),
    "调研记录表": ("f20RfANYTZAqezxUqZ1ZrJ", {
        "调研对象": {"text": "[TEST] 测试部门"},
        "性质": {"select": "待验证想法"},
        "调研日期": {"date": "2026-10-19"},
        "是否示例": {"checkbox": False},
    }, [
        ("改性质为已确认需求", {"性质": {"select": "已确认需求"}, "初步结论": {"text": "[TEST]结论"}}),
    ]),
    "灵感速记表": ("PDFBIwRRZEGd2jfJbGiuY5", {
        "正文": {"text": "[TEST] 集成测试速记"},
        "标签": {"text": "测试"},
        "是否示例": {"checkbox": False},
    }, [
        ("更新标签", {"标签": {"text": "测试,集成"}}),
    ]),
    "资料索引表": ("wBJtimnuDTDrgg2Zaf36ZA", {
        "名称": {"text": "[TEST] 集成测试资料"},
        "网页链接": {"url": {"text": "WorkBuddy", "link": "https://www.workbuddy.cn"}},
        "本地路径": {"text": "C:\\test\\[TEST].md"},
        "是否示例": {"checkbox": False},
    }, [
        ("更新用途", {"用途说明": {"text": "[TEST]验证写入"}}),
    ]),
    "报告存档表": ("VnPlGp0UnpMluFmFnkTpSz", {
        "报告类型": {"select": "日报"},
        "起始日期": {"date": "2026-10-19"},
        "结束日期": {"date": "2026-10-19"},
        "生成时间": {"date": "2026-10-19"},
        "自用记录": {"text": "[TEST] 自用记录草稿"},
        "领导摘要": {"text": "[TEST] 领导摘要草稿"},
        "是否示例": {"checkbox": False},
    }, [
        ("改为周报并更新摘要", {"报告类型": {"select": "周报"}, "领导摘要": {"text": "[TEST] 周报摘要"}}),
        ("date:null 清空起始日期", {"起始日期": {"date": None}}),
    ]),
    "AI工作记录表": ("DHd1C9sNJOt2SRa35BKRME", {
        "日期": {"date": "2026-10-19"},
        "来源": {"select": "WorkBuddy"},
        "类型": {"select": "产出物"},
        "主题": {"text": "[TEST] 集成测试AI记录"},
        "内容摘要": {"text": "[TEST] 验证AI记录写入"},
        "关联项目": {"text": "工作台"},
        "是否示例": {"checkbox": False},
    }, [
        ("改类型为尝试失败", {"类型": {"select": "尝试失败"}}),
    ]),
    "学习记录表": ("xY6fAaJczfGY0gTkdYeZwu", {
        "学习主题": {"text": "[TEST] 集成测试学习"},
        "类型": {"select": "技能学习"},
        "进度状态": {"select": "进行中"},
        "计划日期": {"date": "2026-10-19"},
        "学习日期": {"date": "2026-10-19"},
        "时长分钟": {"number": 30},
        "是否示例": {"checkbox": False},
    }, [
        ("改进度为已完成", {"进度状态": {"select": "已完成"}, "笔记": {"text": "[TEST]学完了"}}),
        ("date:null 清空计划日期", {"计划日期": {"date": None}}),
    ]),
    "留学申请表": ("SE9AvDWGnB1YBZd6hrFdry", {
        "学校": {"text": "[TEST] 集成测试大学"},
        "专业项目": {"text": "计算机"},
        "申请轮次": {"select": "第一轮"},
        "截止日期": {"date": "2026-11-01"},
        "申请状态": {"select": "材料准备中"},
        "优先级": {"select": "重要且紧急"},
        "是否示例": {"checkbox": False},
    }, [
        ("改申请状态为已提交", {"申请状态": {"select": "已提交"}, "下一步": {"text": "[TEST]等结果"}}),
        ("date:null 清空截止日期", {"截止日期": {"date": None}}),
    ]),
}

passed, failed = 0, []

def ok(cond, name):
    global passed
    if cond:
        passed += 1
        print("  PASS " + name)
    else:
        failed.append(name)
        print("  FAIL " + name)

def run(script, *args):
    out = subprocess.run([PY, SKILL + "/" + script] + list(args), capture_output=True, text=True, encoding="utf-8")
    return out.stdout.strip()

def space_api(api, *args):
    return subprocess.run([PY, SKILL + "/space_api.py", api] + list(args), capture_output=True, text=True, encoding="utf-8").stdout.strip()

print("[A] 云端 CRUD 回环（9 张表）")
created = []
for tname, (dbid, add_props, updates) in TABLES.items():
    print("-- " + tname)
    # 增
    r = run("database/batch_add_database_records.py", "--database-id", dbid, "--records", json.dumps([add_props], ensure_ascii=False))
    res = json.loads(r)["results"]
    ok(res and res[0].get("success"), tname + "：新增 [TEST] 记录")
    rid = res[0].get("id")
    created.append((dbid, rid, tname))
    # 查（防假成功）
    r = json.loads(run("database/get_database_record.py", "--database-id", dbid, "--record-id", rid))
    f = r.get("fields", {})
    first_key = list(add_props.keys())[0]
    expect0 = add_props[first_key][list(add_props[first_key].keys())[0]]
    actual0 = f.get(first_key)
    # 日期字段云端可能回读为完整 ISO 时间戳，取前 10 位日期比较
    if isinstance(expect0, str) and len(expect0) == 10 and expect0[4] == "-" and isinstance(actual0, str):
        ok(str(actual0)[:10] == expect0, tname + "：新增后回读字段一致")
    else:
        ok(actual0 == expect0, tname + "：新增后回读字段一致")
    # 改（含 date:null）
    for label, upd in updates:
        r = run("database/batch_update_database_records.py", "--database-id", dbid, "--records", json.dumps([{"record_id": rid, "properties": upd}], ensure_ascii=False))
        res2 = json.loads(r)["results"]
        ok(res2 and res2[0].get("success"), tname + "：" + label + " 写入成功")
        f2 = json.loads(run("database/get_database_record.py", "--database-id", dbid, "--record-id", rid))["fields"]
        for k, pv in upd.items():
            expect = pv[list(pv.keys())[0]]
            actual = f2.get(k)
            if k in ("状态", "性质", "优先级", "分类", "工作层级", "报告类型", "来源", "类型", "进度状态", "申请轮次", "申请状态"):
                actual = actual if isinstance(actual, str) else (actual or {}).get("text") if isinstance(actual, dict) else actual
            if expect is None:
                ok(actual is None, tname + "：" + label + " 字段 " + k + " 已清空(实际=%r)" % actual)
            elif isinstance(expect, dict):
                ok(isinstance(actual, dict) and actual.get("link") == expect.get("link"), tname + "：" + label + " 字段 " + k + " 一致")
            else:
                ok(str(actual).find(str(expect)) > -1 or actual == expect, tname + "：" + label + " 字段 " + k + " 一致(实际=%r)" % actual)
    # 删（[TEST] 自建探针豁免确认门）
    r = run("database/batch_delete_database_records.py", "--database-id", dbid, "--record-ids", json.dumps([rid]))
    res3 = json.loads(r)["results"]
    ok(res3 and res3[0].get("success"), tname + "：删除 [TEST] 记录")
    # 删后确认
    r = json.loads(run("database/get_database_record.py", "--database-id", dbid, "--record-id", rid))
    ok(not r.get("fields") or r.get("error"), tname + "：删除后回读为空")

print("\n[B] 页面-数据表绑定关系")
r = space_api("space.workspace.node-info", "--node-id", PAGE)
node = json.loads(r)["data"]["node"]
ok(node["kind"] == "web", "页面节点存在且为 web 类型")
ok(len(node.get("nodes", [])) == 9, "页面下挂 9 张子数据表（实际 %d）" % len(node.get("nodes", [])))
rel = json.loads(run("page/page_database_relation.py", "--action", "list", "--page-id", PAGE))
ok(len(rel["data"]["relations"]) == 9, "页面绑定关系 9 条")

print("\n[C] 已发布产物校验")
work = os.path.join(os.path.dirname(os.path.abspath(__file__)), "pub_check")
os.makedirs(work, exist_ok=True)
r = run("page/download_page_artifacts.py", "--node-id", PAGE, "--source", "publish", "--out-dir", work)
ok(r.startswith("KS_ARTIFACTS_OK"), "发布态产物下载成功")
if r.startswith("KS_ARTIFACTS_OK"):
    entry = json.loads(r[len("KS_ARTIFACTS_OK"):])["entry_html"]
    html = open(os.path.join(work, entry), encoding="utf-8").read()
    ok("__SMART_PAGE__" in html, "发布产物含 SDK 注入点")
    ok(html.count('"tdNWBhRqvwIKXkz2ji0uyb"') >= 3, "发布产物含任务表 databaseId 字面量")
    ok(html.count('"VnPlGp0UnpMluFmFnkTpSz"') >= 3, "发布产物含报告存档表 databaseId 字面量")
    ok(html.count('"DHd1C9sNJOt2SRa35BKRME"') >= 3, "发布产物含 AI 工作记录表 databaseId 字面量")
    ok(html.count('"xY6fAaJczfGY0gTkdYeZwu"') >= 3, "发布产物含学习记录表 databaseId 字面量")
    ok(html.count('"SE9AvDWGnB1YBZd6hrFdry"') >= 3, "发布产物含留学申请表 databaseId 字面量")
    ok("view-reports" in html and 'data-view="reports"' in html, "发布产物含报告视图与导航入口")
    ok("view-study" in html and 'data-view="study"' in html, "发布产物含学习视图与导航入口")
    ok("view-apply" in html and 'data-view="apply"' in html, "发布产物含申请视图与导航入口")
    ok("todayApplyBox" in html and "renderTodayApplyBox" in html, "发布产物含今日申请截止提醒")
    ok("个人学习与留学申请" in html, "发布产物含自用版学习/申请报告段")
    ok("buildDocx" in html and "crc32" in html, "发布产物含纯 JS docx 生成器")
    ok("generateReport" in html, "发布产物含报告草稿生成逻辑")
    ok("refreshAll" in html and "function refreshAll" in html, "发布产物含修复后的 refreshAll")
    ok("renderAll(" not in html, "发布产物不含残留 renderAll 调用")
    ok("onUpdated" in html, "发布产物含双向同步订阅")

print("\n[D] 示例数据完整性（页面首屏数据来源）")
r = json.loads(run("database/query_database_record.py", "--database-id", "tdNWBhRqvwIKXkz2ji0uyb"))
sample_tasks = [x for x in r["results"] if x.get("是否示例")]
real_tasks = [x for x in r["results"] if not x.get("是否示例")]
ok(len(sample_tasks) == 5, "任务表 5 条示例数据（实际 %d）" % len(sample_tasks))
# v4 起复用第1-2期旧表，允许存在用户真实数据；仅要求无 [TEST] 探针残留
test_residue = [x for x in r["results"] if str(x.get("标题", "")).startswith("[TEST]")]
ok(len(test_residue) == 0, "任务表无 [TEST] 测试探针残留（真实数据允许存在，实际 %d 条）" % len(real_tasks))
overdue_sample = [x for x in sample_tasks if x.get("截止日期") and str(x["截止日期"])[:10] < "2026-10-19"]
ok(len(overdue_sample) >= 1, "示例含至少 1 条逾期任务（实际 %d）" % len(overdue_sample))
ok(any(x.get("今日重点") for x in sample_tasks), "示例含今日重点任务")
r = json.loads(run("database/query_database_record.py", "--database-id", "xY6fAaJczfGY0gTkdYeZwu"))
ok(len([x for x in r["results"] if x.get("是否示例")]) == 2, "学习表 2 条示例数据")
r = json.loads(run("database/query_database_record.py", "--database-id", "SE9AvDWGnB1YBZd6hrFdry"))
sample_apply = [x for x in r["results"] if x.get("是否示例")]
ok(len(sample_apply) == 2, "申请表 2 条示例数据（其中 1 条临期演示截止提醒）")

print("\n========================")
print("集成测试结果：PASS %d / FAIL %d" % (passed, len(failed)))
if failed:
    print("失败项：")
    for f_ in failed:
        print("  - " + f_)
    sys.exit(1)
