---
title: 归档区 · 全部历史工程文件
doc_type: archive-index
status: frozen
date: 2026-11-25
mode: physical-move
mode_note: 2026-11-25 用户明确要求「之前的工程文件（当作测试版）全部归档」，两条线均已用 git mv 真实移入本目录；此前「登记冻结、不移动」的做法已被本次决策取代
head_at_archive: 168984a
related:
  postmortem: ../POSTMORTEM.md
  prd: ../prd/PRD.md
  adr: ../prd/decisions/0001-不自建前端层.md
  manifest: ./manifest.yaml
  llms_entry: ../llms.txt
---

# 归档区 · 全部历史工程文件

> **状态：已冻结（frozen）**。归档日期 2026-11-25。冻结依据：`prd/decisions/0001-不自建前端层.md`（ADR，accepted）与 `prd/PRD.md` 第 7 节零方案评估。失败复盘见 `../POSTMORTEM.md`。

## 本次做了什么（与上一版归档不同）

| | 上一版（同日早些时候） | 本次 |
|---|---|---|
| 方式 | 登记冻结，**文件留在原位不动** | **真实移动**：`git mv` 移入 `archive/` |
| 范围 | 仅 A 线；B 线明确「零改动、勿动」 | A 线 + B 线**全部**归档 |
| 依据 | 保护 B 线构建链 | 用户 2026-11-25 明确选择「两条线一起归档」，并已被告知代价 |

用户是在看到「B 线此前约定勿动、且 `package.json` 全部命令依赖 `tools/` 与 `workbench_build/schema_srv_*.json`」的说明后做出的选择，属知情决策。`llms.txt`、`prd/README.md` 里「归档物不移动、不删除、不复制」「B 线未被触碰」等旧断言已同步作废。

## 目录结构

```
archive/
├── README.md            ← 本文件（归档说明，现行）
├── manifest.yaml        ← 机器可读清单 + 路径映射（现行）
├── legacy-workbench/    ← A 线：单文件 HTML 工作台 v1–v4，142 个文件
│   ├── workbench_build/        主程序、tests、schema/canonical JSON、Python 脚本
│   ├── docs/                   01–08 旧需求/设计/计划/测试/用户/部署/维护/接手文档
│   ├── screenshots/、工作台改造截图/
│   ├── .workbuddy/memory/      过程记忆 6 份
│   ├── DC的个人工作台-离线版.html
│   ├── README.zh-CN.md、README_EN.md、LICENSE、LICENSE_SCOPE.md
│   └── 4 期测试报告、Bento 改造报告、过程笔记
└── cloudflare-d1/      ← B 线：Cloudflare D1 独立后端版，16 个文件
    ├── client/、server/、migrations/、tools/、test/
    ├── package.json、package-lock.json、vite.config.ts、cloudflare.config.ts
    ├── .dev.vars.example
    └── README.md               B 线运行说明（原仓库根 README）
```

**根目录现在只剩现行内容**：`prd/`、`POSTMORTEM.md`、`llms.txt`、`README.md`（新建导航）、`archive/`。另有 4 个从未入库的派生物 `node_modules/`、`.cloudflare/`、`.generated/`、`.local/` 仍在原位，未移动、未删除。

## 归档物内部引用为什么不用改

A 线与 B 线各自是**整目录移动**，内部相对关系保持不变：A 线的 `README.zh-CN.md` 引用的 `docs/01`、`workbench_build/dbid_map_v4.json`，在 `archive/legacy-workbench/` 下依然对得上；B 线 `README.md` 引用的 `server/`、`migrations/0001_state.sql`，在 `archive/cloudflare-d1/` 下也一样。因此**冻结文件正文逐字未改**，只有位于仓库根的现行索引文件需要更新路径。

## 完整路径映射（旧路径 → 归档后位置）

供人、AI 与程序换算；机器可读版见 `./manifest.yaml` 的 `path_mapping`。定稿 PRD、ADR、复盘里的 `文件:行号` 取证引用一律按此换算，**行号不变**（文件内容逐字未改）。

