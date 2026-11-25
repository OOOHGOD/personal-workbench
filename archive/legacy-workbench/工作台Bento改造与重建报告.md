# 工作台改造报告：云端重建（v4）+ 玻璃拟态 Bento Grid

- **日期**：2026-10-20
- **范围**：① 云端重建（回到原账号空间）② 今日工作首页改造为「玻璃拟态 + Bento Grid」
- **线上地址**：https://workbuddy.link/p/MwXKAV7BlcR9zZAXXf0p3z （第1-2期原链接复活，内容已是第3期 + Bento）

---

## 一、云端重建（v4）

### 背景
- 第 3 期在另一账号空间 `90RRiESzDskeLJpYNDxTMX` 完成，本账号对其**无权限**（code=12607）。
- 但发现本账号空间 `njAwuhjNLk8PCccMzYZFvR` 下仍有**第1-2期的页面节点 `MwXKAV7BlcR9zZAXXf0p3z` + 7 张旧表**，且表内含活数据（用户 10-15~10-19 期间的真实使用记录，如「消防检查复盘」收集箱任务）。

### 决策与执行
| 项 | 做法 |
|---|---|
| 7 张旧表 | **直接复用**（数据零丢失）：tasks `tdNWBhRqvwIKXkz2ji0uyb` / projects `2klqa8d0rbO47x0FhoVK3W` / research `f20RfANYTZAqezxUqZ1ZrJ` / notes `PDFBIwRRZEGd2jfJbGiuY5` / resources `wBJtimnuDTDrgg2Zaf36ZA` / reports `VnPlGp0UnpMluFmFnkTpSz` / airecords `DHd1C9sNJOt2SRa35BKRME` |
| 2 张新表 | 新建：study `xY6fAaJczfGY0gTkdYeZwu`（9 字段）、apply `SE9AvDWGnB1YBZd6hrFdry`（10 字段） |
| 挂载 | 两张新表 move-node 挂到页面节点下（子节点 7→9），page_database_relation link 后关联数 = 9 |
| 示例数据 | 7 张旧表已有示例自动跳过；airecords 补 1 条、study/apply 各灌 2 条 |
| ID 回写 | workbench.html 9 处常量 + `data-sp-database-id` + ALL_DBS 全部替换；单测/集成/UX 三处测试脚本同步替换 |

产物：`rebuild_tables_v4.py`、`seed_samples_v4.py`、`fetch_schemas_v4.py`、`gen_canonical_v4.py`、`dbid_map_v4.json`、`schema_v4_*.json`、`canonical_v4_*.json`、`schema_v4_merged.json`（63 字段并集）。

## 二、玻璃拟态 + Bento Grid 改造

### 布局（今日工作首页）
- **12 列 Bento 网格**：`repeat(12,1fr)` + `grid-auto-flow:row dense`；三档尺寸重映射为 **big=8 列（2/3 宽）/ middle=4 列（1/3）/ small=3 列（1/4）**
- 默认排布两行整齐铺满：第 1 行「今日任务看板 8 + 今天要处理的 4」，第 2 行「核心项目动态 4 + 本周概览 8」——大卡承载高频信息，中小卡做摘要
- **断点**：768-1199px 收敛为 6 列（大卡整行、中小卡半宽）；<768px 单列堆叠保持 DOM 阅读顺序；≥2000px 超宽屏内容限宽 1520px
- **居中**：主内容 `max-width:1360px + margin:0 auto`，在侧栏之外的可用区域内水平居中（此前 max-width 1080 且左对齐，超宽屏内容挤左上角）

### 玻璃拟态（对齐 Apple 材质规范）
- 卡片：`rgba(255,255,255,.72)` + `blur(20px) saturate(1.8)` + `0.5px rgba(15,23,30,.08)` 细边框 + `20px` 圆角 + 柔和阴影 `0 4px 24px` + 顶部镜面高光
- 按钮圆角统一 12px、标签 8px、弹窗 20px；顶栏/侧栏/速记栏/底栏统一 blur(20px) saturate(1.8)
- 标题加 `-0.011em` 负字距（SF 规范）；指标卡 hover `scale(1.02)`、按下 `scale(0.96)`
- 卡片入场：50ms 阶梯淡入上滑（`cardIn`，`backwards` 填充避免与拖拽 transform 冲突；reduced-motion 下关闭）

### 内容与导航
- 首页首卡即「今日任务看板」：8 项指标（今日计划/已完成/待处理/进行中/等待/逾期/完成率/今天截止）+ 三口径快捷 chips + 今日重点
- 卡片标题右侧新增「进入任务看板 › / 进入项目看板 › / 生成报告 ›」直达链接（hash 路由）
- 任务/项目/需求调研仍为独立看板，`.view.active` 单显 + `hidden` 双保险不变
- 拖拽整理与 S/M/L 尺寸功能保留；占位符跨度同步三档（is-middle 新增）

## 三、验证结果

| 验证项 | 结果 |
|---|---|
| 语法 | node --check 通过 |
| 单元测试 | **239/239 PASS**（源文件 / 发布产物 / 离线版三处一致） |
| lint | schema 9 表 MINDX_LINT_OK；DSDK OK；PQ OK（PQ001/PQ005 ack 误报） |
| 云端集成测试 | **95/95 PASS**（9 表 CRUD 回环 + 发布产物校验 + 示例数据完整性） |
| 浏览器 UX 实测 | 0 发现（弹窗、hash 路由、指标跳转、手机抽屉导航、无 JS 错误） |
| 布局量测（新增 layout_check.js） | 2560/1920/1440=12 列、1180/900=6 列、390=单列；居中度量左右等宽；无横向滚动；超宽屏限宽生效；Bento 两行同行校验通过 |

### 截图
- 优化前：`工作台改造截图/before/`（2560 下内容挤左上角、卡片固定高度大片留白）
- 优化后：`工作台改造截图/after/`（居中 + Bento 错落 + 玻璃质感）
- 本地带数据渲染：`workbench_build/tests/layout_shots/`、`workbench_build/tests/ux_shots/`

### 集成测试断言调整（2 处，如实记录）
- 「任务表无残留真实数据」→「无 [TEST] 探针残留」：v4 复用旧表，允许用户真实数据存在
- 「示例含 1 条逾期任务」→「至少 1 条」：旧表示例经真实使用后日期变迁，现有 2 条逾期示例

## 四、遗留说明
- 第 3 期链接 `https://workbuddy.link/p/Uo1qyjrSZ67qmecuVnAxXU` 属于另一账号空间，本账号无法更新它；今后以 `MwXKAV7BlcR9zZAXXf0p3z` 为准
- 外部浏览器直接打开发布链接会走离线模式（无 SDK 环境），真实数据需在登录态/WorkBuddy 环境查看
