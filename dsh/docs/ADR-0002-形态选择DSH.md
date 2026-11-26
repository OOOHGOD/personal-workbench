# ADR-0002 形态选择：用 DeepSeek Harness 承载个人工作台

状态：accepted（2026-11-26）
决策者：用户（DC）+ 会话 agent
相关：外部 PRD（prd/PRD.md v1.0）、ADR-0001 不自建前端层、workbench/PLAN.md

## 背景

PRD v1.0 把「形态（是否做自定义界面）」列为遗留项 L6，未决策；ADR-0001 的结论是「不自建前端层」。用户在 DSH 会话中明确要求「把 DSH 打造成个人工作台」，并授权 agent 自行决定是否添加界面与工具，随后批准了三阶段实施计划。

## 决策

选择 DeepSeek Harness（DSH）作为个人工作台的承载形态：

- **数据层**：本地单一主副本 `workbench/records.jsonl`（开放格式 JSONL，一行一条），派生 `snapshots/`、`reports/`。
- **工具层**：自定义 Host 插件 `@local/dsh-personal-workbench`，注册 6 个 `workbench_*` 工具（record / list / daily / evidence / deadlines / snapshot）。
- **提示词**：DSH 预设「个人工作台」（`@deepseek-ai/dsh-persona` 前缀承载工作台约定）。
- **主动提醒**：DSH 原生定时任务（`@deepseek-ai/dsh-schedule`）。

DSH 是现成 Agent 平台，非「自建前端层」，与 ADR-0001 不冲突；本决策即 L6 的落地。

## 偏离记录（相对 PRD 定稿）

1. **R1「截止提醒邮件」→ DSH 定时投递到会话**。PRD 的 R1 是「外部服务主动发邮件」；DSH 无邮件能力，第一版改用原生定时任务投递提醒到会话（内容预生成 + 零点击）。邮件通道记为遗留 L2（未真实试用），后续可接 SMTP/MCP。**用户已确认此偏离。**
2. **「自动出现」由 DSH 定时任务承载**，而非 PRD 附录 A 中列举的飞书/Notion 等现成服务。

## 后果

- 数据主权靠「本地文件 + 可导出快照 + Git 备份到私有 GitHub」，不靠平台锁定（符合 Q7、AC-04）。
- 第一版不做自定义界面；AC-05「零点击」先用「会话 + 定时任务 + 文件」验证，若被证伪再加个性化页面（L6 保持可复核）。

## 存储方案

本地 `workbench/` 是唯一主副本；每次快照时 `git commit + push` 到私有 GitHub 仓库做备份。备份 ≠ 实时一致，符合 Q7「单一主副本 + 可恢复快照，不追多副本实时一致」。
