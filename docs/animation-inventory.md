# 全站动画与交互示意清单

由 `node scripts/inventory-animations.mjs` 生成。不要直接编辑此文件；迁移分类与人工验收说明维护在脚本，课程用途、配置和资料维护在原有源码。`node scripts/inventory-animations.mjs --check` 可检查清单是否与源码同步。完整配置、逐课资料定位和 claim 见 [JSON 清单](animation-inventory.json)。

**全站逐批迁移中。** 课内三维按注册表接管默认播放器，其余引用仍用旧示意。此清单核验代码覆盖，不把源码、自动测试或资料链接当作教学正确的证明。实际观察与未完成项见 [课程播放器审阅](lesson-player-review.md)。

## 数量与口径

| 项目 | 数量 | 含义 |
| --- | --- | --- |
| 课程 / 模块 | 102 / 13 | 稳定课程 ID 与导航单元；不等于独立动画 |
| 含动画的课程 | 88 | 按 app.js：非空 demos 优先，否则 demo |
| 迁移范围内的动画引用 | 134 | 每个课程内每个可选示意各计 1 次，可重复引用同一模型 |
| 装备交互图 | 2 | app.js 的 binding-stance 与 boot-clearance；非 SnowDemo 动画 |
| 主站显示的示意总数 | 136 | 旧动画引用 + 装备图；不额外把 3D 链接计入 |
| 无动作/装备图课程 | 12 | 原理与方法仍有正文，不应为凑全 3D 强制补动画 |
| 已注册 / 有引用的类型 | 37 / 35 | SnowDemo.types；类型不是互不共享的独立实现 |
| 应用变体键 | 70 | type:variant:transition；与错误卡 demoKey 的匹配口径一致 |
| 展示配置组合 | 90 | 去掉 title/focus/steps/autoplay/duration 后按字段去重；仍含视角/图层，不等于独立动作 |
| 小回转声明变体 | 16 | 3 个类型共享 shortState，另可选 extend/flex/retract；未取笛卡尔积虚增工作量 |
| 3D 模式 / 课程入口 | 3 / 3 | 另有首页入口；三种模式共享 motion.ts 状态与 scene.tsx 场景 |
| 课内三维类型 / 引用 | 26 / 85 | 按注册表已切换默认渲染；不代表教学认证 |
| 全量 / 部分接入类型 | 23 / 3 | 部分类型仅迁移列明变体；其他引用仍走旧播放器，不按类型整体虚计完成 |
| 剩余旧动画引用 | 49 | 继续逐项迁移，未缩减范围 |

## 当前实现的共享关系与迁移去向

独立教学任务必须按用途验收，不能用“类型数”或“变体数”直接报工期。机械去重只帮助定位共享风险；同一动作在不同课程的文案、阶段提示与前提仍须逐条保留。当前识别出以下 4 条动作生成/绘制路径，压力图和装备图另列：

| 模型 | 注册类型 / 引用数 | 实现与复用边界 |
| --- | --- | --- |
| 雪上关键帧 + 双腿 IK | 26 / 80 | sample / skeleton / sceneBody；sceneTrack 另行画俯视关节，迁移后应改为同一世界坐标状态 |
| 小回转共享时序/轨迹 + 双腿 IK | 3 / 34 | shortRaw / shortState → skeleton；16 个小回转变体共用，必须逐变体审阅 |
| 离雪站立关节模型 | 4 / 12 | skeleton + sceneBody；深蹲/提踵/扶墙/绕肩不得直接套雪靴动作约束 |
| 离雪侧面专用模型 | 4 / 8 | sceneDry；平板/小腿/髋/腘绳肌是独立地面任务 |
| 压力阶段图 | 4 | scenePressure 叠加于屈伸示意；保留 2D 时间图，不能解释成实测压力 |
| 装备交互 | 2 | app.js mountIllustration；保留 2D 几何表达与型号限制 |

`pedalling` 与 `twist` 引用同一组 keyframes / steps；只是换了标题，不是第二套独立动作。其他类型之间可能表达同一能力，但本盘点不凭名称强行合并。

分批去向：D1 中立/屈伸/前后平衡；D2 两刃非对称站姿和成角；D3 转向/滑移/旋转；D4 压力与换刃；D5 连弯及各纠错变体；D6 离雪专项；D7 装备与概念图。共用装备和骨长约束，姿态、时序、路线与末态按任务独立审阅。

## 入口、发布与离线约束

- 课程入口：`/#lesson=<稳定 ID>`；同课多示意由 `data-demo` 按索引切换，`showDemo` 先 destroy 再 mount，当前只挂载 1 个旧动画。下方逐项 ID 的 `/N` 表示同课第 N 个按钮，并非额外 URL 路由。
- 纠错按钮按 `type:variant:transition` 匹配；`path`、`turnShape`、`edgeSide` 等不在键中。后续迁移应保留所有实际配置，不能只按 demoKey 合并。
- `build.py` 把 content.json、animations.js、app.js、progression.js 和样式内联到两个相同的 HTML；课程 ID、笔记、收藏、skillProgress / skillTarget、导入导出与保存网页都应保留。
- 课内三维 IIFE、样式与课程数据直接内联进单文件，无运行时外部模型、字体或 CDN；无 WebGL 时显示同源可播放骨架。独立 `/3d/` 原型及外部资料仍需联网。导出重开验证与浏览器限制见审阅记录。
- 首页技术全景、能力 DAG 与 shell.html 的装饰人物没有动作时间线，不计入上述动作/装备示意数量；它们的入口和能力前置关系仍属于回归范围。

