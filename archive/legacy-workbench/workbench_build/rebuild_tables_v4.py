# -*- coding: utf-8 -*-
"""v4 重建：回到原账号空间 njAwuhjNLk8PCccMzYZFvR。
7 张旧表（第1-2期，含活数据）直接复用；第3期新建 study / apply，第4期新建 resume。
结果写入 dbid_map_v4.json（不动 v3 的 dbid_map.json）。
幂等：已映射则跳过；空间已有同名表则复用。
"""
import subprocess, json, sys, io, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
PY = r"C:/Users/DC/.workbuddy/binaries/python/versions/3.13.12/python.exe"
SKILL = r"C:/Program Files/WorkBuddy/resources/app.asar.unpacked/resources/plugins/workbuddy-builtin/skills/library"
SPACE = "njAwuhjNLk8PCccMzYZFvR"
PAGE_NODE = "MwXKAV7BlcR9zZAXXf0p3z"
HERE = os.path.dirname(os.path.abspath(__file__))
MAP_FILE = os.path.join(HERE, "dbid_map_v4.json")

# 复用的 7 张旧表（第1-2期原始 ID，仍挂载在页面节点下）
REUSE = {
    "tasks": "tdNWBhRqvwIKXkz2ji0uyb",
    "projects": "2klqa8d0rbO47x0FhoVK3W",
    "research": "f20RfANYTZAqezxUqZ1ZrJ",
    "notes": "PDFBIwRRZEGd2jfJbGiuY5",
    "resources": "wBJtimnuDTDrgg2Zaf36ZA",
    "reports": "VnPlGp0UnpMluFmFnkTpSz",
    "airecords": "DHd1C9sNJOt2SRa35BKRME",
}

def sel(options):
    return {"select": {"options": [{"text": t} for t in options]}}

NEW_TABLES = {
    "学习记录表": ("study", {
        "title": "学习记录表",
        "properties": [
            {"name": "学习主题", "config": {"text": ""}},
            {"name": "类型", "config": sel(["语言备考", "专业课程", "技能学习", "证书备考", "阅读"])},
            {"name": "进度状态", "config": sel(["未开始", "进行中", "已完成", "暂停"])},
            {"name": "计划日期", "config": {"date": ""}},
            {"name": "学习日期", "config": {"date": ""}},
            {"name": "时长分钟", "config": {"number": {"decimalPlaces": 0, "useSeparate": False}}},
            {"name": "笔记", "config": {"text": ""}},
            {"name": "资料链接", "config": {"url": {"text": "", "link": ""}}},
            {"name": "是否示例", "config": {"checkbox": False}},
        ],
    }),
    "留学申请表": ("apply", {
        "title": "留学申请表",
        "properties": [
            {"name": "学校", "config": {"text": ""}},
            {"name": "专业项目", "config": {"text": ""}},
            {"name": "申请轮次", "config": sel(["提前批", "第一轮", "第二轮", "末轮"])},
            {"name": "截止日期", "config": {"date": ""}},
            {"name": "申请状态", "config": sel(["待开始", "材料准备中", "已提交", "面试中", "已录取", "已放弃"])},
            {"name": "优先级", "config": sel(["重要且紧急", "重要不紧急", "紧急不重要", "一般"])},
            {"name": "材料清单", "config": {"text": ""}},
            {"name": "下一步", "config": {"text": ""}},
            {"name": "备注", "config": {"text": ""}},
            {"name": "是否示例", "config": {"checkbox": False}},
        ],
    }),
    "简历月更表": ("resume", {
        "title": "简历月更表",
        "properties": [
            {"name": "记录类型", "config": sel(["成果条目", "版本快照"])},
            {"name": "成果标题", "config": {"text": ""}},
            {"name": "成果类型", "config": sel(["任务完成", "项目里程碑", "学习成果", "其他"])},
            {"name": "月份归属", "config": {"text": ""}},
            {"name": "量化指标", "config": {"text": ""}},
            {"name": "成果描述", "config": {"text": ""}},
            {"name": "证据来源", "config": {"text": ""}},
            {"name": "证据链接", "config": {"url": {"text": "", "link": ""}}},
            {"name": "纳入简历", "config": {"checkbox": False}},
            {"name": "快照内容", "config": {"text": ""}},
            {"name": "创建日期", "config": {"date": ""}},
            {"name": "是否示例", "config": {"checkbox": False}},
        ],
    }),
}

def run(script, *args):
    out = subprocess.run([PY, SKILL + "/" + script] + list(args), capture_output=True, text=True, encoding="utf-8")
    return out.stdout.strip()

def parse_json_out(out):
    for line in out.splitlines():
        line = line.strip()
        if line.startswith("{"):
            try:
                return json.loads(line)
            except Exception:
                continue
    return {"error": out[:300]}

def space_api(api, *args):
    out = subprocess.run([PY, SKILL + "/space_api.py", api] + list(args), capture_output=True, text=True, encoding="utf-8")
    return out.stdout.strip()

# 幂等：列出空间根 + 页面节点下已有的表
existing = {}
r = space_api("space.workspace.list-nodes", "--space-id", SPACE, "--limit", "100")
for n in json.loads(r).get("data", {}).get("nodes", []):
    if n.get("kind") == "database":
        existing[n.get("title", "")] = n.get("id")

mapping = {}
if os.path.exists(MAP_FILE):
    mapping = json.load(open(MAP_FILE, encoding="utf-8"))

for k, tid in REUSE.items():
    if k not in mapping:
        mapping[k] = {"new_id": tid, "title": k, "note": "复用第1-2期旧表"}
        print("[reuse] %s -> %s" % (k, tid))

failures = []
for title, (key, payload) in NEW_TABLES.items():
    if key in mapping and mapping[key].get("new_id") and mapping[key].get("note") != "复用第1-2期旧表":
        print("[skip] %s 已映射 %s" % (title, mapping[key]["new_id"]))
        continue
    payload = dict(payload)
    payload["space_id"] = SPACE
    if title in existing:
        print("[reuse] %s 空间已存在 %s" % (title, existing[title]))
        mapping[key] = {"new_id": existing[title], "title": title}
        continue
    out = run("database/create_database.py", "--schema", json.dumps(payload, ensure_ascii=False))
    res = parse_json_out(out)
    if "database_id" in res:
        mapping[key] = {"new_id": res["database_id"], "title": title}
        print("[create] %s -> %s (%d 字段)" % (title, res["database_id"], res.get("property_count", 0)))
    else:
        failures.append(title)
        print("[FAIL] %s: %s" % (title, out[:300]))

json.dump(mapping, open(MAP_FILE, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print("映射已写入 dbid_map_v4.json")
if failures:
    print("失败表：" + ", ".join(failures))
    sys.exit(1)
