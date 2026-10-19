# personal-workbench 项目记忆

## 项目定位
个人工作学习工作台（WorkBuddy 资料库在线页面 + 云数据表 + 离线 HTML 副本），GitHub 同步仓库 https://github.com/OOOHGOD/personal-workbench，用户要求每个关键节点同步 GitHub。

## 当前状态（2026-10-19，第 3 期已上线）
- 云端：个人空间 90RRiESzDskeLJpYNDxTMX（旧空间已失效不可读）；页面节点 Uo1qyjrSZ67qmecuVnAxXU「个人工作学习工作台」，发布态 https://workbuddy.link/p/Uo1qyjrSZ67qmecuVnAxXU
- 9 张表 ID 映射：workbench_build/dbid_map.json（唯一权威，勿手改）
- 分期：①任务/项目/调研/速记/资料 ②日报周报(docx/MD) ③学习+留学申请 ④简历月更（待做）
- 测试基线：单测 174/174（tests/unit_test.js，jsdom+mock SDK）、集成 95/95（tests/integration_test.py，云端 9 表 CRUD 回环）、lint 三道门（schema 9 表 / DSDK / PQ ack PQ001,PQ005）
- 测试报告按期落盘项目根：工作台第N期测试报告.md

## 工程约定
- 全内联 ES5 单文件 workbench_build/workbench.html；每个 db.* 调用点用 databaseId 字面量（DSDK lint 要求）
- 离线版副本 = 项目根「个人工作学习工作台-离线版.html」，每次发布后 cp 同步
- 修改流程：改 workbench.html → node 语法检查 → 单测 → lint → 灌示例 → import_html --databases 9 表 → publish → 产物复测 → cp 离线版 → 集成测试 → 测试报告 → git commit
- lint_database_sdk_usage 必须带 --schema-file schema_srv_merged.json（9 表字段并集），否则阻塞读 stdin
- SCHEMA_OPTIONS 必须按表（databaseId）分键存 select 选项：跨表同名字段（如「类型」「优先级」）会互相覆盖导致 11607
- daysBetween(a,b) = b-a 天数（正数=b 晚于 a）；倒计时用 daysBetween(today, deadline)
- create_database.py 输出 = JSON 行 + KS_USER_REPLY 行，解析逐行找 { 开头
- seed_samples_v3.py 灌示例（幂等：表里已有示例则跳过）；[TEST] 前缀记录是集成测试自建探针、自删

## 环境注意
- 本机 git 无 GitHub 推送凭证（仓库是克隆来的）；推送需用户提供 PAT（用户已选定此方案）
- 仓库根的 README.md/client/migrations/cloudflare.config.ts/.dev.vars.example 是另一并行会话做的 Cloudflare D1 独立后端版，不属于本工作台链路，勿动勿提交
- 单测运行：cd workbench_build/tests && NODE_PATH=C:/Users/DC/.workbuddy/binaries/node/workspace/node_modules node unit_test.js（HTML_PATH 可指向发布产物）