| 3D 来源课程 | 模式 | 当前状态 |
| --- | --- | --- |
| [s-short-integrated](https://yichenluan.github.io/snowboard-guide/#lesson=s-short-integrated) | [correct](https://yichenluan.github.io/snowboard-guide/3d/?mode=correct) | 并行原型 / 教学复核中；旧示意仍保留 |
| [s-short-diagnosis](https://yichenluan.github.io/snowboard-guide/#lesson=s-short-diagnosis) | [error](https://yichenluan.github.io/snowboard-guide/3d/?mode=error) | 并行原型 / 教学复核中；旧示意仍保留 |
| [s-short-sideslip](https://yichenluan.github.io/snowboard-guide/#lesson=s-short-sideslip) | [drill](https://yichenluan.github.io/snowboard-guide/3d/?mode=drill) | 并行原型 / 教学复核中；旧示意仍保留 |

## 异常和需人工审阅的差异

| 级别 | 类型 | 详情 |
| --- | --- | --- |
| info | unused-preset | absorption 已注册但没有课程引用；保留，不能视作已完成迁移 |
| info | unused-preset | pedalling 已注册但没有课程引用；保留，不能视作已完成迁移 |

- **共享姿态风险：** 旧小回转 `shortState` 默认使用 `hipY = edge × .64`、`shoulderY = edge × .35`，两刃为同号系数镜像；这不是可靠的前后刃非对称姿态依据，不直接拷入新原型或其他课。
- **多视图不是同一关节数据：** `sceneBody` 使用 IK，`sceneTrack` 按比例独立构造膝/髋/肩。旧视图看似一致也不能证明解剖关系一致；迁移时从同一个动作状态投影。
- **课程标题/范围与共享动画不总相同：** `s22-warmup` 的“小幅屈伸”和 `v22-squat` 使用同一默认深蹲 keyframes；`v23-knees` 的穿靴/扣板目标却引用离雪深蹲；`v-toe-static-five` 的静态目标默认路径为 single-arc。它们是待审阅的表达差异，不在本轮擅自重写。
- **诊断不是病因证明：** 多个 diagnosis 课程复用正确动作；小回转 error 3D 模式目前只覆盖急甩尾横刹，不能据此宣称覆盖旧排错课全部反例。
- **资料粒度：** 现有 citations 挂在课程上；动画注释还有通用资料，但没有每个关节参数/时间点的实拍标定。下表来源是现有声明的索引，不表示已重新读取或认可所有姿态。

## 迁移验收卡（每个教学任务与变体分别填写）

每项记录四类状态：证据待核/已核，动作关系待审/已审，画面可读性待看/已看，交互待测/已测。只有四项完成且没有阻断缺陷才可替换；自动测试只覆盖其中可计算的几何/状态约束。

1. **证据与任务：** 写清学习者前提、地形/速度/装备范围、目标板表现；记录机构一手资料页码/章节及实际视频时间点，分别列出直接支持、推导与未知。资料只支持定性关系时不编造关节角、肌肉用力或压力百分比。
2. **两刃与两向过渡：** 每种前脚方向检查后刃保持、后→前释放/放平/新刃建立、前刃保持、前→后全过程；分别检验踝相对靴底、靴筒、高背接触、膝朝脚向、髋空间、躯干相对骨盆关系。不能把雪板整体滚转算成靴内踝活动，也不能只取峰值一帧。
3. **板表现与时序：** 板轴、实际移动方向、工作刃、滑移、路线与阶段文案同步；侧滑先解除会造成抓刃的关系再换侧；腿长变化不等于压力大小。动作提示、身体位移箭头、外力箭头分别标清。
4. **多视角审阅：** 实体和骨架并看；沿板宽、沿板长、斜前/斜后、俯视检查暂停关键帧及完整慢放。检查穿插、固定脚位、骨段长度、循环/100% 末态、模式同进度切换，保留可追溯截图/录像与具体缺陷记录。
5. **错误对照边界：** 每个反例只故意改变要观察的变量；不能为突出错误制造不可达关节。旧变体全部有去向；尚未实现者继续保留并标识，不能用一个 error 模式吞掉全部反例。
6. **交互、离线与数据：** 旋转/缩放、预设复位、播放后保留观察角、拖进度、速度、模式、regular/goofy、触控滚动/旋转、键盘与窄屏、WebGL 不可用的正文降级；进出课释放画布；旧备份导入及保存 HTML 重开后仍保留个人数据。
7. **替换与发布：** 按本清单的引用 ID 对勾，说明旧用途与新入口映射；小批量独立提交且可 revert；对应提交 Pages 部署成功后在线复看。报告实际看过的模式/阶段和未解决项，不把测试数量当教学准确率。

## 模块覆盖

| 模块 | 课程 | 旧动画引用 | 装备图 | 无图课程 |
| --- | --- | --- | --- | --- |
| 进阶学习地图 | 4 | 0 | 0 | 4 |
| 站姿与重心 | 6 | 6 | 0 | 0 |
| 立刃与关节 | 12 | 13 | 0 | 1 |
| 倾斜与关节成角 | 5 | 6 | 0 | 0 |
| 压力与屈伸时序 | 10 | 12 | 0 | 0 |
| 换刃与下肢引导 | 10 | 14 | 0 | 0 |
| 旋转协调与反脚 | 13 | 17 | 0 | 0 |
| 刻滑、滑移与控速 | 6 | 6 | 0 | 2 |
| 搓雪小回转专项 | 7 | 31 | 0 | 0 |
| 热身与体能 | 13 | 20 | 0 | 0 |
| 装备与舒适站姿 | 6 | 1 | 2 | 3 |
| 滑行问题诊断 | 6 | 6 | 0 | 0 |
| 练习设计与长期进阶 | 4 | 2 | 0 | 2 |

## 注册动画类型（包含未引用预设）

| 类型 | 预设教学用途 | 共享模型 | 引用 / 键数 | 去向 |
| --- | --- | --- | --- | --- |
| `center-low` | 降低重心：屈踝、屈膝、屈髋 | 雪上关键帧 + 双腿 IK | 1 / 1 | D1：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `center-high` | 可活动的中立姿态 | 雪上关键帧 + 双腿 IK | 4 / 2 | D1：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `fore-aft` | 沿板长的平衡与压力调整 | 雪上关键帧 + 双腿 IK | 7 / 4 | D1：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `toe-edge` | 前刃：用关节逐渐立刃 | 雪上关键帧 + 双腿 IK | 6 / 1 | D2：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `heel-edge` | 后刃：髋膝踝协调，不折腰坐尾 | 雪上关键帧 + 双腿 IK | 6 / 1 | D2：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `absorption` | 屈曲吸收：腿变短，身体更平顺 | 雪上关键帧 + 双腿 IK | 0 / 0 | D4：屈伸/换刃 3D + 必要二维时间图；待独立迁移 |
| `pressure-extend` | 伸展调压：有节奏地改变腿长 | 雪上关键帧 + 双腿 IK | 4 / 3 | D4：仅phase-study、heel、timing-study已接入；其他任务仍待独立迁移 |
| `pressure-flex` | 屈曲的两个阶段：开始下蹲与停住下落 | 雪上关键帧 + 双腿 IK | 3 / 2 | D4：仅phase-study、toe已接入；其他任务仍待独立迁移 |
| `inclination` | 内倾与关节折角的组合 | 雪上关键帧 + 双腿 IK | 4 / 4 | D2：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `edge-change-up` | 伸展式换刃：旧刃 → 回到居中位置 → 新刃 | 雪上关键帧 + 双腿 IK | 5 / 1 | D4：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `edge-change-down` | 回收式换刃：屈腿让板从身下通过 | 雪上关键帧 + 双腿 IK | 3 / 2 | D4：仅lower-com、retraction-study已接入；其他任务仍待独立迁移 |
| `steering` | 脚、膝、髋渐进引导雪板转向 | 雪上关键帧 + 双腿 IK | 7 / 1 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `shoulder-coordination` | 视线、肩髋与下肢协调 | 雪上关键帧 + 双腿 IK | 7 / 5 | D3：转向/滑移/旋转 3D + 同源俯视；当前保留旧版 |
| `garland` | 花环练习：同一刃、重复释放与建刃 | 雪上关键帧 + 双腿 IK | 2 / 2 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `j-turn` | J 形转弯：短直滑 → 单一圆弧 → 横坡 | 雪上关键帧 + 双腿 IK | 2 / 1 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `rail-track` | 浅弧刃滑：让板尾跟随板头 | 雪上关键帧 + 双腿 IK | 4 / 1 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `gaze-control` | 头部观察与肩髋控制：转头不甩板 | 雪上关键帧 + 双腿 IK | 1 / 1 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `hip-edge-change` | 髋引导换刃：保持踝膝协调 | 雪上关键帧 + 双腿 IK | 3 / 2 | D4：屈伸/换刃 3D + 必要二维时间图；待独立迁移 |
| `knee-edge-change` | 用膝盖的移动体会换刃：小幅、渐进、协调 | 雪上关键帧 + 双腿 IK | 1 / 1 | D4：屈伸/换刃 3D + 必要二维时间图；待独立迁移 |
| `retraction-turns` | 回收式连续转弯：屈曲换刃、弯内伸展 | 雪上关键帧 + 双腿 IK | 2 / 1 | D4：屈伸/换刃 3D + 必要二维时间图；待独立迁移 |
| `twist`（同帧：pedalling） | 扭板：前后脚不同刃角的协调 | 雪上关键帧 + 双腿 IK | 2 / 1 | D3：转向/滑移/旋转 3D + 同源俯视；当前保留旧版 |
| `rotation` | 同向协调旋转：下肢引导、上身跟进 | 雪上关键帧 + 双腿 IK | 2 / 1 | D3：转向/滑移/旋转 3D + 同源俯视；当前保留旧版 |
| `counter-rotation` | 反向旋转：特定任务的短时分离 | 雪上关键帧 + 双腿 IK | 2 / 1 | D3：转向/滑移/旋转 3D + 同源俯视；当前保留旧版 |
| `switch` | 反脚滑行：原后脚变成前脚 | 雪上关键帧 + 双腿 IK | 1 / 1 | D3：转向/滑移/旋转 3D + 同源俯视；当前保留旧版 |
| `dry-squat` | 离雪自重深蹲：髋膝协调、全脚掌支撑 | 离雪站立关节模型 | 6 / 2 | D6：独立普通鞋课内 3D；接触、骨架与实体同源，逐任务验收见 lesson-player-review.md |
| `dry-plank` | 离雪前平板支撑：肘在肩下、躯干一线 | 离雪侧面专用模型 | 2 / 1 | D6：独立普通鞋课内 3D；接触、骨架与实体同源，逐任务验收见 lesson-player-review.md |
| `dry-calf-raise` | 离雪提踵：抬脚跟、缓慢下放 | 离雪站立关节模型 | 2 / 1 | D6：独立普通鞋课内 3D；接触、骨架与实体同源，逐任务验收见 lesson-player-review.md |
| `dry-wall-edge` | 离雪扶墙前刃体感：踝膝髋协调 | 离雪站立关节模型 | 2 / 1 | D6：独立普通鞋课内 3D；接触、骨架与实体同源，逐任务验收见 lesson-player-review.md |
| `ankle-mobility` | 扶墙小腿伸展：后脚跟留在地面 | 离雪侧面专用模型 | 2 / 1 | D6：独立普通鞋课内 3D；接触、骨架与实体同源，逐任务验收见 lesson-player-review.md |
| `hip-mobility` | 半跪髋屈肌伸展：骨盆控制、躯干直立 | 离雪侧面专用模型 | 2 / 1 | D6：独立普通鞋课内 3D；接触、骨架与实体同源，逐任务验收见 lesson-player-review.md |
| `dry-hamstring` | 仰卧动态腘绳肌活动：托腿、慢伸膝 | 离雪侧面专用模型 | 2 / 1 | D6：独立普通鞋课内 3D；接触、骨架与实体同源，逐任务验收见 lesson-player-review.md |
| `mixed-rotation` | 肩部节奏组合：前刃反拧 → 回到居中位置 → 后刃协调 | 雪上关键帧 + 双腿 IK | 1 / 1 | D3：转向/滑移/旋转 3D + 同源俯视；当前保留旧版 |
| `dry-shoulder-rolls` | 离雪肩部绕环：放松双臂、小幅活动 | 离雪站立关节模型 | 2 / 1 | D6：独立普通鞋课内 3D；接触、骨架与实体同源，逐任务验收见 lesson-player-review.md |
| `pedalling`（同帧：twist） | 踩踏式协调：前后脚逐步配合 | 雪上关键帧 + 双腿 IK | 0 / 0 | D3：转向/滑移/旋转 3D + 同源俯视；当前保留旧版 |
| `short-turns` | 普通搓雪小回转：圆弯、持续引导 | 小回转共享时序/轨迹 + 双腿 IK | 20 / 11 | D5：按变体独立审阅后接入共享 3D；待迁移 |
| `short-turn-progression` | 侧滑接单个换刃弯 | 小回转共享时序/轨迹 + 双腿 IK | 9 / 6 | D5：按变体独立审阅后接入共享 3D；待迁移 |
| `short-turn-balance` | 双脚居中引导：板头板尾都在转 | 小回转共享时序/轨迹 + 双腿 IK | 5 / 3 | D5：按变体独立审阅后接入共享 3D；待迁移 |

## 变体键与全部实际配置

每一行按应用实际键分组。配置组合保留 view、jointLabels 等展示字段，便于审查同键不同表现；它们不是多套独立动作。每个引用的完整 steps 与配置在 JSON 中保留。

| 变体键 | 引用 ID | 不同配置数 | 去向 |
| --- | --- | --- | --- |
| `center-low:neutral` | v-base-stance/1 | 1 | D1：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `shoulder-coordination:arms-feedback` | v-arms-feedback/1、v-hand-back-cue/1 | 1 | D3：转向/滑移/旋转 3D + 同源俯视；当前保留旧版 |
| `fore-aft` | v-fore-aft-movement/1、v24-rear-load/1 | 1 | D1：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `fore-aft:front-center-back` | v-fore-aft-roles/1、v-fore-aft-drill/1 | 2 | D1：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `center-high:toe` | v-toe-high-low/1、v-low-high-principle/1 | 1 | D1：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `inclination:inclination-focused` | v-active-passive-edge/1 | 1 | D2：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `inclination:angulation-focused` | v-active-passive-edge/2 | 1 | D2：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `toe-edge` | v-toe-static-five/1、v-toe-tongue/1、v-toe-lock-ankle/1、v-toe-counterbalance/1、v-toe-ankle-role/1、v24-toe-unstable/1 | 3 | D2：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `heel-edge` | v-toe-tongue/2、v-heel-pull/1、v-heel-static-repetition/1、v-heel-counterbalance/1、v-heel-brief-hold/1、v24-heel-edge/1 | 4 | D2：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `steering` | v-lower-body-priority/1、v14-steering/3、v20-carve/1、v20-traffic/1、v20-traffic/2、s-short-adapt/5、s-short-adapt/6 | 4 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `center-high:heel` | v-low-high-principle/2、v-heel-height-progression/1 | 1 | D1：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `inclination:heel` | v-heel-low-inclination/1 | 1 | D2：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `pressure-extend:heel` | v-heel-incline-extension/1 | 1 | D4：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `inclination:toe` | v-toe-reach-snow/1 | 1 | D2：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `pressure-flex:phase-study` | v-pressure-overview/1、v11-flex/1 | 1 | D4：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `pressure-extend:phase-study` | v-pressure-overview/2、v11-extend/1 | 1 | D4：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `pressure-flex:toe` | v-toe-kneel-pressure/1 | 1 | D4：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `fore-aft:rear-heel` | v-heel-open-rear-foot/1、v-heel-open-loading/1 | 1 | D1：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `fore-aft:front-return-toe` | v-toe-front-participation/1 | 1 | D1：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `hip-edge-change:open` | v11-lateral/1 | 1 | D4：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `short-turns:round` | v12-rhythm-why/1、s-short-rhythm/1、s-short-diagnosis/1 | 1 | D5：按变体独立审阅后接入共享 3D；待迁移 |
| `edge-change-up` | v12-up-drill/1、v-transition-map/1、v-transition-map/3、v15-incline-change/1、v24-heel-transition/1 | 4 | D4：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `edge-change-down:lower-com` | v13-down-drill/1 | 1 | D4：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `edge-change-down:retraction-study` | v13-down-drill/2、v-transition-map/2 | 1 | D4：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `garland:toe` | v14-steering/1 | 1 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `garland:heel` | v14-steering/2 | 1 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `twist` | v14-twist/1、s14-twist-drill/1 | 1 | D3：转向/滑移/旋转 3D + 同源俯视；当前保留旧版 |
| `gaze-control` | v15-gaze-drill/1 | 1 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `hip-edge-change` | v16-hip-change/1、v16-hip-drill/1 | 2 | D4：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `knee-edge-change` | v17-knee-change/1 | 1 | D4：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `retraction-turns` | v17-retract-drill/1、v19-stable-upper/2 | 1 | D4：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `rotation` | v-shoulder-rhythm-map/1、v18-follow/1 | 1 | D3：转向/滑移/旋转 3D + 同源俯视；当前保留旧版 |
| `counter-rotation` | v-shoulder-rhythm-map/2、v19-counter/1 | 1 | D3：转向/滑移/旋转 3D + 同源俯视；当前保留旧版 |
| `short-turns:round:extend` | v-shoulder-rhythm-map/3、v-toe-open-causal/2、v19-stable-upper/1、s-short-integrated/1、s22-warmup/4 | 2 | D5：按变体独立审阅后接入共享 3D；待迁移 |
| `shoulder-coordination:neutral` | v-mid-position-30/1、v18-neutral/1 | 1 | D3：转向/滑移/旋转 3D + 同源俯视；当前保留旧版 |
| `mixed-rotation` | v19-mixed/1 | 1 | D3：转向/滑移/旋转 3D + 同源俯视；当前保留旧版 |
| `shoulder-coordination:open-heel` | v-heel-open-progression/1 | 1 | D3：转向/滑移/旋转 3D + 同源俯视；当前保留旧版 |
| `short-turns:asymmetric:extend` | v-toe-open-causal/1 | 1 | D5：按变体独立审阅后接入共享 3D；待迁移 |
| `shoulder-coordination:closed-toe` | v-toe-closed-drill/1 | 1 | D3：转向/滑移/旋转 3D + 同源俯视；当前保留旧版 |
| `switch` | v19-switch/1 | 1 | D3：转向/滑移/旋转 3D + 同源俯视；当前保留旧版 |
| `j-turn` | v-toe-low-drill/1、s-short-adapt/7 | 2 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `rail-track` | v20-carve/2、s20-rails/1、v24-skid-track/1、v21-method/1 | 3 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `short-turns:round:flex` | s-short-integrated/2 | 1 | D5：按变体独立审阅后接入共享 3D；待迁移 |
| `short-turns:tail-brake` | s-short-integrated/3、s-short-diagnosis/2 | 1 | D5：按变体独立审阅后接入共享 3D；待迁移 |
| `short-turn-progression:side-slip` | s-short-sideslip/1 | 1 | D5：按变体独立审阅后接入共享 3D；待迁移 |
| `short-turn-progression:side-slip-shorter` | s-short-sideslip/2 | 1 | D5：按变体独立审阅后接入共享 3D；待迁移 |
| `short-turn-progression:linked` | s-short-sideslip/3 | 1 | D5：按变体独立审阅后接入共享 3D；待迁移 |
| `short-turn-progression:medium-to-short` | s-short-size-ladder/1、s-short-adapt/2 | 1 | D5：按变体独立审阅后接入共享 3D；待迁移 |
| `short-turn-progression:short-steady` | s-short-size-ladder/2、s-short-adapt/1 | 1 | D5：按变体独立审阅后接入共享 3D；待迁移 |
| `short-turn-progression:short-to-medium` | s-short-size-ladder/3、s-short-adapt/4 | 1 | D5：按变体独立审阅后接入共享 3D；待迁移 |
| `short-turn-balance:centered` | s-short-balance/1 | 1 | D5：按变体独立审阅后接入共享 3D；待迁移 |
| `short-turn-balance:nose-pivot` | s-short-balance/2、s-short-diagnosis/8 | 1 | D5：按变体独立审阅后接入共享 3D；待迁移 |
| `short-turn-balance:back-seat` | s-short-balance/3、s-short-diagnosis/9 | 1 | D5：按变体独立审阅后接入共享 3D；待迁移 |
| `short-turns:asymmetric` | s-short-rhythm/2、s-short-diagnosis/5 | 1 | D5：按变体独立审阅后接入共享 3D；待迁移 |
| `short-turns:shoulder-led` | s-short-diagnosis/3 | 1 | D5：按变体独立审阅后接入共享 3D；待迁移 |
| `short-turns:edge-locked` | s-short-diagnosis/4 | 1 | D5：按变体独立审阅后接入共享 3D；待迁移 |
| `short-turns:low-stuck` | s-short-diagnosis/6 | 1 | D5：按变体独立审阅后接入共享 3D；待迁移 |
| `short-turns:round:retract` | s-short-diagnosis/7、s-short-adapt/3 | 1 | D5：按变体独立审阅后接入共享 3D；待迁移 |
| `short-turns:over-inclined` | s-short-diagnosis/10 | 1 | D5：按变体独立审阅后接入共享 3D；待迁移 |
| `dry-squat` | v22-strength/1、v22-heel-rehearsal/1、v22-squat/1、s22-warmup/2、v23-knees/1 | 4 | D6：独立普通鞋课内 3D；接触、骨架与实体同源，逐任务验收见 lesson-player-review.md |
| `dry-calf-raise` | v22-strength/2、v22-calf/1 | 1 | D6：独立普通鞋课内 3D；接触、骨架与实体同源，逐任务验收见 lesson-player-review.md |
| `dry-plank` | v22-strength/3、v22-plank/1 | 1 | D6：独立普通鞋课内 3D；接触、骨架与实体同源，逐任务验收见 lesson-player-review.md |
| `dry-wall-edge` | v22-wall/1、s22-warmup/3 | 1 | D6：独立普通鞋课内 3D；接触、骨架与实体同源，逐任务验收见 lesson-player-review.md |
| `ankle-mobility` | v22-flexibility/1、s22-ankle-mobility/1 | 1 | D6：独立普通鞋课内 3D；接触、骨架与实体同源，逐任务验收见 lesson-player-review.md |
| `hip-mobility` | v22-flexibility/2、s22-hip-mobility/1 | 1 | D6：独立普通鞋课内 3D；接触、骨架与实体同源，逐任务验收见 lesson-player-review.md |
| `dry-hamstring` | v22-flexibility/3、s22-hamstring/1 | 1 | D6：独立普通鞋课内 3D；接触、骨架与实体同源，逐任务验收见 lesson-player-review.md |
| `dry-squat:hold` | v22-hold/1 | 1 | D6：独立普通鞋课内 3D；接触、骨架与实体同源，逐任务验收见 lesson-player-review.md |
| `dry-shoulder-rolls` | s22-shoulder/1、s22-warmup/1 | 1 | D6：独立普通鞋课内 3D；接触、骨架与实体同源，逐任务验收见 lesson-player-review.md |
| `shoulder-coordination` | v24-heel-pivot/1 | 1 | D3：转向/滑移/旋转 3D + 同源俯视；当前保留旧版 |
| `pressure-extend:timing-study` | v21-linear/1 | 1 | D4：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |

## 逐课用途、资料与替换入口

每个引用的 renderer/status 保存在 JSON：lesson-3d 表示默认播放器已接入；legacy-svg 表示待迁移。状态不代替教学验收。未配动画的课保留正文；不视作漏迁。课程链接打开后，按清单 `/N` 查看第 N 个示意。

| 课程入口 | 教学用途（原 goal） | 全部示意键（按按钮次序） | 现有资料 |
| --- | --- | --- | --- |
| [v-purpose](https://yichenluan.github.io/snowboard-guide/#lesson=v-purpose) | 进阶滑行：先明确自己要练到什么：每次上雪只选一个能看见、能复查的进步目标。 | 正文保留，无动作图 | [S03](#source-s03)、[S15](#source-s15) |
| [v-dimensions](https://yichenluan.github.io/snowboard-guide/#lesson=v-dimensions) | 看懂雪板：六个基本控制点：出现失误时，先判断要改哪一项，再选动作。 | 正文保留，无动作图 | [S01](#source-s01)、[S02](#source-s02) |
| [v-progression](https://yichenluan.github.io/snowboard-guide/#lesson=v-progression) | 从稳定连弯走向刻滑与搓雪小回转：依据实际短板选择下一步，不按动作外形盲目升级。 | 正文保留，无动作图 | [S09](#source-s09)、[S11](#source-s11) |
| [v-isolate-combine](https://yichenluan.github.io/snowboard-guide/#lesson=v-isolate-combine) | 单项练完，怎样用回正常滑行：每项练习都能回答：改了什么，是否有效，能不能用回自然滑行。 | 正文保留，无动作图 | [S15](#source-s15)、[S03](#source-s03) |
| [v-base-stance](https://yichenluan.github.io/snowboard-guide/#lesson=v-base-stance) | 基本站姿：站在两脚之间，关节能动：无需先大幅救平衡，就能调刃、屈伸和进入下一弯。 | 1. `center-low:neutral` | [S16](#source-s16)、[S03](#source-s03) |
| [v-arms-feedback](https://yichenluan.github.io/snowboard-guide/#lesson=v-arms-feedback) | 双臂作参考：转头观察时别把板带跑：转头观察后仍能维持原路线，不靠固定双臂滑行。 | 1. `shoulder-coordination:arms-feedback` | [S16](#source-s16)、[S03](#source-s03) |
| [v-fore-aft-movement](https://yichenluan.github.io/snowboard-guide/#lesson=v-fore-aft-movement) | 前后重心：调节两脚承重：能向板头或板尾略移，并顺畅回到两脚都能工作的状态。 | 1. `fore-aft` | [S01](#source-s01)、[S10](#source-s10) |
| [v-fore-aft-roles](https://yichenluan.github.io/snowboard-guide/#lesson=v-fore-aft-roles) | 转弯时，前脚和后脚怎样配合：找到是哪一段雪板反应不对，不把固定“先压前、再压后”当所有弯的口令。 | 1. `fore-aft:front-center-back` | [S10](#source-s10)、[S16](#source-s16) |
| [v-fore-aft-drill](https://yichenluan.github.io/snowboard-guide/#lesson=v-fore-aft-drill) | 前—中—后：感受两脚承重变化：知道自己的调整影响了什么，并把夸张的感知动作缩回正常滑行。 | 1. `fore-aft:front-center-back` | [S16](#source-s16) |
| [v-toe-high-low](https://yichenluan.github.io/snowboard-guide/#lesson=v-toe-high-low) | 前刃高低站位：蹲得下，也站得起：站高一点和蹲低一点都能控刃，不靠锁膝或折腰。 | 1. `center-high:toe` | [S03](#source-s03)、[S16](#source-s16) |
| [v-active-passive-edge](https://yichenluan.github.io/snowboard-guide/#lesson=v-active-passive-edge) | 立刃的两种配合：身体内倾与关节成角：能用小动作立刃，并知道加大内倾时要看路线和抓地。 | 1. `inclination:inclination-focused`<br>2. `inclination:angulation-focused` | [S16](#source-s16)、[F01](#source-f01)、[S01](#source-s01) |
| [v-toe-static-five](https://yichenluan.github.io/snowboard-guide/#lesson=v-toe-static-five) | 原地练前刃，再用单弯验证：每次立刃后都能恢复，并把感觉对应到实际雪痕。 | 1. `toe-edge` | [S06](#source-s06)、[S16](#source-s16) |
| [v-toe-tongue](https://yichenluan.github.io/snowboard-guide/#lesson=v-toe-tongue) | 前刃发力：胫骨贴靴舌，脚跟留在靴内：前刃能渐进立起、稳住，也能按路线慢慢放开。 | 1. `toe-edge`<br>2. `heel-edge` | [S06](#source-s06)、[S16](#source-s16) |
| [v-toe-lock-ankle](https://yichenluan.github.io/snowboard-guide/#lesson=v-toe-lock-ankle) | 前刃调角：膝髋渐进移动，脚踝能调：刃角稍大后仍能控制路线，并能顺畅进入下一步。 | 1. `toe-edge` | [S06](#source-s06)、[S16](#source-s16) |
| [v-heel-pull](https://yichenluan.github.io/snowboard-guide/#lesson=v-heel-pull) | 后刃发力：脚跟、高背板与膝髋配合：后刃既能稳住，也能继续屈伸和放开，不靠踢后脚。 | 1. `heel-edge` | [S06](#source-s06)、[S16](#source-s16) |
| [v-heel-static-repetition](https://yichenluan.github.io/snowboard-guide/#lesson=v-heel-static-repetition) | 原地练后刃：立得起，也放得下：后刃动作能自主完成，不靠他人拉住或大摆臂。 | 1. `heel-edge` | [S06](#source-s06) |
| [v-toe-counterbalance](https://yichenluan.github.io/snowboard-guide/#lesson=v-toe-counterbalance) | 前刃成角：腿调角，上身保持平衡：增加一点前刃角度后，仍能稳住路线并进入下一弯。 | 1. `toe-edge` | [S16](#source-s16)、[S06](#source-s06) |
| [v-heel-counterbalance](https://yichenluan.github.io/snowboard-guide/#lesson=v-heel-counterbalance) | 后刃成角：髋向脚跟侧，上身配合平衡：后刃脚下变重时还能调整，不整个人向弯内躺倒。 | 1. `heel-edge` | [S06](#source-s06)、[S16](#source-s16) |
| [v-lower-body-priority](https://yichenluan.github.io/snowboard-guide/#lesson=v-lower-body-priority) | 下肢带转向，全身配合平衡：手臂放松时也能转圆弯，不靠抡肩或踢后脚。 | 1. `steering` | [S03](#source-s03)、[S16](#source-s16) |
| [v-heel-brief-hold](https://yichenluan.github.io/snowboard-guide/#lesson=v-heel-brief-hold) | 后刃单弯：稳住一段，再完成并停住：后刃的建立、保持和结束都能主动控制。 | 1. `heel-edge` | [S06](#source-s06) |
| [v-heel-feedback](https://yichenluan.github.io/snowboard-guide/#lesson=v-heel-feedback) | 检查后刃：感觉、录像和雪痕一起看：能据实际结果保留或撤回一个调整。 | 正文保留，无动作图 | [S16](#source-s16) |
| [v-toe-ankle-role](https://yichenluan.github.io/snowboard-guide/#lesson=v-toe-ankle-role) | 脚踝怎样借助雪鞋调节前刃：靴能托住小腿，脚踝仍能微调，而不是锁死或在靴内松动。 | 1. `toe-edge` | [S16](#source-s16)、[S06](#source-s06)、[F01](#source-f01) |
| [v-low-high-principle](https://yichenluan.github.io/snowboard-guide/#lesson=v-low-high-principle) | 站多高合适：为下一次屈伸留空间：无论高低，都给下一步调刃与屈伸留空间。 | 1. `center-high:toe`<br>2. `center-high:heel` | [S16](#source-s16)、[S06](#source-s06) |
| [v-heel-low-inclination](https://yichenluan.github.io/snowboard-guide/#lesson=v-heel-low-inclination) | 后刃内倾练习：先稳住弧线，再加幅度：内倾增加时，雪板与身体仍沿可控弧线走。 | 1. `inclination:heel` | [S16](#source-s16)、[S17](#source-s17) |
| [v-heel-height-progression](https://yichenluan.github.io/snowboard-guide/#lesson=v-heel-height-progression) | 后刃高低对照：站高一点仍能控刃：较高站位仍能控速、吸收和换刃，不把站高做成锁膝。 | 1. `center-high:heel` | [S16](#source-s16)、[S11](#source-s11) |
| [v-heel-incline-extension](https://yichenluan.github.io/snowboard-guide/#lesson=v-heel-incline-extension) | 后刃弯里渐进伸腿与收腿：伸腿帮助维持路线，不变成猛蹬或后脚横推。 | 1. `pressure-extend:heel` | [S16](#source-s16)、[S10](#source-s10) |
| [v-toe-reach-snow](https://yichenluan.github.io/snowboard-guide/#lesson=v-toe-reach-snow) | 前刃内倾：手臂自然，不主动够雪：前刃幅度增加后仍看得见出口，也能准备下一弯。 | 1. `inclination:toe` | [S16](#source-s16)、[S10](#source-s10) |
| [v-pressure-overview](https://yichenluan.github.io/snowboard-guide/#lesson=v-pressure-overview) | 脚下压力：分清大小、方向和前后分配：先判断要稳住板、吸收变化还是放开旧刃，再选动作。 | 1. `pressure-flex:phase-study`<br>2. `pressure-extend:phase-study` | [S16](#source-s16)、[S01](#source-s01)、[A01](#source-a01) |
| [v-toe-kneel-pressure](https://yichenluan.github.io/snowboard-guide/#lesson=v-toe-kneel-pressure) | 前刃吸收压力：柔和屈腿，不猛跪：吸收压力变化后仍能继续调刃，不猛跪、不蹲到底。 | 1. `pressure-flex:toe` | [S16](#source-s16)、[S10](#source-s10) |
| [v-heel-open-rear-foot](https://yichenluan.github.io/snowboard-guide/#lesson=v-heel-open-rear-foot) | 开放后刃：让后脚也能稳稳控刃：后刃板尾能按计划转弯，下一弯也不被后坐拖住。 | 1. `fore-aft:rear-heel` | [S01](#source-s01)、[S10](#source-s10) |
| [v-toe-front-participation](https://yichenluan.github.io/snowboard-guide/#lesson=v-toe-front-participation) | 前刃入弯：前脚带入，后脚接上：入弯更顺，弯中仍由两脚配合，不一直压在前脚。 | 1. `fore-aft:front-return-toe` | [S10](#source-s10)、[S03](#source-s03) |
| [v11-flex](https://yichenluan.github.io/snowboard-guide/#lesson=v11-flex) | 屈腿调压：开始下沉与收住动作不同：按需要缩短腿长，同时保住路线和后续活动空间。 | 1. `pressure-flex:phase-study` | [S16](#source-s16)、[S10](#source-s10) |
| [v11-extend](https://yichenluan.github.io/snowboard-guide/#lesson=v11-extend) | 伸腿调压：开始站起与停止上升不同：渐进伸腿后仍能屈回来，不靠猛蹬制造转弯。 | 1. `pressure-extend:phase-study` | [S16](#source-s16)、[S10](#source-s10) |
| [v11-lateral](https://yichenluan.github.io/snowboard-guide/#lesson=v11-lateral) | 开放站姿：分清板头板尾与两侧板刃：分清向前刃/后刃移动，与向板头/板尾偏移。 | 1. `hip-edge-change:open` | [S16](#source-s16)、[S01](#source-s01) |
| [v12-rhythm-why](https://yichenluan.github.io/snowboard-guide/#lesson=v12-rhythm-why) | 连弯节奏：先完成弯形，再调整快慢：连续换刃少停顿，弯尾不堆成一次猛烈急刹。 | 1. `short-turns:round` | [S16](#source-s16)、[S06](#source-s06) |
| [v12-up-drill](https://yichenluan.github.io/snowboard-guide/#lesson=v12-up-drill) | 伸展式换刃：起身同时放开旧刃：贴雪完成换刃，并给新弯继续屈腿留空间。 | 1. `edge-change-up` | [S10](#source-s10)、[S16](#source-s16) |
| [v13-down-drill](https://yichenluan.github.io/snowboard-guide/#lesson=v13-down-drill) | 屈曲换刃与回收换刃：两种收腿方式：分清两种动作路径，放开旧刃后平顺接上新刃。 | 1. `edge-change-down:lower-com`<br>2. `edge-change-down:retraction-study` | [S06](#source-s06)、[S16](#source-s16) |
| [v-transition-map](https://yichenluan.github.io/snowboard-guide/#lesson=v-transition-map) | 看清换刃：放旧刃、经过平板、建新刃：旧刃能放开，新刃能连续建立，中间不僵停也不扑肩。 | 1. `edge-change-up`<br>2. `edge-change-down:retraction-study`<br>3. `edge-change-up` | [S16](#source-s16)、[S17](#source-s17)、[S06](#source-s06) |
| [v14-steering](https://yichenluan.github.io/snowboard-guide/#lesson=v14-steering) | 下肢引导搓雪弯：连续转向，不甩后脚：转出连续圆弧，避免前脚钉住、后脚突然把板尾甩过去。 | 1. `garland:toe`<br>2. `garland:heel`<br>3. `steering` | [S16](#source-s16)、[A02](#source-a02) |
| [v14-twist](https://yichenluan.github.io/snowboard-guide/#lesson=v14-twist) | 板体扭转：前后脚调刃可以有先后：辨认两脚独立动作，并让后段及时接上新刃。 | 1. `twist` | [S16](#source-s16)、[S01](#source-s01) |
| [v15-incline-change](https://yichenluan.github.io/snowboard-guide/#lesson=v15-incline-change) | 身体怎样跨过雪板进入下一弯：身体跨板顺畅，不把肩先扔进新弯等雪板追上。 | 1. `edge-change-up` | [S17](#source-s17)、[S16](#source-s16) |
| [v15-gaze-drill](https://yichenluan.github.io/snowboard-guide/#lesson=v15-gaze-drill) | 转头观察时，保持原来的路线：观察后仍能保持当前速度、走廊和板刃控制。 | 1. `gaze-control` | [S16](#source-s16)、[S18](#source-s18) |
| [v16-hip-change](https://yichenluan.github.io/snowboard-guide/#lesson=v16-hip-change) | 髋参与换刃：向板刃移动，不向板尾坐：髋向目标板刃移动时，不无意坐向板尾，也能进入下一弯。 | 1. `hip-edge-change` | [S16](#source-s16) |
| [v16-hip-drill](https://yichenluan.github.io/snowboard-guide/#lesson=v16-hip-drill) | 髋部换侧练习：原地感知，滑行验证：小幅两侧调节能自主恢复，滑行不因强调髋而更僵。 | 1. `hip-edge-change` | [S16](#source-s16) |
| [v17-knee-change](https://yichenluan.github.io/snowboard-guide/#lesson=v17-knee-change) | 从膝的移动看踝膝髋怎样换刃：换刃动作更紧凑，但膝不强拧、弧线不变成直冲。 | 1. `knee-edge-change` | [S16](#source-s16) |
| [v17-retract-drill](https://yichenluan.github.io/snowboard-guide/#lesson=v17-retract-drill) | 回收式搓雪小回转：板从身下通过：以回收改善短弯衔接，不损失圆弧、滑移和控速。 | 1. `retraction-turns` | [T01](#source-t01)、[S16](#source-s16) |
| [s14-twist-drill](https://yichenluan.github.io/snowboard-guide/#lesson=s14-twist-drill) | 前后脚踏动：练小幅先后调刃：分得清两脚调刃，又能及时合回完整动作。 | 1. `twist` | [S16](#source-s16) |
| [v-shoulder-rhythm-map](https://yichenluan.github.io/snowboard-guide/#lesson=v-shoulder-rhythm-map) | 旋转怎么配合：同向、反向与上身相对稳定：能从录像认出三种关系，再选适合当前弯形的动作。 | 1. `rotation`<br>2. `counter-rotation`<br>3. `short-turns:round:extend` | [S16](#source-s16) |
| [v-mid-position-30](https://yichenluan.github.io/snowboard-guide/#lesson=v-mid-position-30) | 肩膀朝哪里：找到适合自己的自然朝向：用两侧弯形和控速来检查肩髋朝向是否合适。 | 1. `shoulder-coordination:neutral` | [S16](#source-s16) |
| [v19-mixed](https://yichenluan.github.io/snowboard-guide/#lesson=v19-mixed) | 旋转方式切换：反向调整后接回自然圆弯：把已经会的小幅反向调速动作接回自然圆弯。 | 1. `mixed-rotation` | [S16](#source-s16)、[T01](#source-t01) |
| [v-heel-open-loading](https://yichenluan.github.io/snowboard-guide/#lesson=v-heel-open-loading) | 开肩后的后刃：检查前后脚是否都能控制：在舒适开肩范围内，两脚仍能调刃，板尾不突然扫出。 | 1. `fore-aft:rear-heel` | [S16](#source-s16) |
| [v-heel-open-progression](https://yichenluan.github.io/snowboard-guide/#lesson=v-heel-open-progression) | 开肩姿态练习：朝向、屈伸、倾斜分开试：在舒适朝向下连续转弯，仍能轻松释放旧刃。 | 1. `shoulder-coordination:open-heel` | [S16](#source-s16) |
| [v-toe-open-causal](https://yichenluan.github.io/snowboard-guide/#lesson=v-toe-open-causal) | 两侧弯不一样：先找哪一步开始偏差：找出两侧差异最早出现的位置，并只改一处复测。 | 1. `short-turns:asymmetric:extend`<br>2. `short-turns:round:extend` | [S16](#source-s16) |
| [v-toe-closed-drill](https://yichenluan.github.io/snowboard-guide/#lesson=v-toe-closed-drill) | 前刃双脚配合：用自然朝向找回前脚引导：让前刃弧线更连续，避免一条腿从头撑到尾。 | 1. `shoulder-coordination:closed-toe` | [S16](#source-s16) |
| [v-hand-back-cue](https://yichenluan.github.io/snowboard-guide/#lesson=v-hand-back-cue) | 用手臂作参照：发现多余的转肩：发现抢肩，并在手臂自然放松时完成同样圆弯。 | 1. `shoulder-coordination:arms-feedback` | [S16](#source-s16) |
| [v18-follow](https://yichenluan.github.io/snowboard-guide/#lesson=v18-follow) | 同向旋转：腿带着板转，上身自然跟随：连续引导圆弯，减少入弯和弯尾的突然扫尾。 | 1. `rotation` | [S16](#source-s16) |
| [v18-neutral](https://yichenluan.github.io/snowboard-guide/#lesson=v18-neutral) | 自然站姿：开肩后两条腿仍能活动：找到两侧都能顺利换刃的自然朝向。 | 1. `shoulder-coordination:neutral` | [S16](#source-s16) |
| [v19-counter](https://yichenluan.github.io/snowboard-guide/#lesson=v19-counter) | 反向旋转：已掌握调速动作后的专项练习：小幅增加熟悉后刃调速动作中的上下身反向配合，再恢复原路线。 | 1. `counter-rotation` | [S16](#source-s16)、[T01](#source-t01) |
| [v19-switch](https://yichenluan.github.io/snowboard-guide/#lesson=v19-switch) | 反脚滑行：让新的前脚带路：在反脚方向上两刃都能控速、完成弯和停止。 | 1. `switch` | [S16](#source-s16) |
| [v19-stable-upper](https://yichenluan.github.io/snowboard-guide/#lesson=v19-stable-upper) | 上下身分离：上身走得稳，双腿继续转弯：减少无用的甩肩，同时保留双腿引导和自然平衡。 | 1. `short-turns:round:extend`<br>2. `retraction-turns` | [S16](#source-s16)、[T01](#source-t01) |
| [v-toe-touch-criterion](https://yichenluan.github.io/snowboard-guide/#lesson=v-toe-touch-criterion) | 刻滑是否进步：看轨迹、控速、放刃和适应：用能重复观察的结果决定下一步，而不是凭一个好看的姿势升级。 | 正文保留，无动作图 | [S16](#source-s16)、[S15](#source-s15) |
| [v-toe-low-drill](https://yichenluan.github.io/snowboard-guide/#lesson=v-toe-low-drill) | 前刃 J 弯：让雪板沿一条弧线转向横坡：完成可控的前刃单弧，知道哪里抓刃、哪里开始扫尾。 | 1. `j-turn` | [S16](#source-s16) |
| [v20-carve](https://yichenluan.github.io/snowboard-guide/#lesson=v20-carve) | 刻滑和搓雪：主动选择滑移多少：能减少或增加滑移，同时把圆弯和速度控制好。 | 1. `steering`<br>2. `rail-track` | [S16](#source-s16)、[S10](#source-s10) |
| [v20-traffic](https://yichenluan.github.io/snowboard-guide/#lesson=v20-traffic) | 弯形控速：弯尾朝哪里，速度就怎样变化：在选定走廊内用完整圆弧控速，减少弯尾突然横刹。 | 1. `steering`<br>2. `steering` | [S16](#source-s16)、[S18](#source-s18) |
| [v20-path](https://yichenluan.github.io/snowboard-guide/#lesson=v20-path) | 刻滑进阶路线：单弧、连弧，再调整弯形：根据当前最弱的一步，选出一项练习和清楚的通过标准。 | 正文保留，无动作图 | [S16](#source-s16)、[T02](#source-t02) |
| [s20-rails](https://yichenluan.github.io/snowboard-guide/#lesson=s20-rails) | 浅弧连刃：用小刃角连接连续窄痕：两侧各留下连续窄痕，并在预定位置主动结束。 | 1. `rail-track` | [S16](#source-s16) |
| [s-short-integrated](https://yichenluan.github.io/snowboard-guide/#lesson=s-short-integrated) | 搓雪小回转：把释放、转向和控速连成一组：不依赖刻滑或回收换刃，完成一组圆润、对称、速度可控的搓雪小回转。 | 1. `short-turns:round:extend`<br>2. `short-turns:round:flex`<br>3. `short-turns:tail-brake` | [S10](#source-s10)、[S16](#source-s16) |
| [s-short-sideslip](https://yichenluan.github.io/snowboard-guide/#lesson=s-short-sideslip) | 侧滑接单弯：一步步连成搓雪小回转：把“能用两刃侧滑和单弯停止”接到“连续的小搓雪弯”，补上换侧练习的中间台阶。 | 1. `short-turn-progression:side-slip`<br>2. `short-turn-progression:side-slip-shorter`<br>3. `short-turn-progression:linked` | [S16](#source-s16) |
| [s-short-size-ladder](https://yichenluan.github.io/snowboard-guide/#lesson=s-short-size-ladder) | 从中弯到小弯：逐级缩小，再回到中弯：能主动缩小弯，也能随时放大弯，避免只会跟着固定节拍摆板。 | 1. `short-turn-progression:medium-to-short`<br>2. `short-turn-progression:short-steady`<br>3. `short-turn-progression:short-to-medium` | [S16](#source-s16) |
| [s-short-balance](https://yichenluan.github.io/snowboard-guide/#lesson=s-short-balance) | 双脚带板与前后平衡：不要围着板头甩尾：缩弯时保留两脚的控制，找到能连续换侧的前后位置。 | 1. `short-turn-balance:centered`<br>2. `short-turn-balance:nose-pivot`<br>3. `short-turn-balance:back-seat` | [A03](#source-a03)、[S10](#source-s10) |
| [s-short-rhythm](https://yichenluan.github.io/snowboard-guide/#lesson=s-short-rhythm) | 小回转节奏：两侧一样完整，再谈快慢：两侧小弯都能从容完成，避免一边赶、一边拖。 | 1. `short-turns:round`<br>2. `short-turns:asymmetric` | [S16](#source-s16) |
| [s-short-diagnosis](https://yichenluan.github.io/snowboard-guide/#lesson=s-short-diagnosis) | 搓雪小回转排错：先看路线，再找动作原因：把“滑得不顺”变成可验证的问题，一次只改一件事。 | 1. `short-turns:round`<br>2. `short-turns:tail-brake`<br>3. `short-turns:shoulder-led`<br>4. `short-turns:edge-locked`<br>5. `short-turns:asymmetric`<br>6. `short-turns:low-stuck`<br>7. `short-turns:round:retract`<br>8. `short-turn-balance:nose-pivot`<br>9. `short-turn-balance:back-seat`<br>10. `short-turns:over-inclined` | [S10](#source-s10)、[S16](#source-s16) |
| [s-short-adapt](https://yichenluan.github.io/snowboard-guide/#lesson=s-short-adapt) | 小回转验收：能保持，也能随时改变：让小回转成为可选择的滑行方式，而不是只能在固定节拍下维持的动作。 | 1. `short-turn-progression:short-steady`<br>2. `short-turn-progression:medium-to-short`<br>3. `short-turns:round:retract`<br>4. `short-turn-progression:short-to-medium`<br>5. `steering`<br>6. `steering`<br>7. `j-turn` | [S16](#source-s16)、[S10](#source-s10) |
| [v22-strength](https://yichenluan.github.io/snowboard-guide/#lesson=v22-strength) | 体能怎么练：力量、耐力和动作质量一起看：找出疲劳是否影响控制，建立能坚持、能恢复的离雪训练。 | 1. `dry-squat`<br>2. `dry-calf-raise`<br>3. `dry-plank` | [S21](#source-s21)、[S22](#source-s22) |
| [v22-wall](https://yichenluan.github.io/snowboard-guide/#lesson=v22-wall) | 扶墙屈踝：小腿向前，脚跟留地：能小幅屈踝并主动返回，不靠抬跟或手推墙硬压。 | 1. `dry-wall-edge` | [S06](#source-s06)、[S25](#source-s25)、[S24](#source-s24) |
| [v22-heel-rehearsal](https://yichenluan.github.io/snowboard-guide/#lesson=v22-heel-rehearsal) | 后刃动作预习：屁股后下移，身体保持平衡：下降、停住和起身都能踩稳脚掌。 | 1. `dry-squat` | [S16](#source-s16)、[S25](#source-s25) |
| [v22-flexibility](https://yichenluan.github.io/snowboard-guide/#lesson=v22-flexibility) | 活动度：既能伸展开，也能自己收回来：找准一个受限动作，用舒适练习改善后重新检查。 | 1. `ankle-mobility`<br>2. `hip-mobility`<br>3. `dry-hamstring` | [S24](#source-s24)、[S29](#source-s29) |
| [v22-hold](https://yichenluan.github.io/snowboard-guide/#lesson=v22-hold) | 浅半蹲保持：能呼吸，也能随时站起：在停留中维持姿态，并平稳结束动作。 | 1. `dry-squat:hold` | [S25](#source-s25)、[S21](#source-s21) |
| [v22-calf](https://yichenluan.github.io/snowboard-guide/#lesson=v22-calf) | 双脚提踵：慢慢抬跟，也慢慢放下：提起、短停和下降都能控制，双脚不向内外翻。 | 1. `dry-calf-raise` | [S28](#source-s28)、[S16](#source-s16) |
| [v22-squat](https://yichenluan.github.io/snowboard-guide/#lesson=v22-squat) | 自重深蹲：脚掌踩稳，髋膝踝一起动：完成可控的下降、短停和起身，为离雪力量训练打基础。 | 1. `dry-squat` | [S25](#source-s25)、[S29](#source-s29)、[S21](#source-s21) |
| [v22-plank](https://yichenluan.github.io/snowboard-guide/#lesson=v22-plank) | 前臂平板支撑：身体成线，呼吸不断：在短时前臂支撑中保持躯干形态与呼吸，并让膝受控回垫。 | 1. `dry-plank` | [S27](#source-s27)、[S34](#source-s34) |
| [s22-hamstring](https://yichenluan.github.io/snowboard-guide/#lesson=s22-hamstring) | 大腿后侧动态拉伸：托住大腿，慢慢伸屈膝：大腿大致不动时，小腿能在舒适范围往返。 | 1. `dry-hamstring` | [S29](#source-s29) |
| [s22-hip-mobility](https://yichenluan.github.io/snowboard-guide/#lesson=s22-hip-mobility) | 半跪髋前侧拉伸：轻收骨盆，再小幅前移：分清髋前侧拉伸和腰部代偿，能主动退回。 | 1. `hip-mobility` | [S29](#source-s29)、[S24](#source-s24) |
| [s22-ankle-mobility](https://yichenluan.github.io/snowboard-guide/#lesson=s22-ankle-mobility) | 扶墙拉伸小腿：后脚跟踩地，慢慢前移：保持脚踝稳定，在舒适范围内拉伸并返回。 | 1. `ankle-mobility` | [S28](#source-s28)、[S24](#source-s24) |
| [s22-shoulder](https://yichenluan.github.io/snowboard-guide/#lesson=s22-shoulder) | 肩绕环热身：肩膀画小圈，手臂放松：轻松活动肩部，分清肩绕环与摆臂。 | 1. `dry-shoulder-rolls` | [S33](#source-s33) |
| [s22-warmup](https://yichenluan.github.io/snowboard-guide/#lesson=s22-warmup) | 上雪前热身：先活动全身，再试两刃控制：让身体逐渐进入状态，确认当天能可靠控速和换刃。 | 1. `dry-shoulder-rolls`<br>2. `dry-squat`<br>3. `dry-wall-edge`<br>4. `short-turns:round:extend` | [S33](#source-s33)、[S24](#source-s24)、[S09](#source-s09) |
| [v-heel-highback-setting](https://yichenluan.github.io/snowboard-guide/#lesson=v-heel-highback-setting) | 高背板前倾：反应更快，也要能屈伸：找到后刃容易控制、双腿仍能自然活动的设置。 | 正文保留，无动作图 | [S20](#source-s20)、[S16](#source-s16)、[S06](#source-s06) |
| [v23-highback](https://yichenluan.github.io/snowboard-guide/#lesson=v23-highback) | 雪靴与高背板：先穿稳、扣好，再调响应：减少松动和无效空隙，让脚下动作能及时传到雪板。 | 正文保留，无动作图 | [S20](#source-s20)、[S32](#source-s32) |
| [v23-width](https://yichenluan.github.io/snowboard-guide/#lesson=v23-width) | 站距：先从舒适屈伸开始：用舒适度和两刃控制比较站距，保留可恢复的设置。 | 正文保留，无动作图 | [S20](#source-s20)、[S31](#source-s31)、[S16](#source-s16) |
| [v23-angles](https://yichenluan.github.io/snowboard-guide/#lesson=v23-angles) | 固定器角度：鸭式、正零和双正怎么选：读懂角度并找到舒适、可控的设置，不照搬他人的数字。 | 交互：`binding-stance` → D7 | [S19](#source-s19)、[S32](#source-s32)、[S16](#source-s16) |
| [v23-knees](https://yichenluan.github.io/snowboard-guide/#lesson=v23-knees) | 膝盖怎么走：顺着脚的自然方向屈伸：在穿靴、扣板后仍能舒适屈伸和调刃。 | 1. `dry-squat` | [S16](#source-s16)、[S25](#source-s25)、[S29](#source-s29) |
| [s23-boot-centering](https://yichenluan.github.io/snowboard-guide/#lesson=s23-boot-centering) | 雪靴居中与拖靴：两边都要留够空间：分清靴配合、横向居中和整套后移，找出可能的拖靴限制。 | 交互：`boot-clearance` → D7 | [S20](#source-s20)、[S32](#source-s32) |
| [v24-heel-edge](https://yichenluan.github.io/snowboard-guide/#lesson=v24-heel-edge) | 后刃摔倒怎么查：被绊住，还是板滑走：用低风险的小动作验证原因，不反复重现摔倒。 | 1. `heel-edge` | [S16](#source-s16)、[S10](#source-s10)、[S26](#source-s26) |
| [v24-heel-pivot](https://yichenluan.github.io/snowboard-guide/#lesson=v24-heel-pivot) | 开肩后板尾乱甩：查刃角、前后平衡和转肩：找出板尾最早偏转的阶段，再一次只改一个原因。 | 1. `shoulder-coordination` | [S16](#source-s16)、[S26](#source-s26) |
| [v24-heel-transition](https://yichenluan.github.io/snowboard-guide/#lesson=v24-heel-transition) | 后刃换前刃总是慢：先看旧刃放开没有：减少换刃中的无效等待，不靠投肩或猛扭身体。 | 1. `edge-change-up` | [S17](#source-s17)、[S16](#source-s16)、[S26](#source-s26) |
| [v24-toe-unstable](https://yichenluan.github.io/snowboard-guide/#lesson=v24-toe-unstable) | 前刃站不稳：别只顾往前趴：用小幅前刃单弯恢复抓地和放刃，再查失稳来源。 | 1. `toe-edge` | [S16](#source-s16)、[S10](#source-s10)、[S26](#source-s26) |
| [v24-rear-load](https://yichenluan.github.io/snowboard-guide/#lesson=v24-rear-load) | 前刃后腿特别累：查位置，也查活动是否受限：减掉单腿硬撑，同时保留板头引导与板尾跟随。 | 1. `fore-aft` | [S16](#source-s16)、[S26](#source-s26) |
| [v24-skid-track](https://yichenluan.github.io/snowboard-guide/#lesson=v24-skid-track) | 想刻滑却扫尾：先找轨迹从哪里变宽：用一个容易的单弧验证原因，再连接两侧。 | 1. `rail-track` | [S16](#source-s16)、[S10](#source-s10)、[S26](#source-s26) |
| [v-heel-two-run-claim](https://yichenluan.github.io/snowboard-guide/#lesson=v-heel-two-run-claim) | 什么时候升级：能重复、能结束、自然滑也能用：给一个目标写清通过标准，用结果决定是否升级。 | 正文保留，无动作图 | [S16](#source-s16)、[S26](#source-s26) |
| [v21-method](https://yichenluan.github.io/snowboard-guide/#lesson=v21-method) | 怎么安排练习：先滑一遍，拆一项，再自然滑：把一个滑行问题写成能执行、能比较的短组练习。 | 1. `rail-track` | [T01](#source-t01)、[S26](#source-s26) |
| [v21-linear](https://yichenluan.github.io/snowboard-guide/#lesson=v21-linear) | 动作时机：什么时候开始，什么时候停：能调整一段屈伸的时机与速度，同时保持圆弯。 | 1. `pressure-extend:timing-study` | [S16](#source-s16)、[T01](#source-t01)、[S26](#source-s26) |
| [v3-index](https://yichenluan.github.io/snowboard-guide/#lesson=v3-index) | 进阶怎么选课：两条主线与并行能力：根据当前问题和前置能力，选一项值得练的内容。 | 正文保留，无动作图 | [S16](#source-s16)、[T01](#source-t01)、[T02](#source-t02)、[T03](#source-t03)、[S26](#source-s26) |

## 现有资料索引

以下读取自 content.json；日期、版本、定位属于原资料记录，本次盘点不重新验证外部页面。每课具体依据及引用范围见 JSON 的 lessons[].citations。

<a id="source-s01"></a>

- **S01** [单板六项基本原则](https://thesnowpros.org/2021/01/8840/)（PSIA-AASI）。沿板长、跨板宽与压力大小，板体倾斜、枢转和扭转构成通用板控分类。

<a id="source-s02"></a>

- **S02** [Learning Connection 与各项目基本原则](https://thesnowpros.org/wp-content/uploads/2025/01/PSIA-AASI_LearningConnection_and_Discipline-Specific_Fundamentals_2023-compressed-2.pdf)（PSIA-AASI）。单板内容 PDF p.8

<a id="source-s03"></a>

- **S03** [Level 1 Course Guide](https://members.casi-acms.com/documents/LEVEL%201%20COURSE%20GUIDE_EN.pdf)（CASI）。印刷 p.7–9

<a id="source-s16"></a>

- **S16** [Reference Guide：技能、练习、人体与装备](https://members.casi-acms.com/documents/Ref_Guide.pdf)（CASI）。以印刷页码定位；本文件与PDF页码对应；兼容别名：S04、S05

<a id="source-s06"></a>

- **S06** [Snowboard Instructor Manual](https://www.nzsia.org/wp-content/uploads/2017/06/SBINZ_Manual_2017.pdf)（NZSIA / SBINZ）。章名与印刷分区页码在各条目注明；兼容别名：S07、S08

<a id="source-s09"></a>

- **S09** [Detailed Instructor Info：Snowboard Fundamentals](https://www.nzsia.org/wp-content/uploads/2018/05/Detailed-instructor-info-Fundamentals-Snowboard-Levels.pdf)（NZSIA / SBINZ）。按能力递进：基础滑行、停止、横切、单弯、连弯、刻滑与地形适应。

<a id="source-s10"></a>

- **S10** [Snowboard Performance Guide](https://thesnowpros.org/wp-content/uploads/2025/01/SB_snowboard_performance_PG-nov2022.pdf)（PSIA-AASI）。每项必须结合任务级别阅读，不把一行表格推广到所有滑行。

<a id="source-s11"></a>

- **S11** [Snowboard Level Three](https://www.nzsia.org/snowboard/snowboard-level-three-new/)（NZSIA / SBINZ）。现行高级任务承认屈曲与伸展两种换刃策略。

<a id="source-s15"></a>

- **S15** [AASI Snowboard National Standards](https://thesnowpros.org/wp-content/uploads/2025/10/AASI_Snowboard_Standards0224_updated_100325_v3.pdf)（PSIA-AASI）。链接文件名仍带旧日期，版本以本轮读取正文为准。

<a id="source-s17"></a>

- **S17** [The Critical Link](https://casi-acms.com/casi-blog/the-critical-link/)（CASI / Simon Holden）。换弯处重新居中，受控进入新刃；避免把身体猛投进弯内等待板追上。

<a id="source-s18"></a>

- **S18** [Your Responsibility Code](https://www.nsaa.org/nsaa/safety/)（NSAA）。控速、前下方优先、可见停车与进入雪道前观察等路线原则。

<a id="source-s19"></a>

- **S19** [Snowboard Stance Angles Explained](https://www.burton.com/en-au/blogs/the-burton-blog/snowboard-stance-angles)（Burton Guides）。鸭式、正/零与双正站姿的用途与个体舒适差异，不给唯一正确角度。

<a id="source-s20"></a>

- **S20** [How to Adjust Snowboard Bindings](https://www.burton.com/en-au/blogs/the-burton-blog/how-to-adjust-snowboard-bindings)（Burton Guides）。靴居中、背板、站距与前倾逐步调节；必须按实际装备测试。

<a id="source-s21"></a>

- **S21** [10 Tips from the Snow Pros to Get in Shape](https://thesnowpros.org/2017/10/10-tips-from-the-snow-pros-to-get-in-shape/)（PSIA-AASI）。按目标组合力量、平衡与有氧，自重深蹲是可用体能基础。

<a id="source-s22"></a>

- **S22** [National Team Off-season Training](https://thesnowpros.org/2025/06/psia-aasi-national-team-offseason-sports-workouts/)（PSIA-AASI）。AASI队员的非雪训练实例，展示力量、有氧与多种运动怎样支持滑行能力和全天体力。

<a id="source-s24"></a>

- **S24** [How to Increase Flexibility Safely](https://www.hss.edu/health-library/move-better/how-to-increase-flexibility)（HSS Rehabilitation）。医院物理治疗的一般教育内容。

<a id="source-s25"></a>

- **S25** [Bodyweight Squat](https://www.acefitness.org/resources/everyone/exercise-library/135/bodyweight-squat/)（American Council on Exercise）。不是滑雪刃上姿势的逐帧模板。

<a id="source-s26"></a>

- **S26** [Movement Analysis: Connection and Confidence](https://thesnowpros.org/2026/05/movement-analysis-a-tool-for-connection-and-confidence/)（PSIA-AASI / Josh Smith）。用雪板响应、轨迹和学习者目标观察动作，反馈一次选一个可管理提示。

<a id="source-s27"></a>

- **S27** [Front Plank](https://www.acefitness.org/resources/everyone/exercise-library/32/front-plank/)（American Council on Exercise）。肘在肩下、躯干稳定、继续呼吸，避免塌腰。

<a id="source-s28"></a>

- **S28** [Ankle Stretches and Exercises for Strength](https://www.hss.edu/health-library/move-better/ankle-stretches-exercises)（HSS / Kimberly Baptiste-Mbadiwe, PT）。伤后症状需要个别评估；本页不设计康复处方。

<a id="source-s29"></a>

- **S29** [Stretches and Exercises to Strengthen Your Knees](https://www.hss.edu/health-library/move-better/exercises-strengthen-knees)（HSS / Mohammad Saad, PT）。辅助活动与力量内容，不由它保证滑雪效果。

<a id="source-s31"></a>

- **S31** [Goofy vs. Regular: Stance Guide](https://www.burton.com/en-us/blogs/the-burton-blog/goofy-vs-regular)（Burton Guides）。参考站距、前脚判断与角度的个体化测试。

<a id="source-s32"></a>

- **S32** [How to Mount Snowboard Bindings](https://www.burton.com/en-us/blogs/the-burton-blog/how-to-mount-snowboard-bindings)（Burton Guides）。站距、角度、靴配合与安装后复查；数字设定只是起点。

<a id="source-s33"></a>

- **S33** [How to Warm Up Before Exercising](https://www.nhs.uk/live-well/exercise/how-to-warm-up-before-exercising/)（NHS）。不是肩部伤病康复处方。

<a id="source-f01"></a>

- **F01** [Customised Snowboard Technique from Sweden](https://interski.nzsia.org/2019/03/19/customised-snowboard-technique-from-sweden/)（NZSIA / SBINZ Interski）。Our Reflections：platform angle 与踝部调刃示例

<a id="source-t01"></a>

- **T01** [Level 3 Teaching Module：进阶任务、回收与反向旋转](https://members.casi-acms.com/documents/TeachingModule_LEVEL%203%20COURSE%20GUIDE-EN.pdf)（CASI）。使用印刷页码；p.10–15

<a id="source-t02"></a>

- **T02** [Carving Instructor：刻滑专项路径](https://casi-acms.com/courses/carving-instructor/)（CASI）。Course Overview / Am I Ready / FAQ

<a id="source-t03"></a>

- **T03** [Park 1 Instructor：公园与花式递进路径](https://casi-acms.com/courses/park-1-instructor/)（CASI）。Course Overview / Pre Req / FAQ

<a id="source-a01"></a>

- **A01** [University Physics Volume 1：Newton’s Laws，电梯秤示例](https://openstax.org/books/university-physics-volume-1/pages/6-1-solving-problems-with-newtons-laws)（OpenStax / Rice University）。Example：Bathroom Scale in an Elevator，Figure 6.5 / F_s=ma+mg

<a id="source-a02"></a>

- **A02** [Level 2 Course Guide：Rider Improvement](https://members.casi-acms.com/documents/LEVEL%202%20COURSE%20GUIDE-EN.pdf)（CASI）。Rider Improvement Presentation，第12页，Turning with the Lower Body

<a id="source-a03"></a>

- **A03** [二级教练课程指南：小回转观察要点（中英对照）](https://members.casi-acms.com/documents/Level%202%20translated%207%20Days%20Course%20Guide.pdf)（CASI）。印刷 p.9，小回转评估；p.12，膝脚引导与居中转向

<a id="source-s34"></a>

- **S34** [Optimise cancer prehabilitation：Plank on knees / Plank](https://www.nth.nhs.uk/resources/optimise-cancer-prehabilitation/)（North Tees and Hartlepool NHS Foundation Trust）。Plank on knees / Plank


## 输入指纹

| 文件 | SHA-256 |
| --- | --- |
| content.json | 8d5479f8d3dca7649421e45defaf7af886d722d58e7234c1b44302628fb12c9b |
| animations.js | baa823eabfeeca3e0f0b29894d978605057922d374e7daf48a464de6c6126078 |
| app.js | ac075d1d68ed8bd8625e66dc8516b6568cdf8a8fdacb840c4b1335ed0a488c67 |
| lesson-player/registry.json | 68634051330af6ff865653cb001726785bb0ef2bec3a0a702c4d8de9c5733224 |

