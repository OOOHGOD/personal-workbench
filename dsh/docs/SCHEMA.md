# 数据模型（单一主副本 records.jsonl）

## 原则（PRD Q14 / Q6）

不是 4 张表，而是「1 条记录 + 多个用途标记」。同一个事实只存一份，可同时带多个标记；业务类别只是查看时的筛选方式。

## 主副本

`workbench/records.jsonl` — 追加式 JSONL，一行一条记录，UTF-8。

## 记录结构

```jsonc
{
  "id": "rec_xxxxxxxxxxxxxxxx",       // 唯一 ID
  "content": "一句话事实",              // 必填
  "tags": ["work", "study"],           // 用途标记，可多个
  "status": "todo",                    // todo | doing | done | blocked
  "deadline": "2026-11-30",            // 可选，YYYY-MM-DD
  "source": null,                      // 可选，来源溯源（P2 摄入）
  "created_at": "2026-11-26T09:00:00.000Z",
  "updated_at": "2026-11-26T09:00:00.000Z"
}
```

## 用途标记（tags）

| 标记 | 含义 | 激活字段 | 场景 |
|---|---|---|---|
| `work` | 工作 | status、deadline(可选) | S1 早安 / S2 随手记 / S4 日报 |
| `study` | 学习 | 无（可选主题并入 content） | S2 / 周度回看 |
| `apply` | 申请 | status、deadline(必填) | S1 / S2 / R1 截止 |
| `resume` | 简历证据 | 证据段落（content） | S2 / S6 月更 |

## 关键约束

- **不设「分类」字段**（AC-01 / AC-02 / Q14）。
- **去重**：相同 content（归一化后）只存一份；重复时合并 tags，不新增记录（AC-02）。
- **两版日报隔离**：带 `study` 或 `resume` 标记的记录不进领导摘要（AC-03 / Q12）。
- **月更**：只出「证据清单 + 按用途标记分组的证据段落」，不出完整简历文件、不改写简历（AC-07 / Q8）。

## 派生目录

- `snapshots/` — AC-04 全量快照（JSON）+ 恢复演练记录。
- `reports/` — 日报 / 月更 / 早安简报（可随时由 records.jsonl 重生成）。
- `sources/` — P2 三来源（Orca/Workbuddy/Codex）摄入的增量游标与缓存。
