# 个人工作学习工作台

独立后端版保留原工作台界面，将七张表保存到 Cloudflare D1。网页和墨水屏读取同一份
持久数据；关闭网页、退出浏览器或关闭电脑不会删除云端数据，也不会阻断设备读取。
屏幕仍按 Paperboard 原有周期请求完整帧，不依赖浏览器定时器或电脑常驻。

**迁移后请使用新工作台地址编辑。原 WorkBuddy 分享页面不会与新后端自动双向同步。**
原平台数据保持原样，作为迁移前备份；本仓库的原始 HTML 也未修改。

## 结构与运行

- `server/`：会话、字段校验、七表读写、原子导入和墨水屏只读快照。
- `migrations/0001_state.sql`：D1 初始迁移。
- `client/database.js`：现有界面的独立数据客户端，30 秒检查其他设备的数据变化。
- `tools/build-app.mjs`：从原始离线 HTML 构建新页面，生成独立数据访问和 CSP。
- `cloudflare.config.ts`、`vite.config.ts`：使用 cf CLI 的生产构建配置。
- `.generated/`、`.cloudflare/`、`.local/`：忽略的生成物、本地状态和私有文件目录。

环境要求 Node.js 24 和 npm；本地持久验证使用 Node 内置 SQLite，生产使用 D1。

```powershell
npm ci
npm test
npm run build
```

不创建 Wrangler 配置；Cloudflare 操作使用 `cf`。Cloudflare 构建工具是
`@cloudflare/vite-plugin` 2.0 beta，具体版本已锁定。

本机运行时，在当前进程环境中设置 `ADMIN_PASSWORD`、`SESSION_SECRET`、
`WORKBENCH_READ_TOKEN`，然后：

```powershell
npm run start:local
```

本地服务只监听 `127.0.0.1:8789`，数据库保存在 `.local/workbench.sqlite`。使用本地
登录口令登录后，可以直接在原工作台界面编辑；重启服务仍保留记录。`PORT` 和
`WORKBENCH_LOCAL_DIR` 可调整本地端口和目录。不要将本地 SQLite 文件提交或公开托管。

`npm run dev` 调用 cf 本地运行时；需要先为其独立的 D1 模拟器执行数据库迁移并在
忽略的 `.dev.vars` 中设置三个凭据。Node 本地验证库与 cf 模拟器数据目录不同，不应
把一边初始化成功当作另一边已就绪。

## 登录和权限

三个凭据必须不同，均至少 32 字符，不提供默认生产口令：

| 配置 | 用途 |
| --- | --- |
| `ADMIN_PASSWORD` | 网页登录口令，仅通过 HTTPS 请求体提交 |
| `SESSION_SECRET` | 签发 12 小时会话，不发送给网页 |
| `WORKBENCH_READ_TOKEN` | 屏幕渲染服务的独立只读凭据，不发送给网页 |

网页会话保存在 `Secure`、`HttpOnly`、`SameSite=Strict` Cookie 中。写请求必须同源且
包含专用 Header。凭据不写入 localStorage、源代码、URL 或日志。登录按来源哈希
限速，每五分钟最多十次尝试；哈希不记录原始地址。注销清除浏览器 Cookie，轮换
`SESSION_SECRET` 可使已签发会话全部失效。

所有写入都要求 `If-Match` 版本；旧版本返回 409，不能静默覆盖别的设备的修改。
导入先完整校验，再以单条条件 SQL 原子更新七表。单份工作台持久数据上限为
950,000 UTF-8 字节，超限明确失败；需要长期保留大量报告时应先归档或后续拆表。
此容量限制不会截断内容或提交半份数据。

## 迁移现有数据

1. 在原 WorkBuddy 页面「设置 → 导出 JSON 备份」保存 `formatVersion: 2` 文件。
   备份放在仓库外或 `.local/`，不要提交真实内容。
