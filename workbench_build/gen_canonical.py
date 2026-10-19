# -*- coding: utf-8 -*-
import json, io, os, sys

BASE = os.path.dirname(os.path.abspath(__file__))
SKILL = r"C:/Program Files/WorkBuddy/resources/app.asar.unpacked/resources/plugins/workbuddy-builtin/skills/library"

FORM_PREFIX = {
    "tasks": "f_", "projects": "p_", "research": "r_", "notes": "n_", "resources": "s_",
    "reports": "rep_", "airecords": "a_"
}
DISPLAY_ONE = {
    "tasks": ("标题", ".t-title"),
    "projects": ("项目名称", ".proj-name"),
    "research": ("调研对象", ".proj-head"),
    "notes": ("正文", "#noteList"),
    "resources": ("名称", "#resourceList"),
    "reports": ("自用记录", "#repSelf"),
    "airecords": ("主题", "#aiList"),
}

def build(table_key, title):
    with io.open(os.path.join(BASE, "create_%s.out" % table_key), "r", encoding="utf-8") as f:
        raw = f.read()
    data = json.JSONDecoder().raw_decode(raw)[0]
    props = data["properties"]
    prefix = FORM_PREFIX[table_key]
    disp_field, disp_sel = DISPLAY_ONE[table_key]
    properties = {}
    field_mapping = {}
    options_map = {}
    for p in props:
        name = p["name"]
        t = p["type"]
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
            om = {}
            for o in opts:
                om[o["id"]] = {"text": o["text"], "id": o["id"]}
            options_map[name] = om
        in_form = '[name="%s%s"]' % (prefix, name)
        display_selector = disp_sel if name == disp_field else None
        fm = {"value_type": t, "form_input": in_form, "display_selector": display_selector, "render_signal": in_form}
        if t in ("select", "multi_select"):
            fm["options_value_key"] = "value"
        field_mapping[name] = fm
    canonical = {
        "title": title,
        "page_type": "mixed",
        "properties": properties,
        "field_mapping": field_mapping,
        "options_map": options_map,
        "source": "agent_analysis",
        "sdk_calls_found": True,
        "existing_databases": [
            "tdNWBhRqvwIKXkz2ji0uyb", "2klqa8d0rbO47x0FhoVK3W",
            "f20RfANYTZAqezxUqZ1ZrJ", "PDFBIwRRZEGd2jfJbGiuY5", "wBJtimnuDTDrgg2Zaf36ZA",
            "VnPlGp0UnpMluFmFnkTpSz", "DHd1C9sNJOt2SRa35BKRME"
        ],
        "confidence": "high",
        "needs_database": {"level": "strong", "reason": "multi-table workbench with CRUD"}
    }
    out = os.path.join(BASE, "canonical_%s.json" % table_key)
    with io.open(out, "w", encoding="utf-8") as f:
        json.dump(canonical, f, ensure_ascii=False)
    return out

if __name__ == "__main__":
    tables = [("tasks", "工作任务表"), ("projects", "项目表"), ("research", "调研记录表"), ("notes", "灵感速记表"), ("resources", "资料索引表"), ("reports", "报告存档表"), ("airecords", "AI工作记录表")]
    for k, t in tables:
        print(build(k, t))
