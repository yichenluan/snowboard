# GitHub Pages 发布与维护

本项目仓库为 [yichenluan/snowboard](https://github.com/yichenluan/snowboard)，采用 GitHub Actions 构建和发布。`main` 分支每次推送都会运行 `.github/workflows/pages.yml`，也可以在 Actions 页手动运行。

全站动画替换已发布。已核验的功能发布基线、线上抽查及未验证边界统一维护在[当前状态与新会话入口](docs/project-status.md)；本文说明后续构建和发布流程。

## 首次启用

在仓库 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions**。工作流中的 `configure-pages` 负责读取站点配置；它不尝试用默认令牌自动开通 Pages。

滑雪手册的正式站点为 `https://jinke.me/snowboard/`，独立原型为 `https://jinke.me/snowboard/3d/`。根域 `https://jinke.me/` 用于个人博客，由用户站仓库 [yichenluan/yichenluan.github.io](https://github.com/yichenluan/yichenluan.github.io) 发布。

两个仓库的 Pages 配置各自维护：

- 用户站 `yichenluan.github.io` 使用 **Deploy from a branch**（API 中的 `legacy`），来源为 `master` 分支根目录，由 GitHub Jekyll 构建；其 **Custom domain** 为 `jinke.me`，根目录 `CNAME` 文件内容为 `jinke.me`。
- 滑雪项目 `snowboard` 使用 **GitHub Actions**，自己的 **Custom domain** 留空，也不配置 `CNAME`。GitHub Pages 从用户站继承 `jinke.me`，并按项目仓库名挂载到 `/snowboard/`。

阿里云 DNS 配置如下，TTL 使用免费版默认600秒：

| 主机记录 | 类型 | 记录值 |
| --- | --- | --- |
| `@` | A | `185.199.108.153` |
| `@` | A | `185.199.109.153` |
| `@` | A | `185.199.110.153` |
| `@` | A | `185.199.111.153` |
| `www` | CNAME | `yichenluan.github.io` |

上述四条 A 记录和 `www` CNAME 保持不变；`www.jinke.me` 作为个人博客的兼容入口跳转到根域。等待用户站的 GitHub DNS 检查和证书签发成功后启用 **Enforce HTTPS**。正式发布需分别验证根域博客、`/snowboard/` 手册、HTTPS、课程锚点和原型资源；配置依据见 [GitHub 自定义域名说明](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)。

仓库从 `snowboard-guide` 重命名为 `snowboard` 后，旧 GitHub 仓库 URL 会自动重定向，仍应将本地 `origin` 更新为 `https://github.com/yichenluan/snowboard.git`。GitHub 的仓库重命名不自动重定向旧 Pages 项目网址；本次由个人博客提供兼容跳转页：`/snowboard-guide/`、`/snowboard-guide/3d/` 和 `/snowboard-guide/snowboard-guide.html` 分别转到 `/snowboard/` 下对应入口，并通过 JavaScript 保留查询参数和课程锚点，禁用 JavaScript 时可点击页面链接继续。根域旧 `/3d/`、`/snowboard-guide.html` 也提供兼容页；首页只有出现 `#lesson=` 时才转到滑雪课程，普通根路径仍显示博客。2026-10-15 已实测旧课程与原型地址能保留参数转到新项目。旧项目首页的历史301可能仍被边缘或浏览器缓存为根域，此时可用博客导航中的 Snowboard 入口；不把缓存过期时间当作确定承诺。对外分享使用新的正式网址。

## 日常更新

1. 修改 `content.json` 中的知识点、练习或来源；课内动作维护在 `lesson-player/`，共用人体、装备与独立小回转原型维护在 `prototype/`。`animations.js` 保留旧预设来源和兼容接口，当前课程引用均由新播放器接管。
2. 使用 Node.js 22；依赖缺失或锁文件变化时运行 `npm ci`。运行 `npm run typecheck`、`npm test`、`npm run build:prototype`、`npm run build:lessons`，再执行 `python3 build.py`；用本地 HTTP 服务预览主站与 `/3d/`。
3. 核对差异并只提交本次相关源码，推送到 `main`，确认该提交对应的 `Deploy snowboard guide` 构建和部署均成功。
4. 在站点上刷新对应条目，实际检查新正文、动画和控制台；不能仅凭推送成功宣称发布完成。

`build.py` 只依赖 Python 标准库。工作流用 Node.js 22 与 `npm ci` 安装锁定依赖，完成共享类型检查、自动测试及原型和课内程序两项 Vite 构建，再检查清单并生成主教材 HTML。主教材采用内联资源，三维原型使用相对路径资源，均支持 `/snowboard/` 项目路径；本地以仓库根目录启动 HTTP 预览时，教材与原型分别位于 `/` 和 `/3d/`。

## 用命令行更新

仅在首次配置或现有认证失效时登录 GitHub CLI，并让 Git 使用该认证；已有有效认证时直接复用。登录时使用仓库所属账户，不将密码或令牌写进源码、日志或聊天。

```sh
gh auth login --hostname github.com --git-protocol https --web
gh auth setup-git --hostname github.com
```

之后在仓库中修改源码，再执行：

```sh
mkdir -p log
npm run typecheck > log/prototype-typecheck.log 2>&1
npm test > log/prototype-test.log 2>&1
npm run build:prototype > log/prototype-build.log 2>&1
npm run build:lessons > log/lessons-build.log 2>&1
python3 build.py > log/build.log 2>&1
node scripts/inventory-animations.mjs --check
git diff --check
git status --short
# 用 git add <本次修改的文件> 逐项暂存，随后核对暂存范围
git diff --cached --stat
git commit -m "improvement(guide): update teaching content"
git push origin main
```

Pages 会自动构建和发布。可以用 `gh run list` 查看运行状态，再用 `gh run watch <run-id> --exit-status` 等待对应部署结果；无需通过浏览器上传源码。

## 发布范围

站点构建目录 `_site/` 只放：

- `index.html`：在线入口。
- `snowboard-guide.html`：同一内容的单文件副本，保留已有离线阅读能力。
- `3d/`：小回转三维原型与打包资源，网址为 `https://jinke.me/snowboard/3d/`。
- `.nojekyll`：注明静态发布；Actions 发布本身不运行 Jekyll。

这些文件保持在 artifact 根目录。`/snowboard/` 由 GitHub Pages 按项目名挂载，不要另建 `_site/snowboard/` 嵌套目录，否则会产生多余的一层路径。

公开仓库应只提交可维护手册源码、README、部署配置和经过检查的展示图片。不要提交研究用原视频、音频、逐字字幕、原始课件、个人备份或笔记、日志、依赖目录以及测试中间文件。

`.gitignore` 已忽略本地构建、研究及验证输出，包括 `_site/`、`3d/`、`log/`、`.validation/`、`research/`、`node_modules/`、`index.html` 和 `snowboard-guide.html`。生成网页由工作流重建，不手改、不提交。

离线教材仍是单个 HTML：课内三维使用内联 IIFE、内联样式与程序生成模型，不请求 CDN、外部字体或模型；无 WebGL 时降级为同一状态的可播放骨架。`build.py` 缺少课内三维构建时会明确失败。独立原型在 `file:` 教材中的入口指向 `https://jinke.me/snowboard/3d/`，不加入单文件。历史版本曾核对“保存网页”的导出内容，该按钮和对应代码现已移除；`file:` 直接重开和断网运行仍未实测，具体范围见[播放器审阅](docs/lesson-player-review.md)。

收藏、学习进度和个人补充仍通过 localStorage 保存在访问者自己的浏览器中，推送源码不会上传浏览器记录。发布时使用原始源码构建，个人记录不得进入公开构建产物。网站不再提供数据导入、导出或“保存网页”按钮；清理网站数据、换设备或换浏览器后，个人记录不会自动恢复。

从 `https://jinke.me/` 移到 `https://jinke.me/snowboard/` 只改变路径，origin 不变，且本项目保留原 localStorage 存储键，因此原有个人记录可以继续读取。此前 `https://yichenluan.github.io` 下的记录仍因跨 origin 隔离，不能自动读取；当时的备份迁移流程属于历史版本，不是当前操作入口。

共用页脚提供 [GitHub 仓库](https://github.com/yichenluan/snowboard)和微信（WeChat）：`Huunnter`。联系信息不参与个人记录保存或登录。

## 访问统计

访问统计使用 Umami Cloud，覆盖主站课程、栏目及独立三维入口，配置为 `analytics-config.json`。后台入口、指标口径、渠道分享和关闭方法见[访问统计说明](docs/analytics.md)。本地和离线文件不发送统计；无需服务器、私钥或新增 GitHub Secret。

## GitHub 评论

课程评论使用 [Utterances](https://utteranc.es/)，公开存放在 `yichenluan/snowboard` 的 Issues。仓库需保持公开且启用 Issues；Utterances GitHub App 仅安装到该仓库，权限为读取 metadata、读写 Issues。它不需要本站配置 OAuth client secret，也没有代码写入权限。

`comments.js` 按稳定课程 ID 生成唯一 Issue 搜索标识，切换课程会销毁旧 iframe 与监听器；不要改成 pathname 映射，因为本站全部课程共用 `/snowboard/` 路径。课程标题和网址变化不改变讨论标识。iframe 参数与 [官方 client.ts](https://github.com/utterance/utterances/blob/master/src/client.ts) 保持一致，显式传入含课程 hash 的正式网址，以便 GitHub 登录后返回原课程。此处使用官方脚本生成的 iframe 协议，上游协议变动时需复核。

登录回调的 `utterances` 参数会从地址栏移除，会话放在独立存储键中，不写入课程数据或个人记录。第三方评论代码运行在跨域 iframe 内。高度消息必须来自当前 iframe 和 `https://utteranc.es`；离课会清理监听器。`file:` 离线文件不加载评论，保留当前课程在线入口；离线进入课程时显示重试入口。

原本机笔记栏已直接替换为“观察与讨论”，不提供旧笔记迁移。公开评论保存在 GitHub，不属于本机个人记录。本机的收藏、学习进度、个人补充继续使用原有功能。

## 构建与回退

Actions 页面展示构建与部署状态。只有 `build` 成功后才启动 `deploy`；部署失败不会构成新版本发布成功的证明。需要回退时，通过 Git revert 撤销有问题的源码提交，再推送 `main`，工作流会从回退后的源码重新发布。

## 配置依据

配置于 2026-10-14 核验，Actions 使用其官方仓库中对应标签的完整提交 SHA，避免浮动标签改变构建依赖。`setup-node` 的 v6 固定提交也已通过官方仓库核验。`checkout` 保留已有 v6，后续升级可单独核验。

- [GitHub Pages 自定义工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [GitHub Actions 安全使用：最小权限与完整 SHA](https://docs.github.com/en/actions/reference/security/secure-use)
- [actions/checkout](https://github.com/actions/checkout)
- [actions/configure-pages](https://github.com/actions/configure-pages)
- [actions/upload-pages-artifact](https://github.com/actions/upload-pages-artifact)
- [actions/deploy-pages](https://github.com/actions/deploy-pages)
- [actions/setup-node](https://github.com/actions/setup-node)
