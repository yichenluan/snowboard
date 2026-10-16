# 参与完善单板技术手册

欢迎反馈课程中的疑问、错误和使用问题，也欢迎补充有出处的教学资料。

## 反馈问题

可以在对应课程的“观察与讨论”中交流，也可以[提交 Issue](https://github.com/yichenluan/snowboard/issues)。描述动作问题时，请附课程链接、前后刃、雪况和可观察到的现象；涉及动画或页面时，请补充动作阶段、视角与设备信息。引用资料请给出原文链接及具体位置，并说明它支持哪项结论。

## 维护资料

- [当前项目状态与专题索引](docs/project-status.md)：功能范围、发布基线、历史记录和新会话入口。
- [部署与更新](DEPLOYMENT.md)：本地构建、GitHub Pages 发布及回退。
- [逐结论来源账](docs/source-claim-audit.md)：正文结论与原始依据的对应关系。
- [教学审查表](docs/teaching-audit.md)与[播放器审阅](docs/lesson-player-review.md)：实际审阅范围与仍未验证的内容。

## 维护源码

教材维护入口为 `content.json`。首次或三维源码变化后先构建课内程序，再生成 HTML：

```sh
npm run build:lessons
python3 build.py
```

构建使用 Python 标准库，生成内容相同的 `snowboard-guide.html` 与 `index.html`。

| 文件 | 用途 |
| --- | --- |
| `content.json` | 课程、模块、来源、能力图、练习路线与示意配置 |
| `app.js` | 检索、正文阅读、示意切换、装备图和个人补充 |
| `guide-state.js` | 路线深链、课程顺序与个人快照 |
| `progression.js` / `progression.css` | 能力前置、自查状态、目标入口及关系图 |
| `comments.js` | GitHub 评论挂载、登录回调与稳定课程映射 |
| `styles.css` / `shell.html` | 页面样式与单文件模板 |
| `build.py` | 内联正文、程序和样式生成单文件 HTML |
| `prototype/` | 独立原型，以及课内复用的人体、装备约束与场景 |
| `lesson-player/` | 独立教学任务、播放器、同源骨架降级与旧接口桥接 |
| `animations.js` | 旧 SVG 实现、来源索引与兼容接口；当前课程由课内播放器接管 |
| `tests/` | 动作、交互、装备、状态与来源校验的回归检查 |
| `scripts/` | 动画与教学库存、逐字段来源校验 |
| `vite.config.ts` / `vite.lessons.config.ts` / `tsconfig.json` | 原型、课内程序构建与共享类型检查 |
| `package.json` / `package-lock.json` | 固定依赖与命令 |

Node 使用 `>=22.12.0 <23`，依赖以锁文件为准：

```sh
npm ci
npm run dev:prototype
```

开发服务器地址见命令输出。发布前按影响范围完成必要检查：

```sh
mkdir -p log
npm run typecheck > log/prototype-typecheck.log 2>&1
npm test > log/prototype-test.log 2>&1
npm run build:prototype > log/prototype-build.log 2>&1
npm run build:lessons > log/lessons-build.log 2>&1
python3 build.py > log/build.log 2>&1
node scripts/inventory-animations.mjs --check
node scripts/inventory-teaching.mjs --check
npm run check:source-claims
git diff --check
```

`build:prototype` 生成 `3d/`；`build:lessons` 生成供 `build.py` 内联的课内程序与样式。两种入口都支持 GitHub Pages 项目子目录。完整站点可用 `python3 -m http.server 8000` 预览。生成的 `3d/`、`index.html` 和 `snowboard-guide.html` 不手改、不提交，由 Actions 从锁定依赖重新构建。

新增条目使用稳定 `id`，明确 `module`、`kind` 与 `levelKey`。技术主体为 `summary`、`goal`、`prerequisites`、`mechanics`、`execution`、`checks`、`drill`、`mistakes` 与 `citations`。`mechanics` 和 `execution` 的 `sources` 必须在本课引用卡可达；练习量 `drill.dose` 明确标为本站建议。错误卡可用 `lesson` 指向练法，`demoKey` 打开同课受支持的动作对照。

真人字段 `videoStudy` 的整卡及各片段分别绑定来源和实际观察。`npm run check:source-claims` 严格检查逐字段结论、原始阅读依据、来源快照、正文哈希及真人时刻；不能只更新整课哈希绕过复核。

动画 `demo` / `demos` 的 `type`、`task` 与变体须符合 `lesson-player/registry.json` 和任务门控；阶段按实际动作事件生成。兼容接口不保证任意新组合受支持。动作变化后需分别核对设备连接、骨长、两刃差异、路线与阶段、实际画面和完整过程。

能力图的 `requires` 引用必要前置并保持无环；`supports` 是按问题选练的辅助能力，不作通关锁，`role: support` 不计结果进度。`lessons` 只列直接建立该能力的课程，避免给通用工具页误加专家前置；`moduleLinks` 用于无直接归属课程的模块辅助入口。正常高度能力须先于低位，刻滑主线终点须同时覆盖两类转换、纯刻滑短弯与低位应用。

