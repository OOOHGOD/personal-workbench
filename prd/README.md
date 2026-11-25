---
title: PRD 包索引（prd/）
doc_type: index
status: current
date: 2026-11-25
purpose: 个人工作台现行需求定义的 AI 友好打包；唯一真相源是 prd/PRD.md
archive_note: 2026-11-25 仓库重组后，全部历史工程文件已真实移入 archive/；本包定稿三件套逐字未改，旧路径按下方映射表换算
related:
  llms_entry: ../llms.txt
  postmortem: ../POSTMORTEM.md
  archive_index: ../archive/README.md
  archive_manifest: ../archive/manifest.yaml
---

# PRD 包索引

这里装的是 2026-11-25 定稿的《个人工作台 PRD》及其配套件，按「AI 方便读取」分三层打包：**索引层**（llms.txt / 本文件）、**结构化数据层**（prd.yaml + 各文件 frontmatter）、**全文层**（PRD.bundle.md 自包含合集 / 分文件 Markdown）。语义若有出入，一律以 `PRD.md` 为准。

## 文件清单

| 文件 | 内容 | 给谁读 |
|---|---|---|
| `PRD.md` | 定稿 PRD，10 章 + 附录 A/B，**唯一真相源**，正文逐字未改 | 人 + AI（完整语义） |
| `GLOSSARY.md` | 6 个专有词条（工作台 / 记录 / 用途标记 / 自动 / 不丢 / 证据） | 人 + AI（术语对齐） |
| `decisions/0001-不自建前端层.md` | 唯一 ADR：停止自建前端层，status=accepted | 人 + AI（形态决策） |
| `prd.yaml` | 全部 PRD 内容的机器可读转写：锚句 / 场景 / AC / 失败场景 / 非目标 / 妥协 / 约束假设 / Q1–Q16 决策 / 改写链 / 遗留项 L1–L6 / 词条 / **归档后路径映射** | AI / 程序（直接解析） |
| `PRD.bundle.md` | 上述四件 + 复盘摘要的自包含合并版，一个文件喂给 AI 即可 | AI（单次投喂） |
| `README.md`（本文件） | 索引、阅读顺序、状态矩阵、路径映射 | 人 + AI（入口） |

仓库根 `llms.txt` 是整个仓库的 AI 入口索引，也指向本包。

## 阅读顺序

**人类**：`PRD.md` → `GLOSSARY.md` → `decisions/0001` →（想了解为什么失败：`../POSTMORTEM.md`）
**AI（两种场景）**：
- 上下文有限、只要结构化结论 → 读 `prd.yaml` 一个文件即可；
- 要完整推理与证据链 → 读 `PRD.bundle.md`，或按 `PRD.md` → `GLOSSARY.md` → `decisions/0001` 顺序读。

## 状态矩阵（仓库内哪些文件可信）

| 状态 | 文件 |
|---|---|
| **现行（可信）** | `prd/` 全部、`../POSTMORTEM.md`、`../llms.txt`、根 `../README.md`、`../archive/README.md`、`../archive/manifest.yaml` |
| **已归档（历史参考，不得作为现行依据）** | `../archive/legacy-workbench/`（A 线：单文件 HTML 工作台 v1–v4，含 `docs/01-08`、`workbench_build/`、各期报告、截图、过程记忆、双语 README、LICENSE） |
| **已归档（另一条独立线路）** | `../archive/cloudflare-d1/`（B 线：Cloudflare D1 独立后端版，含 `client/`、`server/`、`migrations/`、`tools/`、`test/`、`package*.json`、旧根 `README.md`） |

> 两条线都是 2026-11-25 用 `git mv` **真实移动**进归档区的，不是「登记冻结、留在原位」。`llms.txt` 与 `archive/README.md` 里旧的「不移动、不删除、不复制」「B 线零改动」断言已作废。

## 硬约束（对 AI 的重要提醒）

1. PRD 正文不含技术选型词；`prd.yaml` 里 `nature: 推测` 与「未验证取舍」的条目**不可当作事实**引用。
2. Q15=B 是**受限妥协**（工具能力限制砍掉月更邮件，且未经真实试用），不是设计偏好；引用时必须带上这个限定。
3. 形态（是否做自定义界面）**仍未决策**（L6）；「不自建前端层」是流程收敛结论，若某条 AC 被证伪则闸门重开。
4. 竞品链接（prd.yaml `competitors_for_feasibility_only`）只是可行性举证，**不是选型结论**。
5. **归档后路径换算**：定稿 PRD / GLOSSARY / ADR / 复盘里的 `文件:行号` 取证引用写于归档前，**行号不变**（文件内容逐字未改），路径按下方映射表或 `../archive/manifest.yaml` 的 `path_mapping` 换算。

## 路径映射（原文自引用 → 归档后位置）

| 原文写法 | 归档后位置 |
|---|---|
| `docs/09-PRD.md` | `prd/PRD.md` |
| `docs/adr/0001-不自建前端层.md` | `prd/decisions/0001-不自建前端层.md` |
| `GLOSSARY.md`（仓库根） | `prd/GLOSSARY.md` |
| `docs/01-08`、`workbench_build/`、`.workbuddy/memory/`、`screenshots/`、`工作台改造截图/` | `../archive/legacy-workbench/` 下同名路径 |
| `DC的个人工作台-离线版.html`、`README.zh-CN.md`、`README_EN.md`、`LICENSE`、`LICENSE_SCOPE.md`、各期测试报告、Bento 报告、过程笔记 | `../archive/legacy-workbench/` 下同名 |
| `client/`、`server/`、`migrations/`、`tools/`、`test/`、`package*.json`、`vite.config.ts`、`cloudflare.config.ts` | `../archive/cloudflare-d1/` 下同名 |
| 旧仓库根 `README.md`（B 线说明） | `../archive/cloudflare-d1/README.md` |

> **例外（推测）**：PRD 与复盘里 `README.md:163,169,230-258,312-313` 指定稿时**工作区检出**（`C:/Users/DC/WorkBuddy/2026-10-14-11-39-28/README.md`）的行号，该文件从未进入本仓库；`archive/legacy-workbench/README.zh-CN.md` 是另一份文档、行号不对应。不要按行号在本仓库查找。

完整机器可读版见 `../archive/manifest.yaml`；归档理由、构建链影响与回滚方式见 `../archive/README.md`。
