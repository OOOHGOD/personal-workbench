---
title: personal-workbench · 仓库导航
doc_type: index
status: current
date: 2026-11-25
note: 本文件是归档重组后新建的导航；原仓库根 README（Cloudflare D1 版运行说明）已移入 archive/cloudflare-d1/README.md
---

# personal-workbench

> **现行内容只有 `prd/`。** 2026-11-25，此前全部工程文件按「测试版」用 `git mv` 真实移入 `archive/` 并冻结；本仓库不再包含任何可运行的旧工程。

## 目录一眼看懂

| 路径 | 状态 | 说明 |
|---|---|---|
| `prd/` | **现行** | 2026-11-25 定稿 PRD 包，唯一需求真相源；AI 友好（索引 / 结构化 / 全文三层） |
| `POSTMORTEM.md` | 现行 | 旧工作台为什么失败、不好用在哪 |
| `llms.txt` | 现行 | AI 入口索引 + 归档后路径映射 |
| `archive/README.md`、`archive/manifest.yaml` | 现行 | 归档说明与机器可读清单（含路径换算表） |
| `archive/legacy-workbench/` | 冻结 | A 线：单文件 HTML 工作台 v1–v4，142 个文件 |
| `archive/cloudflare-d1/` | 冻结 | B 线：Cloudflare D1 独立后端版，16 个文件 |

## 从哪里开始

- **人**：`prd/PRD.md` → `prd/GLOSSARY.md` → `prd/decisions/0001` → `POSTMORTEM.md`
- **AI 单次投喂**：`prd/PRD.bundle.md`（自包含）；只要结构化结论则读 `prd/prd.yaml`
- **AI 全仓入口**：`llms.txt`

## 必须知道的三件事

1. **定稿文档里的旧路径要换算**：PRD、ADR、复盘中的 `workbench_build/…`、`docs/01-08`、`tools/…` 等均为归档前路径，行号不变，位置见 `archive/manifest.yaml` 的 `path_mapping`。归档物内部相对引用因整目录移动仍然有效，**冻结文件正文逐字未改**。
2. **B 线已失效**：`npm run build/test/dev/start:local` 在仓库根已无入口；`tools/build-app.mjs` 的输入散落在两个归档子目录。且它引用的离线 HTML 文件名是 2026-10-21 改名前的旧名、从来就不存在——这条链在归档前本就跑不通。
3. **归档未关闭**：云端 10 张表的活数据不在本仓库，需按 `prd/PRD.md` AC-04 导出 10 表 JSON（**逐表核对 10 键，别用旧版导入预览验收**，它只认 9 类会漏 `resume`）迁到现成服务并做一次恢复演练。

## 可逆性

158 个原跟踪文件 0 删除、0 丢失；HEAD 仍 `168984a`；两份 HTML SHA1 仍 `9059dd7d…e32`。未 `commit`、未 `push`。回滚与恢复方式见 `archive/README.md`。
