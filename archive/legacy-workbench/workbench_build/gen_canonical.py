# -*- coding: utf-8 -*-
"""从 schema_srv_*.json 重建 canonical_*.json（lint_schema 输入）与 schema_srv_merged.json（DSDK lint 输入）
覆盖 9 张表（第 3 期新增学习/申请）。幂等可重跑。"""
import json, io, os, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
BASE = os.path.dirname(os.path.abspath(__file__))
M = json.load(open(os.path.join(BASE, "dbid_map.json"), encoding="utf-8"))

FORM_PREFIX = {
    "tasks": "f_", "projects": "p_", "research": "r_", "notes": "n_", "resources": "s_",
    "reports": "rep_", "airecords": "a_", "study": "sd_", "apply": "ap_",
}
DISPLAY_ONE = {
    "tasks": ("标题", ".t-title"),
    "projects": ("项目名称", ".proj-name"),
    "research": ("调研对象", ".proj-head"),
    "notes": ("正文", "#noteList"),
    "resources": ("名称", "#resourceList"),
    "reports": ("自用记录", "#repSelf"),
    "airecords": ("主题", "#aiList"),
    "study": ("学习主题", "#studyList"),
    "apply": ("学校", "#applyList"),
}

def build(table_key):
    info = M[table_key]
    with io.open(os.path.join(BASE, "schema_srv_%s.json" % table_key), "r", encoding="utf-8") as f:
        data = json.load(f)
    props = data["properties"]
    prefix = FORM_PREFIX[table_key]
    disp_field, disp_sel = DISPLAY_ONE[table_key]
    properties, field_mapping, options_map = {}, {}, {}
    for p in props:
        name, t = p["name"], p["type"]
        if t in ("text", "email", "phone_number"):
            properties[name] = {"text": ""}
        elif t == "number":
            properties[name] = {"number": {"decimalPlaces": 0, "useSeparate": False}}
        elif t == "date":
            properties[name] = {"date": "1970-01-01T00:00:00Z"}
        elif t == "checkbox":
            properties[name] = {"checkbox": False}
        elif t == "url":
            properties[name] = {"url": {"text": "", "link": ""}}
        elif t in ("select", "multi_select"):
            opts = p.get("config", {}).get("options", [])
            properties[name] = {t: {"options": [{"text": o["text"], "id": o["id"]} for o in opts]}}
            om = {o["id"]: {"text": o["text"], "id": o["id"]} for o in opts}
            options_map[name] = om
        in_form = '[name="%s%s"]' % (prefix, name)
        display_selector = disp_sel if name == disp_field else None
        fm = {"value_type": t, "form_input": in_form, "display_selector": display_selector, "render_signal": in_form}
        if t in ("select", "multi_select"):
            fm["options_value_key"] = "value"
        field_mapping[name] = fm
    canonical = {
        "title": info["title"],
        "page_type": "mixed",
        "properties": properties,
        "field_mapping": field_mapping,
        "options_map": options_map,
        "source": "agent_analysis",
        "sdk_calls_found": True,
        "existing_databases": [info["new_id"]],
        "confidence": "high",
        "needs_database": {"level": "strong", "reason": "multi-table workbench with CRUD"},
    }
    out = os.path.join(BASE, "canonical_%s.json" % table_key)
    with io.open(out, "w", encoding="utf-8") as f:
        json.dump(canonical, f, ensure_ascii=False)
    return out, props

def build_merged():
    """9 表字段并集 → schema_srv_merged.json（lint_database_sdk_usage --schema-file）"""
    merged_props, dbids = [], []
    seen = set()
    for key in M:
        info = M[key]
        dbids.append(info["new_id"])
        with io.open(os.path.join(BASE, "schema_srv_%s.json" % key), "r", encoding="utf-8") as f:
            d = json.load(f)
        for p in d["properties"]:
            if p["name"] not in seen:
                seen.add(p["name"])
                merged_props.append(p)
    out = {
        "database_id": M["tasks"]["new_id"],
        "space_id": "",
        "title": "工作台合并 schema（9 表字段并集）",
        "property_count": len(merged_props),
        "properties": merged_props,
        "all_databases": dbids,
    }
    with io.open(os.path.join(BASE, "schema_srv_merged.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    return len(merged_props)

if __name__ == "__main__":
    for k in M:
        path, props = build(k)
        print("[canonical]", k, len(props), "fields →", os.path.basename(path))
    n = build_merged()
    print("[merged] 9 表字段并集", n, "字段 → schema_srv_merged.json")
