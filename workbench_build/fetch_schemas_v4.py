# -*- coding: utf-8 -*-
"""从云端拉取 9 张表的最新 schema，落盘 schema_srv_*.json（测试唯一权威来源）"""
import subprocess, json, sys, io, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
PY = r"C:/Users/DC/.workbuddy/binaries/python/versions/3.13.12/python.exe"
SKILL = r"C:/Program Files/WorkBuddy/resources/app.asar.unpacked/resources/plugins/workbuddy-builtin/skills/library"
HERE = os.path.dirname(os.path.abspath(__file__))
M = json.load(open(os.path.join(HERE, "dbid_map_v4.json"), encoding="utf-8"))
for key, info in M.items():
    out = subprocess.run([PY, SKILL + "/database/get_database_schema.py", "--database-id", info["new_id"]],
                         capture_output=True, text=True, encoding="utf-8").stdout.strip()
    try:
        d = json.loads(out)
    except Exception:
        print("[FAIL]", key, out[:200]); continue
    if "properties" not in d:
        print("[FAIL]", key, out[:200]); continue
    d["database_id"] = info["new_id"]
    d["space_id"] = ""
    d["title"] = info["title"]
    json.dump(d, open(os.path.join(HERE, "schema_v4_%s.json" % key), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("[ok]", key, info["new_id"], len(d["properties"]), "fields")
