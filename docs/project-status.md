# 当前项目状态与新会话入口

更新日期：2026-10-15。本轮完成双主线升级及全站登记，详见下节。历史134项动画迁移已上线；不得把历史发布或迁移审阅替代本轮教学核验。本文维护交付快照和证据索引，详细研究与已执行审阅保留在各专题文档。

## 已交付范围

| 项目 | 当前状态 |
| --- | --- |
| 内容 | 103课程、13模块，`contentRevision=14` |
| 动画替换 | 135/135引用：115雪上、20离雪；旧播放器引用0 |
| 装备图 | 另2项保留二维，已独立审阅 |
| 注册范围 | 36种被引用类型：33全量类型、3按变体接入类型；全部现有引用均支持，未引用的任意变体不因此获得支持 |
| 编排粒度 | 61个显式任务、93个展示配置；引用、类型、任务和配置不是同一计数 |
| 播放与观察 | 课内三维、同源骨架降级、基准/教学强调、阶段循环、正常/慢放、多视角、前脚方向及适用动作同步对照；支持项随任务变化 |
| 数据兼容 | 稳定课程ID、schemaVersion=2、收藏、补充、回收站、能力进度/目标保留；课程笔记栏已改为 GitHub 公开评论 |
| 单文件 | 主站内联三维程序、样式与正文；独立 `/3d/` 原型及外部资料仍需联网 |

可复现数量见[动画清单](animation-inventory.md)和[JSON清单](animation-inventory.json)。`absorption`、`pedalling` 是无当前课程引用的旧预设，不计入已接入任务。保留 `animations.js` 来源代码不意味着现有课程仍使用旧动画。

## 2026-10-15 系统审查与双主线升级

本轮审查起点 `3286885`；[完整交付](goal-upgrade-review.md)、[全站审查表](teaching-audit.md)、[动作规格](goal-animation-review.md)、[小回转研究](goal-short-route-review.md)、[低姿态duck研究](goal-duck-route-review.md) 保存范围与证据。

登记780个不同层级对象，103课程/103练习/214诊断/30术语全文审读。22课程修改或新增，新增低姿态duck连续课与2个能力节点；3个小回转节点重整前置和验收。新动画独立编排，两刃非镜像、正常/较低/前刃探胸可同帧对照。回收改为选修，“放刃”与“停车”分别说明。术语别名可搜索，来源按钮定位同一资料的全部本课引用，旧学习记录保留。

最终100/100测试、类型检查、两项Vite构建、单文件构建通过；审计脚本布局指纹更新后3项专项测试通过。Chrome重新实际访问103课，93展示配置覆盖135引用，465帧渲染无页面错误；核心追加332帧单元的转换/多视角观察。桌面、390px窄视口、旧记录、键盘、同步对照、循环和禁WebGL降级流程通过。三处flex/retract示意的非法反例入口已修并单独回归。

全部动画教学状态仍为partial：密帧不是连续实拍，桌面窄屏不是实体手机。全站来源逐结论复核、通用练习量逐课补齐、非核心未覆盖过渡、实拍标定及细表面碰撞检查保留未完成。发布已经实际核验，结果如下。

