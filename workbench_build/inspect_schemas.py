# -*- coding: utf-8 -*-
import json, glob, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
for f in sorted(glob.glob("schema_srv_*.json")):
    d = json.load(open(f, encoding="utf-8"))
    types = {}
    for p in d["properties"]:
        types[p["type"]] = types.get(p["type"], 0) + 1
    print(f, d.get("database_id"), d.get("title"), len(d["properties"]), types)
    # 抽样看各类型的 config 形状
    seen = set()
    for p in d["properties"]:
        if p["type"] not in seen:
            seen.add(p["type"])
            print("   sample:", p["name"], p["type"], json.dumps(p.get("config"), ensure_ascii=False)[:120])