| 原文写法 | 归档后位置 |
|---|---|
| `workbench_build/…`、`docs/01-08`、`.workbuddy/memory/…`、`screenshots/`、`工作台改造截图/` | `archive/legacy-workbench/` 下同名路径 |
| `DC的个人工作台-离线版.html`、`README.zh-CN.md`、`README_EN.md`、`LICENSE`、`LICENSE_SCOPE.md` | `archive/legacy-workbench/` 下同名 |
| 4 期测试报告、`工作台Bento改造与重建报告.md`、`个人工作台制作过程笔记.md` | `archive/legacy-workbench/` 下同名 |
| `client/`、`server/`、`migrations/`、`tools/`、`test/`、`package*.json`、`vite.config.ts`、`cloudflare.config.ts`、`.dev.vars.example` | `archive/cloudflare-d1/` 下同名 |
| 旧仓库根 `README.md`（B 线说明） | `archive/cloudflare-d1/README.md` |
| `docs/09-PRD.md`、`docs/adr/0001`、根 `GLOSSARY.md` | `prd/PRD.md`、`prd/decisions/0001-不自建前端层.md`、`prd/GLOSSARY.md` |

> **一处必须标明的例外**：PRD 与复盘里 `README.md:163,169,230-258,312-313` 这类引用，指的是 2026-11-25 定稿时**工作区检出**（`C:/Users/DC/WorkBuddy/2026-10-14-11-39-28/README.md`，旧工作台的中文 README）的行号。该文件**从未进入本仓库**；本仓库归档的 `archive/legacy-workbench/README.zh-CN.md` 是另一份文档，行号不对应。这类引用只能按「定稿时工作区检出」理解，**推测**，不要在本仓库里按行号去找。

## 构建链影响（如实登记，不粉饰）

| 事实 | 证据 |
|---|---|
| B 线全部 `npm run build / test / dev / start:local` **已失效** | `package.json` 所有 script 先跑 `build:ui`；`tools/build-app.mjs` 与 `package.json` 已移入归档区，根目录不再有可运行入口 |
| `build-app.mjs` 依赖的输入已分离到另一个归档子目录 | `archive/cloudflare-d1/tools/build-app.mjs:7` 读离线 HTML（在 `archive/legacy-workbench/`）、`:9` 读 `workbench_build/schema_srv_*.json`（也在 `archive/legacy-workbench/`），`:50` 读 `client/database.js`（同在 `archive/cloudflare-d1/`） |
| **这条链在归档前本来就是断的** | `build-app.mjs:7` 引用的文件名是「个人工作学习工作台-离线版.html」——2026-10-21 改名**之前**的旧名，仓库里从来就没有这个文件。改名波及面漏到 B 线，是「改一处要手工同步 N 处」根因的实证 |
| 结论 | 本次移动**没有弄断一条正在正常运行的链**；但将来若要恢复 B 线，需先在 `archive/cloudflare-d1/` 内运行，并把跨子目录的两处输入路径对齐。本次不做，超范围 |

## 冻结的含义

不再做：加第 11 张表、加渲染函数、加单测、修 UI 缺陷、改 `docs/01-08`、走 `import → publish → download → cp → git` 人工同步链、恢复 B 线构建。仍然可以做：读取、复制、引用、按 `manifest.yaml` 换算路径。

## 可逆性（未删除任何文件）

- 全部 158 个原跟踪文件都用 `git mv` 移动，**0 删除、0 丢失**，已逐个核对；HEAD 仍为 `168984a`，Git 历史完整。
- 两份 HTML 的 SHA1 仍为 `9059dd7d24a4efef85495be5d1dbd42ff5ee2e32`，逐字节未变。
- 回滚：`git mv archive/legacy-workbench/<原路径> <原路径>`（B 线同理），或从 `git show 168984a:<原路径>` 取回任一历史版本。
- 未 `commit`、未 `push`；`git status` 里的 157 条 rename 是暂存区状态，可用 `git reset` 撤销暂存后再按需移回。

## 归档不算关闭

云端 10 张表里的**活数据不在本仓库**，也从未在。唯一需要带走的东西是那份数据：用旧工作台「设置 → 导出 JSON 备份」（10 键，含 `resume`），按 `prd/PRD.md` AC-04 的口径迁往现成服务并做一次恢复演练。**数据未迁出前，本归档不算真正关闭。**

同样未关闭的遗留项：AC-08-A 邮件通道的 1 天真实试用（L2）、形态决策（L6，Q1 明确后置）。见 `prd/prd.yaml` 的 `open_items`。
