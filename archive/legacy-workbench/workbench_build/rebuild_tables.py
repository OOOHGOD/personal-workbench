# -*- coding: utf-8 -*-
"""在新个人空间重建工作台全部数据表（旧空间 njAwuhjNLk8PCccMzYZFvR 已不可访问）
从 schema_srv_*.json 读取字段结构 → create_database → 记录新旧 ID 映射到 dbid_map.json
第3期新增 2 张表：学习记录表、留学申请表
幂等：已存在同名表（脚本重跑）则复用并直接写映射。
"""
import subprocess, json, sys, io, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
PY = r"C:/Users/DC/.workbuddy/binaries/python/versions/3.13.12/python.exe"
SKILL = r"C:/Program Files/WorkBuddy/resources/app.asar.unpacked/resources/plugins/workbuddy-builtin/skills/library"
SPACE = "90RRiESzDskeLJpYNDxTMX"
HERE = os.path.dirname(os.path.abspath(__file__))
MAP_FILE = os.path.join(HERE, "dbid_map.json")

# 表名 -> schema_srv 文件（不带前缀）
OLD_TABLES = {
    "工作任务表": ("tasks", "tdNWBhRqvwIKXkz2ji0uyb"),
    "项目表": ("projects", "2klqa8d0rbO47x0FhoVK3W"),
    "调研记录表": ("research", "f20RfANYTZAqezxUqZ1ZrJ"),
    "灵感速记表": ("notes", "PDFBIwRRZEGd2jfJbGiuY5"),
    "资料索引表": ("resources", "wBJtimnuDTDrgg2Zaf36ZA"),
    "报告存档表": ("reports", "VnPlGp0UnpMluFmFnkTpSz"),
    "AI工作记录表": ("airecords", "DHd1C9sNJOt2SRa35BKRME"),
}

# 第3期新表（本地定义 schema）
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
}

def run(script, *args):
    out = subprocess.run([PY, SKILL + "/" + script] + list(args), capture_output=True, text=True, encoding="utf-8")
    return out.stdout.strip()

def parse_json_out(out):
    """create_database 输出 JSON 后会附 KS_USER_REPLY 行，取第一行 JSON 解析"""
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

def type_config(p):
    """schema_srv 的 {name,type,config} → create_database 的 {name,config:{type:cfg}}"""
    t, cfg = p["type"], p.get("config")
    if t in ("select", "multi_select"):
        return {"name": p["name"], "config": {t: {"options": [
            {"id": o.get("id", ""), "text": o.get("text", ""), **({"style": o["style"]} if "style" in o else {})}
            for o in (cfg or {}).get("options", [])]}}}
    if t == "number":
        return {"name": p["name"], "config": {t: cfg or {"decimalPlaces": 0, "useSeparate": False}}}
    if t == "text":
        return {"name": p["name"], "config": {"text": ""}}
    if t == "url":
        return {"name": p["name"], "config": {"url": {"text": "", "link": ""}}}
    if t == "checkbox":
        return {"name": p["name"], "config": {"checkbox": False}}
    if t == "date":
        return {"name": p["name"], "config": {"date": ""}}
    raise ValueError("unsupported type " + t)

# 已存在表复用（幂等）
existing = {}
r = space_api("space.workspace.list-nodes", "--space-id", SPACE, "--limit", "100")
data = json.loads(r)
for n in data.get("data", {}).get("nodes", []):
    if n.get("kind") == "database":
        existing[n.get("title", "")] = n.get("id")
# 表可能挂在页面下，先按根目录判断；重跑时若根目录没有则重新建

mapping = {}
if os.path.exists(MAP_FILE):
    mapping = json.load(open(MAP_FILE, encoding="utf-8"))

failures = []

for title, (key, old_id) in OLD_TABLES.items():
    if key in mapping and mapping[key].get("new_id"):
        print("[skip] %s 已映射 %s" % (title, mapping[key]["new_id"]))
        continue
    schema = json.load(open(os.path.join(HERE, "schema_srv_%s.json" % key), encoding="utf-8"))
    payload = {
        "title": title,
        "space_id": SPACE,
        "properties": [type_config(p) for p in schema["properties"]],
    }
    if title in existing:
        print("[reuse] %s 空间已存在，复用 %s" % (title, existing[title]))
        mapping[key] = {"old_id": old_id, "new_id": existing[title], "title": title}
        continue
    out = run("database/create_database.py", "--schema", json.dumps(payload, ensure_ascii=False))
    res = parse_json_out(out)
    if "database_id" in res:
        mapping[key] = {"old_id": old_id, "new_id": res["database_id"], "title": title}
        print("[create] %s → %s (%d 字段)" % (title, res["database_id"], res.get("property_count", 0)))
    else:
        failures.append(title)
        print("[FAIL] %s: %s" % (title, out[:300]))

for title, (key, payload) in NEW_TABLES.items():
    if key in mapping and mapping[key].get("new_id"):
        print("[skip] %s 已映射 %s" % (title, mapping[key]["new_id"]))
        continue
    payload = dict(payload)
    payload["space_id"] = SPACE
    if title in existing:
        print("[reuse] %s 空间已存在，复用 %s" % (title, existing[title]))
        mapping[key] = {"old_id": None, "new_id": existing[title], "title": title}
        continue
    out = run("database/create_database.py", "--schema", json.dumps(payload, ensure_ascii=False))
    res = parse_json_out(out)
    if "database_id" in res:
        mapping[key] = {"old_id": None, "new_id": res["database_id"], "title": title}
        print("[create] %s → %s (%d 字段)" % (title, res["database_id"], res.get("property_count", 0)))
    else:
        failures.append(title)
        print("[FAIL] %s: %s" % (title, out[:300]))

json.dump(mapping, open(MAP_FILE, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print("映射已写入 dbid_map.json")
if failures:
    print("失败表：" + ", ".join(failures))
    sys.exit(1)
