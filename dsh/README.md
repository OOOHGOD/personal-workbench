# 个人工作台 · 使用说明

> 目标：让工作/学习/申请/简历证据以最低摩擦被记下来，并在早上、日报、月更、截止前自动出现在眼前，且换设备换平台不丢。

## 数据模型

单一主副本 `records.jsonl`（一行一条 JSON）。**不是分表，是「1 条记录 + 多个用途标记」**：

- `tags`：`work`(工作) / `study`(学习) / `apply`(申请) / `resume`(简历证据)，可多个
- `status`：`todo/doing/done/blocked`（主要给 work/apply）
- `deadline`：`YYYY-MM-DD`（主要给 apply）
- `source`：来源溯源（codex/workbuddy/orca/手动）

规则：同一个事实只存一份（自动去重，重复时合并标记）；不设「分类」字段；领导摘要不含 study/resume。

## 工具（在「个人工作台」会话中可用）

| 工具 | 作用 |
|---|---|
| `workbench_record` | 记一条（一次输入+确认+去重） |
| `workbench_list` | 筛选（标记/状态/截止/关键词/日期） |
| `workbench_daily` | 两版日报（自用全含 / 领导摘要） |
| `workbench_evidence` | 月初证据清单 + 分组段落（不出简历文件） |
| `workbench_deadlines` | 截止 14 天内分级提醒（≤3/≤7/≤14） |
| `workbench_snapshot` | 全量快照 + 恢复演练 |
| `workbench_ingest` | 读 Codex/Workbuddy/Orca 工作记录（只读） |

## 用法示例

- 「记一条：今天和产品对齐了 Q4 目标」→ 记 work 记录
- 「记一条：拿了 XX 竞赛一等奖，申请和简历都算」→ 带 apply+resume 双标记
- 「出今天的日报」→ 两版日报
- 「查截止」→ 14 天内分级提醒
- 「导快照」→ snapshots/*.json + 恢复演练
- 「整理今天的 Orca/Workbuddy/Codex」→ 自动读来源→提炼→记记录（P2 无痛记录）
- 「周五下午 3 点开会」→ 自动 schedule + 记一条 apply 记录（P3 自动日程）

## 定时任务（自动出现）

| 任务 | 时间 |
|---|---|
| 生成今日工作台简报（S1 早安） | 每日 08:00 |
| 检查申请截止提醒（R1） | 每日 08:30 |
| 整理今日外部工作记录（P2 摄入） | 每日 18:00 |
| 生成月初证据清单（S6 月更） | 每月 1 日 09:00 |

## 验收（AC-01~09）

1. 记一句话 → 一次确认、不问分类（AC-01）
2. 再记同一句 → 「已存在，合并标记」不重复（AC-02）
3. 带 resume 的记录 + 出日报 → 领导摘要不含它（AC-03）
4. 导快照 → snapshots/ 出 JSON 且 restore_drill=passed（AC-04）
5. 记 14 天内截止的 apply + 查截止 → 分级出现（AC-06）

## 目录结构

```
workbench/
├── records.jsonl        # 单一主副本
├── snapshots/           # AC-04 快照 + 恢复演练
├── reports/             # 派生产物（可重生成）
├── docs/                # ADR / SCHEMA / 本说明
└── plugin/              # DSH 插件源码（@local/dsh-personal-workbench）
```

数据主权：本地主副本 + 每次快照时 git 备份到私有 GitHub（备份≠实时一致）。
