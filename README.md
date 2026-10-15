# 单板滑雪 · 进阶动作手册

[在线阅读](https://jinke.me/snowboard/) · [当前状态与新会话入口](docs/project-status.md) · [部署与更新](DEPLOYMENT.md)

面向已经能用两刃停止、受控连弯并避让来人的软靴单板滑雪者。主要覆盖压雪雪道的基础巩固与进阶，资料更新至 2026-10-15。

## 打开与使用

优先使用[在线手册](https://jinke.me/snowboard/)。本地构建后也可用浏览器打开 `snowboard-guide.html`：正文、课内三维、阶段图和交互图都打包在一个文件中；课内动作无外部模型或脚本请求。无 WebGL 时保留同源可播放骨架。GitHub 评论、独立小回转原型和资料链接需要联网；单文件保留这些在线入口。

共用页脚提供 [GitHub 仓库](https://github.com/yichenluan/snowboard)和微信（WeChat）：`Huunnter`。

## 课内三维与独立原型

当前已发布109课、139个课内三维引用（119个雪上、20个离雪）、95展示配置、63显式任务，`contentRevision=16`；旧播放器引用为0。最新增加 CASI Expert Short Radius 专项，最终循环回归与发布已完成，不能由接入数推导教学全部通过。两项装备交互图保留二维并独立审阅。部分类型仍按变体门控，限制的是未被当前课程引用的配置，不代表现有引用尚未迁移。当前数量、历史发布及证据边界统一见[当前状态](docs/project-status.md)，逐批历史检查见[播放器审阅记录](docs/lesson-player-review.md)。

[打开独立三维原型](https://jinke.me/snowboard/3d/)：早期用于验证小回转动作，目前保留正确示范、错误对照和侧滑接单弯三个审阅模式。首页直接展示能力路线；小回转对应三课仍提供独立场景入口。原型的三个模式不代表全部课内任务。

原型采用 Three.js 与 React Three Fiber，人体和场景在代码中生成，不请求外部模型、字体或 CDN 脚本。需要浏览器支持图形渲染；加载的三维动作是教学用定性示意，不给出个人肌肉力值或压力百分比。它是独立网页，不打包进单文件离线教材。

正文按 13 个技术模块组织，每个条目包含：

- 能力目标、前置能力与直接技术概括。
- 动作原理：关节路径、身体与板的关系、时机及适用条件。
- 执行步骤：具体动作、简短提示和可观察的结果。
- 判断标准、递进练习、缩小动作或回退的信号。
- 常见错误：现象、可能原因、调整方法及复测方式。
- 折叠的资料依据与进一步阅读。

小人可以切换视角、阶段、速度和适用的前脚/刃。部分条目提供多个对照示意：整体内倾与关节成角、屈伸压力阶段、重心降低与板回收、同刃练习与连续换刃、搓雪与刻滑、开放与闭合弯。装备条目另有脚朝向和靴外伸的交互图。

“进阶练习路线”以能力通过标准组织。先在容易任务里取得结果，再提高一个要求；不按天数、触雪或单张姿态照片升级。

## Expert Short Radius 专项

保留原七课可控搓雪基础，再增加目标与基线、转向、加载释放、整段连续性、单条件迁移、专项复核六课。正式入口为[目标与基线](https://jinke.me/snowboard/#lesson=s-short-expert-map)和[专项复核](https://jinke.me/snowboard/#lesson=s-short-expert-review)。完整递进见[课程架构](docs/level4-short-curriculum.md)，最终测试与发布状态见[当前状态](docs/project-status.md)。

官方本项要求2–3米走廊、专家压雪地形、高级／专家速度，管理回弹及反应、保持全程技术能力，并通过弯形与转向控速；未规定本站可代替现场判断的固定速度数值、坡角或弯数。十一项雪上复盘保存条件、完整时段、证据和外部反馈，不自动计算 CASI 分数或授予四级资格。普通缓坡小回转结果不能自动外推到专家任务。

真人分析使用官方视频中两个窗口的15个实际关键帧，明确区分可见关系、练习用途和不可测量内容。新动画为两个任务、四个可切换变体，在六课中有四个引用；同线路腿长对照不模拟真实压力或板材回弹。参见[官方标准](docs/level4-short-official-standards.md)、[真人观察](docs/level4-short-video-observation.md)和[动作规格](docs/lesson-expert-short-turns-spec.md)。

## 审查与证据边界

[来源逐结论账](docs/source-claim-audit.md) · [全站教学审查表](docs/teaching-audit.md) · [前轮续作交付](docs/continuation-review.md) · [双主线升级历史](docs/goal-upgrade-review.md)

当前109课的来源账覆盖423张引用卡、2,149条结论，使用38个有效来源；正文共注册40个来源。全部课程保留明确的本站建议练习量，30项术语提供定义、别名和关联课程。新增六课及三处旧课衔接已作[逐项来源复核](docs/level4-source-claim-review.md)，训练记录协议单独绑定。课内播放器支持基准/教学强调、分段循环和适用动作的同步参考。

代码存在、页面可访问、动画渲染与教学核验分别登记。前轮93配置的2,532帧阶段/多视角人工图审与原时长完整循环记录保留其历史版本范围；共用运行时变化产生的 `stale` 不自动升级为本轮重测通过。新专家任务另行审阅，最终末态循环已实测修复，发布结果见[本轮验证记录](docs/level4-release-review.md)。未完成真人精确标定或雪上试教；原57项视频时间线／标定缺口保留。实体手机按用户要求排除，390px桌面视口不算手机验收。后续运行 `node scripts/inventory-teaching.mjs`，实际核验后回填人工账；`npm run check:source-claims`校验结论、原始证据、正文、真人片段和顶层协议绑定，CI检查同步。

## 首页技术全景

首页先展示两条重点路线：低姿态八字刻滑（duck站姿，前正后负）与基础小回转到 Expert Short Radius。它们共用基本控制能力，反脚可并行发展，屈曲释放与回收按需选练。下方折叠图再把身体动作、六项板控关系和可观察结果连接起来。节点可进入对应技术点；模块入口覆盖全部章节。

图的文案和入口保存在 `content.json` 的 `technicalMap` 字段；新增或调整内容时同时核对节点链接和模块覆盖。

## 公开评论与个人补充

每个技术点提供独立的 GitHub 评论栏，登录后可以使用 Markdown 分享雪况、板痕、动作观察和教练反馈。评论由 [Utterances](https://utteranc.es/) 承载，存放在 [yichenluan/snowboard 的 Issues](https://github.com/yichenluan/snowboard/issues)，所有访问者均可查看。评论需要联网，首次发言自动创建对应 Issue；编辑和删除自己的评论可前往 GitHub。

收藏、学习进度、“我的补充”及新增雪上复盘记录和草稿保存在当前浏览器，不随 GitHub 登录同步；清理网站数据或换设备后不会自动恢复。复盘不上传录像，也不发布评论。网站不再提供数据导入、导出或“保存网页”按钮，单文件构建和已有离线阅读能力保留。

原本机笔记栏已按用户要求直接替换，不提供旧笔记迁移。评论配置、稳定课程映射与验收边界见[部署说明](DEPLOYMENT.md#github-评论)。

## 正文与来源

手册按技术任务独立编写，直接说明可信知识与执行方法。视频仅提供最初技术骨架，不在正文中逐条评论视频对错。

技术依据以 CASI、PSIA-AASI、NZSIA / SBINZ 教练教材为主；装备使用厂家资料；非雪动作使用 ACE、HSS、NHS 的专业教育内容。资料均在具体条目末尾注明定位和依据范围。教学提示与体感用于引导，不能当作受力测量或唯一诊断。

原创动画是定性运动学示意，比例和幅度为便于观察而调整。压力阶段图采用固定平地、平板直线的垂向参考模型，说明动作贡献；真实转弯负荷还受坡度、弯形、速度和地形影响。图中不计算个人受力、精确关节角或发力百分比。专项练习的前提比基础连弯更高，请按条目中的能力条件选择。

## 维护源码

教材内容维护入口为 `content.json`。首次或三维源码变化后先构建课内程序，再生成 HTML：

```sh
npm run build:lessons
python3 build.py
```

它使用 Python 标准库，将源码内联为 `snowboard-guide.html` 和内容相同的 `index.html`。

| 文件 | 用途 |
| --- | --- |
| `content.json` | 教材、模块、来源、练习路线与示意配置 |
| `animations.js` | 旧 SVG 动作实现、预设来源与兼容接口；当前课程动画由课内播放器接管 |
| `app.js` | 检索、阅读层次、多示意切换、装备图与个人数据 |
| `assessment.js` / `assessment.css` | 雪上条件与逐项证据记录、草稿及历史；不计算认证分数 |
| `comments.js` | GitHub 评论挂载、登录回调与课程映射 |
| `styles.css` | 桌面、手机、打印布局 |
| `shell.html` | 页面模板 |
| `build.py` | 生成单文件 HTML |
| `prototype/` | 独立原型页面，以及课内复用的人体、装备约束与场景 |
| `lesson-player/` | 课内三维任务、播放器、同源降级和旧接口桥接 |
| `tests/` | 原型、课内任务与装备图的几何、时序和表达约束检查 |
| `vite.config.ts` / `vite.lessons.config.ts` / `tsconfig.json` | 独立原型、课内程序构建与共享类型检查 |
| `package.json` / `package-lock.json` | 固定前端依赖与命令 |

维护三维原型或课内播放器需要 Node.js 22（22.12 或更高的 22.x 版本）；原型开发预览使用：

```sh
npm ci
npm run dev:prototype
```

开发服务器地址见命令输出。发布前运行：

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

`build:prototype` 从 `prototype/` 生成 `3d/index.html` 和 `3d/assets/`，资源使用相对路径；`build:lessons` 生成供 `build.py` 内联的课内程序与样式，必须在单文件构建前完成。两种入口均可部署在 GitHub Pages 项目子目录。预览完整站点可运行 `python3 -m http.server 8000`，再打开 `http://localhost:8000/`；独立原型为 `http://localhost:8000/3d/`。生成的 `3d/`、`index.html` 和 `snowboard-guide.html` 不手改、不提交，由 Actions 从锁定依赖重新构建。

新增条目使用稳定 `id`，明确 `module`、`kind` 与 `level`。正文字段为 `summary`、`goal`、`prerequisites`、`mechanics`、`execution`、`checks`、`drill`、`mistakes` 和 `citations`；不再使用视频评价字段。

`mechanics` 每段用 `{title, body}`；`execution` 每步用 `{title, body, cue, observe}`；`mistakes` 用 `{error, cause, differentiate, fix, check}`。练习应写清地形、准备、步骤、本站建议量（`drill.dose`）、通过标准、回退信号与进阶。

真人分析使用 `videoStudy`，每个片段保存原始来源、实际观察时刻、可见关系、练习用途和限制；整体及各片段需独立来源绑定。顶层 `assessmentProtocols` 定义训练记录维度，课程以 `assessmentProtocol` 与 `assessmentCriteriaIds` 引用；协议另有整体来源审计，不可只更新课程哈希绕过复核。

单个动画用 `demo`，多个对照用 `demos` 数组。当前课内动作的 `type`、`task` 与变体须符合 `lesson-player/registry.json` 和对应模块的支持门控；阶段由实际动作事件生成。旧 `SnowDemo.types` 与 `steps` 保留作来源及兼容接口，不据此推定新播放器支持任意配置。`variant`、`path`、`transitionReference` 等参数是内部示意配置，不应解释成个人技术处方。新增示意先核验动作逻辑，再检查骨架、轨迹与文字阶段是否一致。

后续可以提供课程链接、新资料和待解决的问题，更新对应技术点、练习和示意。

## 验收范围

正文已逐条检查教学结构与旧评价叙述的移除，并交叉审阅关节、压力、换刃、旋转、刻滑和诊断内容。全站迁移期间的浏览器审阅覆盖全部动画入口、多示意切换、分阶段动作及记录范围内的窄屏和禁WebGL降级；不等于实体手机完整手势验证。历史版本曾核对旧记录与旧备份合并保持新正文，以及“保存网页”导出内容和内联资源；导入导出功能现已移除，这些是历史验收事实。前轮103课版本已断网直接重开`file:`教材，实测小回转、duck和离雪深蹲的三维、拖动和收藏恢复；外部资料、评论及独立原型仍需联网。本轮专家专项只按实际新增和回归范围补录，不沿用旧运行时指纹授予新实现通过。动画另检查脚固定、骨段长度、刃与曲率方向、镜像和阶段图；具体已执行范围与未验证项见[播放器审阅](docs/lesson-player-review.md)与[当前状态](docs/project-status.md)。

交付包不含研究用完整视频、音频、逐字字幕、原始课件截图、临时环境或旧版正文。引用资料版权属于相应作者和机构。

## 能力前置与下一步

首页默认展示27个能力节点：20项结果能力、7项辅助与选修技术，按自查状态和所选刻滑、小回转到专家专项或并行反脚方向显示当前练习建议。实线是教学归纳的练习前置，虚线是辅助技术。辅助项不计入结果能力进度，阅读课程不会自动标记通过。所有课程都可打开。原身体动作—板控—结果图保留在折叠区。

每个节点带自查标准、练习提示、课程入口和后续节点。109个条目的详情页保留所属能力或辅助方向入口。个人 `skillProgress` / `skillTarget` 与收藏、个人补充一同保存在当前浏览器。新增专家节点需按实际证据自行确认，不根据旧进度自动勾选；能力图自查与逐趟雪上复盘也不互相自动授予通过。

可维护数据为 `content.json.progressionMap`：`requires` 引用建议先具备的任务能力，必须保持无环；`supports` 引用按问题选练的技术，不能作为通关锁。`role: support` 不计进度。`lessons` 是直接对应课程，`moduleLinks` 仅在条目没有直接对应节点时提供模块辅助入口。新增节点后核对 ID、目标分支、来源和可观察的通过标准。交互与连线在 `progression.js`，布局在 `progression.css`，由 `build.py` 内联生成单文件 HTML。

## 2026-10-14 专项内容复核记录

该轮新增 7 个专项条目：完整连弯、侧滑接单弯、中弯逐步缩小、双脚引导与前后平衡、两侧节奏、9 类常见问题排查、保持与变化验收。练习既包括缩小，也包括放大回来、撤去提示与主动结束。

“刻滑”描述雪板沿刃滑行的方式，“小回转”描述弯的大小。它们是本站两个重点学习目标，不是穷尽单板运动的两个终点；搓雪也能做大弯，小弯也可能刻滑。普通搓雪小回转无需先会回收或纯刻滑。

原 95 个条目逐项复核了中文、练习和验收标准，均有完整练习卡：地形、准备、步骤、通过、退回和下一步。概念与装备课使用观察或对照练习，非雪训练不宣称自动转化为雪上技能。新练习的组数与自查是教学安排，原教材考核的坡度、固定走廊数字不直接成为普适门槛。

当前课内动画提供板轴与实际移动方向、身体路线、刃侧和双腿屈伸的同步示意；正确动作与错误示意明确区分。路线与时序为作者编排，不计算真实受力和滑速。

新增课程可用 `relatedLessons` 连接下一步。错误卡可用 `lesson` 指向对应练习，`demoKey`（类型:变体:可选换刃方式）打开同课动作对照。短弯变体仍通过 `SnowDemo.shortVariants` 参与清单校验；新增配置还须满足课内注册表与任务门控，不能将通过旧接口校验视为新任务已实现。

## 后刃与换刃复核资料

全站迁移范围为134个动画引用及2个装备交互图，不能把102课当成102套独立动画。134个引用均已切换为课内三维，验收与局限见 [课程播放器审阅](docs/lesson-player-review.md)、[基础研究](docs/lesson-foundations-research.md)、[转向研究](docs/lesson-turning-research.md)、[压力与换刃](docs/lesson-pressure-migration-spec.md)、[进阶研究](docs/lesson-advanced-research.md)、[髋膝协调](docs/lesson-coordination-research.md)、[离雪研究](docs/lesson-dryland-research.md)、[旋转研究](docs/lesson-rotation-migration-spec.md)、[小回转研究](docs/lesson-short-turns-migration-spec.md)、[反脚与扭板研究](docs/lesson-switch-twist-research.md)、[装备图审阅](docs/lesson-equipment-review.md)及 [全站清单](docs/animation-inventory.md)。原型的历史证据和验收仍分别保存在原有文档。

清单可复现：`node scripts/inventory-animations.mjs`；仅检查：`node scripts/inventory-animations.mjs --check`。原型更新仍须完成实际多视角与连续阶段审阅，不能仅凭测试通过判定教学正确。