实现提交 `189b2607d65f78de556d2448acb4656cb896ab25`，[Actions 38689324985](https://github.com/yichenluan/snowboard/actions/runs/38689324985) 的build与deploy均成功。正式站点HTML与本地构建逐字节一致：2,108,596 bytes，SHA-256 `c4f13bdcc1b926e94b650ea125e221ae206489c2a58075edf14b0868756e43c7`。线上浏览器已检查新能力节点、30术语、新duck三维与同腿长对照、小回转默认反例及屈曲配置门控、390px无横溢出和独立`/3d/`画布；无本次页面错误或站内资源失败。证据：`.validation/goal-audit/published-verification.json`、`published-smoke.json`、`published-duck.jpg`。这是一项发布/功能核验，不增加实拍或完整教学通过数。

## 2026-10-15 首页独立原型入口

首页移除早期“搓雪小回转 · 三维动作实验室”卡片，直接呈现能力路线与课程。独立 `/3d/` 原型、三门小回转课程的独立场景入口及课内共用模型保留；课内入口文案改为说明对应动作已在本课播放器中提供。

本次未修改动作、课程数据或个人记录。JavaScript语法检查、课内程序构建与单文件构建通过；本地浏览器确认首页无原型卡片，能力路线成为首个内容区，默认视口无页面横向溢出。本次不新增动作教学验收结论。

## 2026-10-15 顶部入口与共用页脚

按用户要求移除“备份数据”“保存网页”“导入补充”三个按钮及其处理代码，清理相关操作提示和无用样式。收藏、学习进度、个人补充和回收站仍使用原 localStorage 键，单文件构建与既有离线能力保留。共用页脚加入 [GitHub 项目仓库](https://github.com/yichenluan/snowboard)和微信（WeChat）：`Huunnter`，首页、课程及其他内容视图均显示。

本次92/92既有测试、类型检查、两项Vite构建、单文件构建、清单同步及差异检查通过。实际浏览器核对宽窄视口的页脚、三个入口移除、首页及课程可打开；本地验证收藏、能力自查和个人补充在刷新后仍可读取，窄屏无页面横向溢出。未改动作或课程内容，不新增教学验收结论。工程日志为 `log/footer-*`，本次证据目录为 `.validation/site-footer/`。

实现提交 `5a6890f`，[Actions 38683244755](https://github.com/yichenluan/snowboard/actions/runs/38683244755) 的 build / deploy 均成功。正式站点已实际打开核对：三个入口不存在、页脚仓库链接正确、微信显示 `Huunnter`。线上 HTML 与本地逐字节一致，2,039,245 bytes，SHA-256 为 `2667a136ef0d893bbe26a3a9e5b4ff63e5871604a6d2cf416e1af45fc5cb6901`。线上截图为 `.validation/site-footer/published-footer.jpg`。

以下各节的导入导出验收及迁移操作属于当时版本的历史记录，不代表当前仍有这些功能。

## 2026-10-15 GitHub 课程评论

用户确认网站尚未正式上线，无需保留旧笔记或兼容迁移。课程原本机笔记栏直接替换为“观察与讨论”：由 Utterances 提供 GitHub 登录及 Markdown 评论，公开存放在 `yichenluan/snowboard` 的 Issues；首次发言创建该课的 Issue。博客原有 Gitalk 与博客评论仓库保持独立。

评论依据固定课程 ID 关联，不依赖课程标题或共享 pathname；登录回调保留课程 hash。收藏和学习进度操作不重建评论框。原有收藏、学习进度、个人补充以及正文/动画的离线功能保留；GitHub 评论需联网且不包含在 JSON / HTML 备份中，登录会话也不进入导出。

已通过92/92自动测试（新增7项评论边界测试）、类型检查、两项Vite构建、单文件构建和清单同步。浏览器已实际加载未登录评论表单，检查课程登录入口保留 hash、桌面及390像素视口无横向溢出；跨课程映射、伪造高度消息、离课清理、离线入口及独立会话存储由组件测试覆盖。本次不涉及动作模型和教学内容变更。

实现提交 `79fb286`，对应 [Actions 38680294716](https://github.com/yichenluan/snowboard/actions/runs/38680294716) 构建与部署成功。线上 HTML 与本地逐字节一致：2,043,297 bytes，SHA-256 `7355073323d2e83d43af2f37980f948ff377a7ed7cd8443165921afb05f4e335`。真实登录入口已到 GitHub 账户授权页；本次没有代用户完成个人账户授权或发布测试评论，因此首次评论创建 Issue、提交后回显尚未实测。导出清除 iframe 和独立会话存储已经源码/单测审阅，本轮实际导出文件获取受浏览器工具限制未完成，不把旧导出文件算作本轮证据。本地证据目录为 `.validation/github-comments/`，工程日志为 `log/comments-*`。


## 已核验的功能发布基线

- 功能实现收尾提交：`5617a6b`；随后文档修订纳入交付基线 `42f2b47d57a26af8824079b974c3dbc36ca1d657`。
- [Actions 38675176314](https://github.com/yichenluan/snowboard-guide/actions/runs/38675176314) 的build和deploy成功，部署完成于2026-10-15 11:14:43（Asia/Shanghai）。此前凭据失效已解除。
- 主站HTML与本地验收构建逐字节相同：2,037,129 bytes；SHA-256为 `28fa2506e633306c7df28aa0e75d4c6109fc254918465d65284abfb95952295a`。
- 本节记录功能验收基线，不把后续纯文档提交伪装成再次动作验收。仓库最新提交用 `git log -1` 核对，最新部署用 [Pages工作流](https://github.com/yichenluan/snowboard/actions/workflows/pages.yml) 核对。

入口：[主站](https://jinke.me/snowboard/) · [小回转综合课](https://jinke.me/snowboard/#lesson=s-short-integrated) · [扭板](https://jinke.me/snowboard/#lesson=v14-twist) · [反脚](https://jinke.me/snowboard/#lesson=v19-switch) · [独立原型84%](https://jinke.me/snowboard/3d/?mode=correct&t=0.84)。

## 2026-10-15 子路径更正

用户明确要求 `https://jinke.me/snowboard/` 承载滑雪手册，根域留给已有个人博客，并选择将远端仓库改名为 `yichenluan/snowboard`。本地目录继续使用 `snowboard-guide/`，避免破坏本地入口和工具路径。

部署使用 GitHub Pages 原生项目路径：个人博客仓库 `yichenluan.github.io` 绑定 `jinke.me`，滑雪项目不单独设置 Custom domain，继承用户站域名并按仓库名挂载 `/snowboard/`。工作流的静态产物仍从 `index.html`、`snowboard-guide.html` 和 `3d/` 开始，不再套一层 `snowboard/`。DNS 记录无需变更。离线原型回退链接、在线入口和动画清单已同步更新。

本次本地类型检查、85/85测试、两项 Vite 构建、单文件构建与清单检查通过。主站与离线副本 SHA-256 均为 `a862ea129a1d9fdc333d99ae60e6b8e72aa53fb5a72c054f53cf7df36bbc012f`。只改变部署路径和链接，不改变课程、模型及个人数据键。

从 `https://jinke.me/` 移到同域 `/snowboard/` 不改变 origin，已有笔记、收藏、学习进度和方向仍可读取；原 `github.io` 域的个人记录仍需导入备份。

发布实现提交 `319d0ae`，对应 [Actions 38678518501](https://github.com/yichenluan/snowboard/actions/runs/38678518501) 的 build / deploy 均成功。Pages API 确认滑雪项目 `cname=null`、正式地址为 `https://jinke.me/snowboard/`；个人博客 `cname=jinke.me`。两站均启用强制 HTTPS，证书批准。

线上核验：`/snowboard` 自动补末尾斜杠；主站、副本、原型及其 JS / CSS 返回200并与本地逐字节一致（主站2,037,111 bytes）；HTTP、www及新GitHub项目地址都能到达正式HTTPS入口。浏览器实测课程与独立原型连续播放、相互跳转正常，未捕获控制台error；原有 `short` 学习方向仍保持。证据在本地 `.validation/subpath-migration/` 与 `log/subpath-*`，不公开提交。

个人博客保留原内容，配置 URL 改为 HTTPS，并提供旧项目目录及首次根路径部署的兼容页。博客最终提交 `ff85f86`，对应 [Actions 38678814809](https://github.com/yichenluan/yichenluan.github.io/actions/runs/38678814809) 构建和部署成功；已实际点击博客 Snowboard 导航到达新站。已实测旧课程链接、旧原型链接保留 query / hash 到达新入口。旧项目首页的历史301仍可能被缓存为根域；根域只在 `#lesson=` 时跳转到课程，其余正常显示博客，可从新增的 Snowboard 导航进入手册。

## 2026-10-15 自定义域名迁移（首次根路径部署的历史记录）

以下记录首次根路径部署，当前正式入口已按用户更正调整为 `/snowboard/`，见上一节。

按用户新请求，将正式入口改为 `https://jinke.me/`，仍使用原仓库和 GitHub Actions / Pages 托管。Pages 的自定义域名已配置，阿里云根域四条 A 记录及 `www` CNAME 已写入；具体记录和 HTTPS 检查见[部署说明](../DEPLOYMENT.md)。当前入口、生成清单及离线教材的线上原型回退链接同步更新，课程 ID、个人数据键、内容版本和动作模型未改变。

本次本地检查：85/85测试、类型检查、两项 Vite 构建、单文件构建及清单同步均通过。新 HTML 为2,037,101 bytes；这次域名改动不构成新的动作教学验收，上节旧功能基线的字节数与 hash 保留其历史含义。发布提交 `68962a2` 对应 [Actions 38677361034](https://github.com/yichenluan/snowboard-guide/actions/runs/38677361034) 的 build / deploy 均成功，完成于2026-10-15 11:40:14（Asia/Shanghai）。

发布后核验：根域、离线副本、独立原型及其 JS / CSS 均返回200；两份主站 HTML 与本地构建完全一致，SHA-256 为 `9c6266ad3137690e15cd90d77f94a2a773981611ac360b34df60f491c9a00a1d`。旧 GitHub 地址与 `www` 入口跳转到新域，浏览器实测课程 hash 和原型 query 保留。GitHub 证书已批准且实际 HTTPS 校验通过，Pages 已启用 `https_enforced=true`；设置变更后的边缘缓存可能短暂保留旧 HTTP 响应。实际打开小回转课程、播放到末态、进入独立原型并播放，未捕获课程控制台 error。此处是域名与资源冒烟检查，不替代动作教学审阅。

个人数据按浏览器 origin 隔离。换域前使用旧页面“备份数据”，换域后通过新页面“导入补充”恢复；不能把旧地址的重定向等同于笔记、收藏和进度自动迁移。个人备份不放入公开仓库。

## 验证范围与未完成边界

已完成的检查：

- 85/85自动测试、TypeScript检查、原型及课内两项Vite构建、Python单文件构建、清单同步、JavaScript语法和差异检查。
- 十批逐引用入口与任务审阅，包括关键阶段、前后刃与适用的两种前脚方向、实体及透视、多视角、正常播放与慢放；执行范围见[播放器审阅](lesson-player-review.md)，不是每个引用每一帧每个视角都逐帧标定。
- 按批窄屏与真实禁WebGL检查；旧记录/备份合并、内联资源及实际下载HTML内容检查。最终导出保留正文和个人数据，未完成文件直接重开与断网运行测试。
- 独立覆盖审计核对134引用映射与来源；实际内联runtime的全部引用可接入，并对每引用5个进度点采样，共670帧无异常。这只证明采样范围内可运行。
- 发布后抽查扭板、反脚、小回转、普通鞋深蹲、屈曲压力课正常播放与阶段，以及独立原型84%实体。两次离课画布由1降为0，抽查页面未捕获控制台error。线上文件一致性将本地验收版本与发布版本对应起来。

尚未完成或未建模：连续教练实拍/动作捕捉逐帧标定、实体手机完整手势与多设备全覆盖、全表面精细穿插检查、导出HTML的file直接重开/断网实测；真实板雪动力学、材料响应、足底压力和肌肉激活不在模型中。它们是明确的证据边界，不是声称已通过的事项，也不自动构成新会话的实施任务。

## 迁移批次与资料索引

所有下列批次均已纳入上述发布基线。历史检查数量只对应当批实现，不能取代最终85项检查。

| 批次 | 实现提交 | 引用数 | 任务与资料 |
| --- | --- | --- | --- |
| 基础姿态 | `e63952f` | 28 | [基础研究](lesson-foundations-research.md) |
| 转向与滑移 | `a0ce65d` | 16 | [转向研究](lesson-turning-research.md) |
| 压力与伸展转换 | `f21ce09` | 9 | [压力规格](lesson-pressure-migration-spec.md) |
| 普通鞋站立训练 | `8b86000` | 12 | [离雪研究](lesson-dryland-research.md) |
| 高级压力与转换 | `524bcaa` | 6 | [高级研究](lesson-advanced-research.md) |
| 髋膝与连续回收 | `ce4144b` | 6 | [协调研究](lesson-coordination-research.md) |
| 离雪分腿/卧跪 | `28441cb` | 8 | [离雪研究](lesson-dryland-research.md) |
| 肩臂与旋转 | `779e08a` | 12 | [旋转规格](lesson-rotation-migration-spec.md)；另[2装备图审阅](lesson-equipment-review.md) |
| 搓雪小回转 | `594d427` | 34 | [小回转规格](lesson-short-turns-migration-spec.md) |
| 反脚与扭板 | `5617a6b` | 3 | [反脚与扭板研究](lesson-switch-twist-research.md) |

共用原型依据见[教学研究](teaching-research.md)、[原型审阅](prototype-review.md)和[原型说明](../prototype/README.md)。参数必须区分资料直接支持、推导、作者编排和未知；测试自洽不能代替教学审阅。

## 新会话如何接续

1. 若在完整项目工作区，先读根目录的 `AGENTS.md` → `Agent.md` → `HANDOFF.md`。实际Git根是 `snowboard-guide/`；只拿到仓库时从本文与[README](../README.md)进入。
2. 按用户当前任务核对 `git status --short --branch`、`git fetch origin` 和本地/远端差异，保留已有修改。认证状态按实际结果判断，不照抄历史失败记录。
3. 修改课程先定位 `content.json` 的稳定ID、`lesson-player/registry.json` 的task/变体门控，再读对应动作模块、研究与审阅记录。雪上共用约束在 `prototype/motion.ts`/`scene.tsx`；普通鞋模型在 `lesson-player/dryland.ts`/`dryland-scene.tsx`。
4. 反脚用独立行进前端，保留原脚/固定器/鼻尾身份。扭板通过可选 `segmentRolls` 表达连续局部板面，靴和截面共用局部框架；默认任务仍用刚体板。不要把离雪任务、反脚或扭板退化成原型镜像。
5. Node固定为 `>=22.12.0 <23`，使用锁依赖。完整构建顺序及发布检查见[DEPLOYMENT](../DEPLOYMENT.md)；必须先 `npm run build:lessons`，再 `python3 build.py`。生成HTML和 `3d/` 不手改、不提交。
6. 修改动作时重新做受影响任务的连续阶段与实体审阅；只改文档时核对事实、路径、链接和清单，不重复声称完成新一轮画面验收。

当前没有剩余的全站迁移或凭据修复任务。后续可以按用户选择补实拍标定、真实设备/离线验证，或修正具体教学问题；不从历史文档自行恢复已完成的大任务。