2. 在新工作台登录后，从「数据与设置 → 导入恢复」选择该文件。
3. 默认合并按原记录 ID 去重；替换会原子覆盖新后端七表，操作前保留备份。
   七张表必须齐全，可以为空；未知字段、损坏记录或重复 ID 会拒绝整份导入。
4. 核对七表数量、今日重点、计划日期、项目关联、报告存档和中文链接。
5. 核对后以新工作台为唯一编辑入口，原平台不清空、不删除。

未导入或创建第一条记录之前，只读快照返回 503，避免把尚未迁移的数据误显示成
「没有待办」。网页会显示迁移提示。

## 供 Paperboard 读取

独立工作台提供 `GET /v1/snapshot`，要求
`Authorization: Bearer <WORKBENCH_READ_TOKEN>`。仅返回 `formatVersion`、数据更新时间、
任务显示字段和项目显示字段；不返回笔记、资料链接、报告、AI 记录或编辑权限。

在 Paperboard Render DO 的部署环境中设置：

```text
LAYOUT1_CONTENT=workbench
WORKBENCH_SNAPSHOT_URL=<独立后端的 HTTPS 地址>/v1/snapshot
WORKBENCH_READ_TOKEN=<与后端一致的只读 Secret>
```

真实地址、口令和 Token 通过私有环境/Secret 配置，不进入版本库。Paperboard 设备
继续只访问鉴权的 `POST /v1/render`，不增加设备侧业务 API 或字体、排版逻辑。
读取失败沿用保留上一有效帧的路径。Layout 1 预留最后 10 px 给设备统计底栏。

关闭本地工作台全部标签页后，可以在仍运行本地服务的终端中验证端到端合同：

```powershell
node tools/check-paperboard.mjs ../epaper-dashboard
```

工具需要当前环境中的本地 `WORKBENCH_READ_TOKEN`，只允许连接本机后端；生成
`.local/closed-browser-frame.pbf` 和 `.png`，并验证完整长度、Layout ID 与双 CRC。
这里模拟 Paperboard HTTP 请求并使用真实 SQLite，不证明云端网络、设备或实屏。

## 生产部署交接

本次源码和本地验证不等于生产部署。用户确认上线后，在已有 Cloudflare 账号执行：

1. `cf auth whoami` 检查身份（输出不要进入公开记录）。
2. `cf d1 create --name personal-workbench --read-replication-mode disabled --dry-run`
   预览，再去掉 `--dry-run` 创建新库；保存返回的数据库 ID 到当前进程的
   `WORKBENCH_DATABASE_ID`。配置用该 ID 绑定，避免依赖同名数据库解析。
3. `cf d1 migrations apply $env:WORKBENCH_DATABASE_ID --dir ./migrations --dry-run`
   核对目标，再去掉 `--dry-run` 执行迁移。
4. 把三个不同随机凭据保存到忽略的 `.local/production-secrets.json`，执行构建后通过
   cf 的 Secret 文件机制部署。使用配置中开启的 workers.dev 入口，预览 URL 关闭；
   前端壳可访问，所有个人数据接口需要相应凭据。
5. 登录新工作台，导入备份并核对；再配置 Paperboard 的只读来源并部署渲染核心。
6. 关闭网页，验证真实上游快照、鉴权 PBF、目标设备和实屏；最后观察至少一个实际
   自动刷新周期。软件构建、本地闭页、云端访问和实屏分别记录，不互相替代。

已验证：六项后端 HTTP 测试、cf 生产构建、本地浏览器登录/新增/设重点/另一标签页
读取、关闭全部本地工作台标签页后的完整 PBF 生成。独立后端、D1 和工作台渲染服务
现已部署，健康、登录、匿名拒绝及未迁移数据保护通过；连接中的 COM3 仍为 Layout 3。
尚未执行：真实备份迁移、目标设备切换、工作台实屏和长期运行。部署连接与凭据仅保存在
忽略的 `.local/`，不记录真实地址或值。
