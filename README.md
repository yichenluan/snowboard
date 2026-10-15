# 单板滑雪 · 进阶动作手册

[在线阅读](https://jinke.me/) · [当前状态与新会话入口](docs/project-status.md) · [部署与更新](DEPLOYMENT.md)

面向已经能用两刃停止、受控连弯并避让来人的软靴单板滑雪者。主要覆盖压雪雪道的基础巩固与进阶，资料更新至 2026-10-14。

## 打开与使用

用浏览器打开 `snowboard-guide.html`。正文、课内三维、阶段图和交互图都打包在一个文件中；课内动作无外部模型或脚本请求。无 WebGL 时保留同源可播放骨架。独立小回转原型和资料链接需要联网；保存的 HTML 保留这些在线入口。

## 课内三维与独立原型

全站 134 个动画引用已完成替换、分阶段审阅与发布（114个雪上、20个离雪），包括反脚与局部扭板；剩余旧动画引用为 0。两项装备交互图保留二维并独立审阅。部分类型仍按变体门控，限制的是未被当前课程引用的配置，不代表现有引用尚未迁移。覆盖统计、已核验功能发布基线和未验证边界统一见[当前状态](docs/project-status.md)，逐批实际检查见[播放器审阅记录](docs/lesson-player-review.md)。

[打开三维动作实验室](https://jinke.me/3d/)：独立小回转原型包含正确示范、错误对照和侧滑接单弯练习。主站首页及小回转对应三课保留此入口；原型的三个模式不代表全部课内任务。

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

## 首页技术全景

首页先展示两条重点路线：刻滑与搓雪小回转。它们共用基本控制能力，反脚可并行发展，屈曲释放与回收按需选练。下方折叠图再把身体动作、六项板控关系和可观察结果连接起来。节点可进入对应技术点；模块入口覆盖全部章节。

图的文案和入口保存在 `content.json` 的 `technicalMap` 字段；新增或调整内容时同时核对节点链接和模块覆盖。旧版备份没有此字段时，仍使用网页内置全景结构。

## 笔记与继续补充

- 在技术点中记录雪况、板痕、动作观察与教练反馈。
- “我的补充”可以添加、编辑个人记录，移到回收站后仍可恢复。
- 搜索可查正文与个人补充，收藏便于回到常用练习。
- “备份数据”导出完整 JSON；“导入补充”载入同一本手册的数据。
- “保存网页”生成含当前知识库、笔记、收藏和补充的新 HTML，便于迁移设备。

个人记录保存在本机浏览器。移动文件、清理浏览器或换设备前请备份。旧版备份可合并笔记、收藏和补充，旧版评价正文不会覆盖新版教材。稳定条目 ID 已保留，已有笔记继续对应原技术点。

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
| `app.js` | 检索、阅读层次、多示意切换、装备图、笔记与迁移 |
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
git diff --check
```

`build:prototype` 从 `prototype/` 生成 `3d/index.html` 和 `3d/assets/`，资源使用相对路径；`build:lessons` 生成供 `build.py` 内联的课内程序与样式，必须在单文件构建前完成。两种入口均可部署在 GitHub Pages 项目子目录。预览完整站点可运行 `python3 -m http.server 8000`，再打开 `http://localhost:8000/`；独立原型为 `http://localhost:8000/3d/`。生成的 `3d/`、`index.html` 和 `snowboard-guide.html` 不手改、不提交，由 Actions 从锁定依赖重新构建。

新增条目使用稳定 `id`，明确 `module`、`kind` 与 `level`。正文字段为 `summary`、`goal`、`prerequisites`、`mechanics`、`execution`、`checks`、`drill`、`mistakes` 和 `citations`；不再使用视频评价字段。

`mechanics` 每段用 `{title, body}`；`execution` 每步用 `{title, body, cue, observe}`；`mistakes` 用 `{error, cause, fix, check}`。练习应写清地形、准备、步骤、通过标准、回退信号与进阶。

单个动画用 `demo`，多个对照用 `demos` 数组。当前课内动作的 `type`、`task` 与变体须符合 `lesson-player/registry.json` 和对应模块的支持门控；阶段由实际动作事件生成。旧 `SnowDemo.types` 与 `steps` 保留作来源及兼容接口，不据此推定新播放器支持任意配置。`variant`、`path`、`transitionReference` 等参数是内部示意配置，不应解释成个人技术处方。新增示意先核验动作逻辑，再检查骨架、轨迹与文字阶段是否一致。

后续可以把 HTML 或备份 JSON 连同新资料和待解决的问题交给助手，更新对应技术点、练习和示意。

## 验收范围

正文已逐条检查教学结构与旧评价叙述的移除，并交叉审阅关节、压力、换刃、旋转、刻滑和诊断内容。本轮浏览器审阅覆盖全部动画入口、多示意切换、分阶段动作及记录范围内的窄屏和禁WebGL降级；不等于实体手机完整手势验证。旧记录与旧备份合并保持新正文，实际“保存网页”导出及内联资源已核对，但未完成本轮 `file:` 直接重开或禁网实测。动画另检查脚固定、骨段长度、刃与曲率方向、镜像和阶段图；具体已执行范围与未验证项见[播放器审阅](docs/lesson-player-review.md)。

交付包不含研究用完整视频、音频、逐字字幕、原始课件截图、临时环境或旧版正文。引用资料版权属于相应作者和机构。

## 能力前置与下一步

首页默认展示能力路线：12 项结果能力、7 项辅助与选修技术，按自查状态和所选刻滑、搓雪小回转或并行反脚方向显示当前练习建议。实线是教学归纳的练习前置，虚线是辅助技术。辅助项不计入结果能力进度，阅读课程不会自动标记通过。所有课程都可打开。原身体动作—板控—结果图保留在折叠区。

每个节点带自查标准、练习提示、课程入口和后续节点。102 个条目的详情页均能返回所属能力或辅助方向。个人 `skillProgress` / `skillTarget` 与笔记一同在本机保存，并随 JSON / HTML 备份保留；导入旧备份时合并个人记录，保留新版课程与能力图。新增的缩弯自查需自行确认，不根据旧进度自动勾选。

可维护数据为 `content.json.progressionMap`：`requires` 引用建议先具备的任务能力，必须保持无环；`supports` 引用按问题选练的技术，不能作为通关锁。`role: support` 不计进度。`lessons` 是直接对应课程，`moduleLinks` 仅在条目没有直接对应节点时提供模块辅助入口。新增节点后核对 ID、目标分支、来源和可观察的通过标准。交互与连线在 `progression.js`，布局在 `progression.css`，由 `build.py` 内联生成单文件 HTML。

## 2026-10-14 专项内容复核记录

该轮新增 7 个专项条目：完整连弯、侧滑接单弯、中弯逐步缩小、双脚引导与前后平衡、两侧节奏、9 类常见问题排查、保持与变化验收。练习既包括缩小，也包括放大回来、撤去提示与主动结束。

“刻滑”描述雪板沿刃滑行的方式，“小回转”描述弯的大小。它们是本站两个重点学习目标，不是穷尽单板运动的两个终点；搓雪也能做大弯，小弯也可能刻滑。普通搓雪小回转无需先会回收或纯刻滑。

原 95 个条目逐项复核了中文、练习和验收标准，均有完整练习卡：地形、准备、步骤、通过、退回和下一步。概念与装备课使用观察或对照练习，非雪训练不宣称自动转化为雪上技能。新练习的组数与自查是教学安排，原教材考核的坡度、固定走廊数字不直接成为普适门槛。

当前课内动画提供板轴与实际移动方向、身体路线、刃侧和双腿屈伸的同步示意；正确动作与错误示意明确区分。路线与时序为作者编排，不计算真实受力和滑速。

新增课程可用 `relatedLessons` 连接下一步。错误卡可用 `lesson` 指向对应练习，`demoKey`（类型:变体:可选换刃方式）打开同课动作对照。短弯变体的导入校验仍使用 `SnowDemo.shortVariants`；新增配置还须满足课内注册表与任务门控，不能将通过旧接口校验视为新任务已实现。

## 后刃与换刃复核资料

全站迁移范围为134个动画引用及2个装备交互图，不能把102课当成102套独立动画。134个引用均已切换为课内三维，验收与局限见 [课程播放器审阅](docs/lesson-player-review.md)、[基础研究](docs/lesson-foundations-research.md)、[转向研究](docs/lesson-turning-research.md)、[压力与换刃](docs/lesson-pressure-migration-spec.md)、[进阶研究](docs/lesson-advanced-research.md)、[髋膝协调](docs/lesson-coordination-research.md)、[离雪研究](docs/lesson-dryland-research.md)、[旋转研究](docs/lesson-rotation-migration-spec.md)、[小回转研究](docs/lesson-short-turns-migration-spec.md)、[反脚与扭板研究](docs/lesson-switch-twist-research.md)、[装备图审阅](docs/lesson-equipment-review.md)及 [全站清单](docs/animation-inventory.md)。原型的历史证据和验收仍分别保存在原有文档。

清单可复现：`node scripts/inventory-animations.mjs`；仅检查：`node scripts/inventory-animations.mjs --check`。原型更新仍须完成实际多视角与连续阶段审阅，不能仅凭测试通过判定教学正确。
