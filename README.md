# 单板滑雪 · 进阶技术手册

[在线阅读](https://jinke.me/snowboard/) · [当前状态与新会话入口](docs/project-status.md) · [部署与更新](DEPLOYMENT.md)

面向**已有基本滑行能力者的技术手册**，以 **CASI 四级搓雪小回转**和 **JSBA 高阶低姿态八字刻滑**为两条主线。进入条件是能用两刃控速、停止、受控连弯并避让来人；主要讨论软靴单板在压雪雪道中的身体配合、动作时机、雪板表现和错误修正。说明更新于 2026-10-16；已发布版本与实际验证范围见[当前状态](docs/project-status.md)。

## 两条技术主线

**CASI 四级搓雪小回转：**共同基础 → 普通搓雪短弯 → 专家任务的技术构成 → 转向与屈伸 → 整段连续性 → 条件变化与错误诊断。重点是双腿连续引导、滑移分配、弯中支撑、旧刃释放和出口控速。入口为[目标与动作配合](https://jinke.me/snowboard/#lesson=s-short-expert-map)，整合课为[完整滑段常见错误与修正](https://jinke.me/snowboard/#lesson=s-short-expert-review)。

CASI 的 Expert Short Radius Turns 任务要求 2–3 米走廊、专家压雪地形及高级／专家速度，管理雪板的回弹和反应，全程保持核心与高级能力，以弯形和转向控速。走廊不是单弯半径；官方没有给统一 km/h、坡角或规定弯数。本站以可控搓雪作为训练的主要板表现，普通缓坡短弯不直接等同专家任务，学习这一专项也不等同完整 CASI 四级资格。[官方标准研究](docs/level4-short-official-standards.md)

**JSBA 高阶低姿态八字刻滑：**正常高度单弧与连弧 → 完整弧线 → Basic 伸展式与 Dynamic 抱腿式转换 → 屈伸整合 → 弯幅与纯刻滑短弯 → 八字两刃高低控制 → 低位应用和错误诊断。入口为[刻滑路线](https://jinke.me/snowboard/#lesson=v20-path)；两类转换、刻滑短弯和八字身体配合各有独立课程。纯刻滑短弯须保持板尾跟随板头的窄轨迹，不能用搓雪小回转或更快摆板抵充。

八字指前脚正角、后脚负角的 duck stance，不要求两角绝对值相等。**低姿态八字是本站用户的应用目标；JSBA 并不统一规定 duck、最低身体高度或触雪。** 先在正常舒适高度取得可靠刻滑，再适量降低，两侧均须保留抓雪、出口、连续换刃和恢复能力。命名技术、检定任务与自由滑行质量的区别，以及新版资料的公开范围，见[JSBA 与本站路线研究](docs/jsba-carving-comparison.md)。

两条主线共用双刃、圆弯和顺畅换刃基础。搓雪短弯无需先会纯刻滑；伸展式与抱腿式刻滑从可靠弧线并列发展。反脚、通用回收、上下身协调和体能作为辅助练习，按具体问题选用。

## 打开与使用

优先使用[在线手册](https://jinke.me/snowboard/)。本地构建后也可用浏览器打开 `snowboard-guide.html`：正文、课内三维、阶段图和交互图打包在同一文件；课内动作不请求外部模型、字体或 CDN 脚本。无 WebGL 时保留同源可播放骨架。GitHub 评论、独立小回转原型及外部资料需要联网。

正文按技术模块组织，每个条目提供：

- 目标、前置能力及适用条件。
- 具体关节、身体与板的关系，以及动作发生的阶段和原因。
- 执行步骤、动作提示和可观察结果。
- 技术自查、递进练法、建议练习量和回退信号。
- 常见错误的现象、可能原因、区别方法与修正。
- 资料定位、支持范围和仍不能确定的内容。

课内动作可切换视角、阶段、速度及适用的前脚方向、起始板刃和动作对照。不同任务开放不同选项，不能据通用播放器的能力推定任意配置均受支持。装备条目另有固定器朝向和靴外伸的交互图。

[独立三维原型](https://jinke.me/snowboard/3d/)保留早期小回转的正确示范、错误对照和侧滑接单弯三个审阅模式。它是独立联网网页，三个模式不代表全部课内任务；课内对应动作可直接在本课观察。

## 能力路线与技术全景

首页展示双主线目标、能力前置图和完整课程目录。主目标名称与说明来自 `content.json.progressionMap.targets`；`primary: true` 决定主目标入口，辅助方向仍可独立选择。低位分段练习属于刻滑主线的一部分，原有分段深链继续可用。

实线表示建议先具备的结果能力，虚线表示按问题选用的辅助技术。各节点提供具体板控结果、练法和关联课程；所有课程都可打开。能力自查不等于读完课程，也不从单张低姿态照片、触雪或某趟成功自动升级。

“进阶练习路线”使用独立课序；沿路线进入课程时，前后页遵循该路线。直接打开课程则按所属模块翻页。阶段标准与身体动作—六项板控—可观察结果的技术全景继续保留。实际节点、课程、任务与动画数量以[生成清单](docs/animation-inventory.md)和[当前状态](docs/project-status.md)为准。

## 公开评论与个人补充

每个技术点提供独立的 GitHub 评论栏，可用 Markdown 交流动作疑问、雪况、板痕和教练反馈。评论由 [Utterances](https://utteranc.es/)承载，存放在 [yichenluan/snowboard 的 Issues](https://github.com/yichenluan/snowboard/issues)，所有访问者均可查看；编辑和删除自己的评论可前往 GitHub。

收藏、能力进度、“我的补充”和回收站保存在当前浏览器，不随 GitHub 登录同步；清理网站数据或换设备后不会自动恢复。个人补充保持待核实状态，核实后再纳入正式教学。网站不提供数据导入、导出或“保存网页”按钮，已有单文件构建与离线阅读能力保留。

共用页脚提供 [GitHub 仓库](https://github.com/yichenluan/snowboard)和微信（WeChat）：`Huunnter`。评论配置与稳定课程映射见[部署说明](DEPLOYMENT.md#github-评论)。

## 正文、来源与验证边界

JSBA 资料用于刻滑命名技术、指定任务和高阶板表现；CASI 用于四级短弯任务及通用技能；PSIA-AASI、NZSIA / SBINZ 补充板控、动作机制和教学条件。装备看厂家资料，离雪训练看专业运动教育资料。每条技术结论都应说明来源实际支持的范围，本站课序、提示、组数与退阶不能包装成协会统一规定。

原创三维是作者编排的定性运动学示意。它显示姿态、路线、刃角和阶段关系，不测真实雪面抓地、足底压力、板材弯曲或回弹能量；人物降低也不等于压力增加。压力阶段图使用明确的平地垂向参考模型说明屈伸启动和收住，不替代真实转弯负荷测量。

真人分析保留可核查的原片、实际观察时刻、可见关系、练习用途与限制。打开链接不等于看过对应动作；有限关键帧不等于完整真人标定。查看 [逐结论来源账](docs/source-claim-audit.md)、[教学审查表](docs/teaching-audit.md)及[播放器审阅](docs/lesson-player-review.md)时，应同时核对版本和实际范围。旧观察因正文或运行时变化失效后保留为历史，不自动升级为新版本通过。

代码存在、页面可访问、动画渲染与教学正确性分别核验。未完成的真人精确标定、雪上试教或设备测试必须保留边界；390px 桌面视口不替代实体手机。发布状态以实际构建、部署和线上核对为准。

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

## 历史记录索引

以下保留过往版本的专项复核和迁移说明；课程、引用、任务数量及执行范围属于对应历史版本，不代表当前源码数量。更完整的批次事实保存在各 `docs/` 原始记录中，不随本轮路线调整改写。

## 2026-10-14 专项内容复核记录

该轮新增 7 个专项条目：完整连弯、侧滑接单弯、中弯逐步缩小、双脚引导与前后平衡、两侧节奏、9 类常见问题排查、保持与变化验收。练习既包括缩小，也包括放大回来、撤去提示与主动结束。

“刻滑”描述雪板沿刃滑行的方式，“小回转”描述弯的大小。它们是本站两个重点学习目标，不是穷尽单板运动的两个终点；搓雪也能做大弯，小弯也可能刻滑。普通搓雪小回转无需先会回收或纯刻滑。

原 95 个条目逐项复核了中文、练习和验收标准，均有完整练习卡：地形、准备、步骤、通过、退回和下一步。概念与装备课使用观察或对照练习，非雪训练不宣称自动转化为雪上技能。新练习的组数与自查是教学安排，原教材考核的坡度、固定走廊数字不直接成为普适门槛。

当前课内动画提供板轴与实际移动方向、身体路线、刃侧和双腿屈伸的同步示意；正确动作与错误示意明确区分。路线与时序为作者编排，不计算真实受力和滑速。

新增课程可用 `relatedLessons` 连接下一步。错误卡可用 `lesson` 指向对应练习，`demoKey`（类型:变体:可选换刃方式）打开同课动作对照。短弯变体仍通过 `SnowDemo.shortVariants` 参与清单校验；新增配置还须满足课内注册表与任务门控，不能将通过旧接口校验视为新任务已实现。

## 历史：后刃、换刃与全站动画迁移资料

全站迁移范围为134个动画引用及2个装备交互图，不能把102课当成102套独立动画。134个引用均已切换为课内三维，验收与局限见 [课程播放器审阅](docs/lesson-player-review.md)、[基础研究](docs/lesson-foundations-research.md)、[转向研究](docs/lesson-turning-research.md)、[压力与换刃](docs/lesson-pressure-migration-spec.md)、[进阶研究](docs/lesson-advanced-research.md)、[髋膝协调](docs/lesson-coordination-research.md)、[离雪研究](docs/lesson-dryland-research.md)、[旋转研究](docs/lesson-rotation-migration-spec.md)、[小回转研究](docs/lesson-short-turns-migration-spec.md)、[反脚与扭板研究](docs/lesson-switch-twist-research.md)、[装备图审阅](docs/lesson-equipment-review.md)及 [全站清单](docs/animation-inventory.md)。原型的历史证据和验收仍分别保存在原有文档。

清单可复现：`node scripts/inventory-animations.mjs`；仅检查：`node scripts/inventory-animations.mjs --check`。原型更新仍须完成实际多视角与连续阶段审阅，不能仅凭测试通过判定教学正确。
