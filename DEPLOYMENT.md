# GitHub Pages 发布与维护

本项目采用 GitHub Actions 构建和发布。`main` 分支每次推送都会运行 `.github/workflows/pages.yml`，也可以在 Actions 页手动运行。

## 首次启用

在仓库 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions**。工作流中的 `configure-pages` 负责读取站点配置；它不尝试用默认令牌自动开通 Pages。

项目站点地址通常为 `https://yichenluan.github.io/snowboard-guide/`，以仓库 Pages 设置和成功部署步骤给出的实际 URL 为准。

## 日常更新

1. 修改 `content.json` 中的知识点、练习或来源；原有动作示意维护在 `animations.js`，三维小回转原型维护在 `prototype/`。
2. 使用 Node.js 22；依赖缺失或锁文件变化时运行 `npm ci`。运行 `npm run typecheck`、`npm test`、`npm run build:prototype`、`npm run build:lessons`，再执行 `python3 build.py`；用本地 HTTP 服务预览主站与 `/3d/`。
3. 将源码提交并推送到 `main`，等待 Actions 中的 `Deploy snowboard guide` 完成。
4. 在站点上刷新对应条目，检查新正文及动画。

`build.py` 只依赖 Python 标准库。工作流用 Node.js 22 与 `npm ci` 安装锁定依赖，完成原型类型检查、动作测试和 Vite 构建，再生成主教材 HTML。主教材采用内联资源，三维原型使用相对路径资源；两者均适用于 GitHub Pages 的项目子目录。

## 用命令行更新

首次需要登录 GitHub CLI，并让 Git 使用该认证。登录时使用仓库所属账户，不将密码或令牌写进源码、日志或聊天。

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
git add content.json app.js animations.js styles.css progression.js progression.css shell.html build.py README.md DEPLOYMENT.md prototype tests package.json package-lock.json tsconfig.json vite.config.ts .github/workflows/pages.yml .gitignore
git commit -m "improvement(guide): update teaching content"
git push origin main
```

Pages 会自动构建和发布。可以用 `gh run list` 查看运行状态，再用 `gh run watch <run-id> --exit-status` 等待对应部署结果；无需通过浏览器上传源码。

## 发布范围

站点构建目录 `_site/` 只放：

- `index.html`：在线入口。
- `snowboard-guide.html`：同一内容的离线副本，可以通过浏览器保存。
- `3d/`：小回转三维原型与打包资源，网址为 `https://yichenluan.github.io/snowboard-guide/3d/`。
- `.nojekyll`：注明静态发布；Actions 发布本身不运行 Jekyll。

公开仓库应只提交可维护手册源码、README、部署配置和经过检查的展示图片。不要提交研究用原视频、音频、逐字字幕、原始课件、个人备份或笔记、日志、依赖目录以及测试中间文件。

建议将这些本地输出加入 `.gitignore`：`_site/`、`3d/`、`build.log`、`log/`、`research/`、`node_modules/`、`__pycache__/`、`*.pyc`。生成的 `index.html` 和 `snowboard-guide.html` 也可忽略，由工作流生成。

离线教材仍是单个 HTML：课内三维使用内联 IIFE、内联样式与程序生成模型，不请求 CDN、外部字体或模型；无 WebGL 时降级为同一状态的可播放骨架。`build.py` 缺少三维构建时会明确失败。独立 `/3d/` 原型在 `file:` 教材中的入口仍指向线上，不加入单文件导出。具体离线与浏览器验收边界见 `docs/lesson-player-review.md`。

笔记、收藏和个人补充仍只保存在访问者自己的浏览器中，推送源码不会上传浏览器记录。发布时使用原始源码构建，不要把“保存网页”导出的个人版本放进仓库。更换域名或清理浏览器前先导出备份。

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
