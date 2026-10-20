# personal-workbench 项目记忆

## 项目定位
个人工作学习工作台（WorkBuddy 资料库在线页面 + 云数据表 + 离线 HTML 副本），GitHub 同步仓库 https://github.com/OOOHGOD/personal-workbench，用户要求每个关键节点同步 GitHub。

## 当前状态（2026-10-20，v4：Bento 改造 + 云端迁回原账号）
- 云端：**个人空间 njAwuhjNLk8PCccMzYZFvR（当前账号自有）**；页面节点 MwXKAV7BlcR9zZAXXf0p3z「个人工作学习工作台」，发布态 https://workbuddy.link/p/MwXKAV7BlcR9zZAXXf0p3z
- ⚠️ v3 的空间 90RRiESzDskeLJpYNDxTMX / 节点 Uo1qyjrSZ67qmecuVnAxXU 属另一账号，当前账号无权限（code=12607），勿再用
- 9 张表 ID 映射：workbench_build/dbid_map_v4.json（唯一权威，勿手改）；7 张为第1-2期旧表复用（含用户活数据），study/apply 为 v4 新建
- 分期：①任务/项目/调研/速记/资料 ②日报周报(docx/MD) ③学习+留学申请 ④简历月更（待做）
- UI：首页 = 玻璃拟态 + Bento Grid（12 列 big8/mid4/small3；768-1199 六列、<768 单列、≥2000 限宽 1520、内容居中 max-width 1360）
- 测试基线：单测 239/239、集成 95/95、lint 三道门、UX 0 发现、布局量测 tests/layout_check.js 全过
- 测试报告按期落盘项目根：工作台第N期测试报告.md；本次改造报告：工作台Bento改造与重建报告.md；前后截图：工作台改造截图/{before,after}/

## 工程约定
- 全内联 ES5 单文件 workbench_build/workbench.html；每个 db.* 调用点用 databaseId 字面量（DSDK lint 要求）
- 离线版副本 = 项目根「个人工作学习工作台-离线版.html」，每次发布后 cp 同步
- 修改流程：改 workbench.html → node 语法检查 → 单测 → lint → 灌示例 → import_html --databases 9 表 → publish → 产物复测 → cp 离线版 → 集成测试 → 测试报告 → git commit
- lint_database_sdk_usage 必须带 --schema-file schema_v4_merged.json（9 表字段并集），否则阻塞读 stdin
- SCHEMA_OPTIONS 必须按表（databaseId）分键存 select 选项：跨表同名字段（如「类型」「优先级」）会互相覆盖导致 11607
- daysBetween(a,b) = b-a 天数（正数=b 晚于 a）；倒计时用 daysBetween(today, deadline)
- create_database.py 输出 = JSON 行 + KS_USER_REPLY 行，解析逐行找 { 开头
- seed_samples_v4.py 灌示例（幂等：表里已有示例则跳过）；[TEST] 前缀记录是集成测试自建探针、自删
- CSS 动画注意：入场动画用 backwards 填充（不用 both/forwards），否则动画结束后会压住拖拽的 inline transform

## 环境注意
- git 推送凭证：用户提供的 PAT 已存入 Windows 凭据管理器（git:https://github.com，用户 OOOHGOD）。曾踩坑：凭据管理器残留两条 git: 条目会导致 'Invalid username or token'，用 PowerShell 跑 cmdkey /list 排查、删掉旧条目即恢复。推送固定组合：git -c http.proxy=http://127.0.0.1:7897 -c http.version=HTTP/1.1 -c "credential.helper=" -c credential.helper=wincred push origin main
- 仓库根的 README.md/client/migrations/cloudflare.config.ts/.dev.vars.example 是另一并行会话做的 Cloudflare D1 独立后端版，不属于本工作台链路，勿动勿提交
- 单测运行：cd workbench_build/tests && NODE_PATH=C:/Users/DC/.workbuddy/binaries/node/workspace/node_modules node unit_test.js（HTML_PATH 可指向发布产物）
- 布局量测：同目录 node layout_check.js（12/6/1 列 + 居中 + 限宽 + 横向滚动校验，截图到 layout_shots/）
- 外部浏览器打开 workbuddy.link 发布页无 SDK → 离线模式，结构可验、数据为空；带数据渲染用 ux_review.js / layout_check.js（mock SDK + 种子数据）
