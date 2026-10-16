# 全站动画与交互示意清单

由 `node scripts/inventory-animations.mjs` 生成。不要直接编辑此文件；迁移分类与人工验收说明维护在脚本，课程用途、配置和资料维护在原有源码。`node scripts/inventory-animations.mjs --check` 可检查清单是否与源码同步。完整配置、逐课资料定位和 claim 见 [JSON 清单](animation-inventory.json)。

**当前课程动画接入：150/150。** 当前引用均由课内三维播放器接管，旧播放器引用为 0。另有 2 项装备交互保留二维。下文的旧模型与共享关键帧是来源盘点，不代表当前渲染。接入数量不代表教学认证或发布完成；实际观察与边界见 [课程播放器审阅](lesson-player-review.md)。

## 数量与口径

| 项目 | 数量 | 含义 |
| --- | --- | --- |
| 课程 / 模块 | 118 / 13 | 稳定课程 ID 与导航单元；不等于独立动画 |
| 含动画的课程 | 102 | 按 app.js：非空 demos 优先，否则 demo |
| 迁移范围内的动画引用 | 150 | 每个课程内每个可选示意各计 1 次，可重复引用同一模型 |
| 装备交互图 | 2 | app.js 的 binding-stance 与 boot-clearance；非 SnowDemo 动画 |
| 已独立审阅的装备图 | 2 | 保留二维；来源、几何与实际交互范围见 lesson-equipment-review.md |
| 主站显示的示意总数 | 152 | 课程动画引用 + 装备图；不额外把独立 3D 链接计入 |
| 无动作/装备图课程 | 14 | 原理与方法仍有正文，不应为凑全 3D 强制补动画 |
| 注册 / 当前有引用的类型 | 41 / 38 | 按旧预设与课内注册表并集盘点；不等于当前三维模块数 |
| 应用变体键 | 80 | type:variant:transition；与错误卡 demoKey 的匹配口径一致 |
| 展示配置组合 | 104 | 去掉 title/focus/steps/autoplay/duration 后按字段去重；仍含视角/图层，不等于独立动作 |
| 旧小回转声明变体 | 16 | animations.js 中 3 个类型共享 shortState；当前实现按独立任务和过渡方式接入，不以旧声明推定支持组合 |
| 3D 模式 / 课程入口 | 3 / 3 | 首页已移除独立入口；三种模式共享 motion.ts 状态与 scene.tsx 场景 |
| 课内三维类型 / 引用 | 39 / 150 | 按注册表已切换默认渲染；不代表教学认证 |
| 类型注册 / 变体白名单接入类型 | 36 / 3 | 3 个 partial 类型仅支持列明变体；其当前课程引用均已接入，未引用的其他变体不支持；类型注册也仍受 task 门控 |
| 当前使用旧播放器的引用 | 0 | 按逐引用 renderer 统计；保留旧源码不等于仍有旧播放器引用 |

## 旧实现来源的共享关系与当前接入

以下 4 条路径由 animations.js 旧生成器提取，用于追溯迁移来源；不是当前课内三维的实现架构。引用数表示这些旧预设在课程配置中的对应数量。当前接入以 renderer／task 和逐引用去向为准，同一动作在不同课程的文案、阶段提示与前提仍须逐条核对。

| 旧来源模型／辅助图 | 旧注册类型 / 当前引用数 | 旧来源与当前实现的边界 |
| --- | --- | --- |
| 雪上关键帧 + 双腿 IK | 26 / 80 | 旧 sample / skeleton / sceneBody 与另画的 sceneTrack；当前三维与平面骨架从同一动作状态投影 |
| 小回转共享时序/轨迹 + 双腿 IK | 3 / 34 | 旧 shortRaw / shortState → skeleton；当前小回转由独立任务编排，不能用旧共享关系推定动作相同 |
| 离雪站立关节模型 | 4 / 12 | 旧 skeleton + sceneBody；当前离雪任务使用独立普通鞋模型和任务接触约束 |
| 离雪侧面专用模型 | 4 / 8 | 旧 sceneDry；当前平板、小腿、髋和腘绳肌任务各自保留地面任务语义 |
| 原生三维独立任务（无旧预设） | 4 / 16 | 旧 sceneDry；当前平板、小腿、髋和腘绳肌任务各自保留地面任务语义 |
| 压力阶段图 | 4 | 旧来源为 scenePressure；当前保留必要二维时间图，不能解释成实测压力 |
| 装备交互 | 2 | app.js mountIllustration；保留 2D 几何表达与型号限制 |

旧 animations.js 的 `pedalling` 与 `twist` 共享 keyframes / steps。当前 `pedalling` 没有课程引用，`twist` 的两个引用使用局部板面扭转任务，不能再把旧共享关键帧当作当前实现。其他类型也不凭名称强行合并。

分批去向：D1 中立/屈伸/前后平衡；D2 两刃非对称站姿和成角；D3 转向/滑移/旋转；D4 压力与换刃；D5 连弯及各纠错变体；D6 离雪专项；D7 装备与概念图。共用装备和骨长约束，姿态、时序、路线与末态按任务独立审阅。

## 入口、发布与离线约束

- 课程入口：`/#lesson=<稳定 ID>`；同课多示意由 `data-demo` 按索引切换，`showDemo` 先 destroy 再 mount，每次只挂载当前选中的播放器。下方逐项 ID 的 `/N` 表示同课第 N 个按钮，并非额外 URL 路由。
- 纠错按钮按 `type:variant:transition` 匹配；`path`、`turnShape`、`edgeSide` 等不在键中。必须保留所有实际配置，不能只按 demoKey 合并。
- `build.py` 把 content.json、animations.js、app.js、progression.js 和样式内联到两个相同的 HTML；保留稳定课程 ID、GitHub 公开评论以及本机收藏、个人补充、skillProgress / skillTarget。页面已移除备份、保存网页和导入入口。
- 课内三维 IIFE、样式与课程数据直接内联进单文件，无运行时外部模型、字体或 CDN；无 WebGL 时显示同源可播放骨架。独立 `/3d/` 原型及外部资料仍需联网。单文件重开验证与浏览器限制见审阅记录。
- 首页技术全景、能力 DAG 与 shell.html 的装饰人物没有动作时间线，不计入上述动作/装备示意数量；它们的入口和能力前置关系仍属于回归范围。

| 独立 3D 原型的来源课程 | 原型模式 | 与课内入口的关系 |
| --- | --- | --- |
| [s-short-integrated](https://jinke.me/snowboard/#lesson=s-short-integrated) | [correct](https://jinke.me/snowboard/3d/?mode=correct) | 并行研究原型；不替代当前课内独立任务，也不额外计入引用覆盖 |
| [s-short-diagnosis](https://jinke.me/snowboard/#lesson=s-short-diagnosis) | [error](https://jinke.me/snowboard/3d/?mode=error) | 并行研究原型；不替代当前课内独立任务，也不额外计入引用覆盖 |
| [s-short-sideslip](https://jinke.me/snowboard/#lesson=s-short-sideslip) | [drill](https://jinke.me/snowboard/3d/?mode=drill) | 并行研究原型；不替代当前课内独立任务，也不额外计入引用覆盖 |

## 异常和需人工审阅的差异

| 级别 | 类型 | 详情 |
| --- | --- | --- |
| info | unused-preset | absorption 已注册但没有课程引用；保留，不能视作已完成迁移 |
| info | unused-preset | pedalling 已注册但没有课程引用；保留，不能视作已完成迁移 |
| info | unused-preset | duck-carve 已注册但没有课程引用；保留，不能视作已完成迁移 |

- **共享姿态风险：** 旧小回转 `shortState` 默认使用 `hipY = edge × .64`、`shoulderY = edge × .35`，两刃为同号系数镜像；这不是可靠的前后刃非对称姿态依据，不直接拷入新原型或其他课。
- **旧多视图风险：** 旧 `sceneBody` 使用 IK，`sceneTrack` 按比例另构膝/髋/肩；旧视图看似一致不能证明解剖关系一致。当前课内三维与平面骨架使用同一动作状态，具体画面审阅另记。
- **旧任务复用风险：** 旧生成器曾将热身屈伸、深蹲、穿靴扣板准备及静态调刃套入共享预设。当前课程配置已按任务区分；旧预设名称与关键帧只作来源索引，不能替代当前正文和 task 的对应检查。
- **诊断不是病因证明：** 独立 `/3d/` 原型的 error 模式只覆盖其自身反例；课内小回转排错有独立任务，不能用一个原型模式推定全部反例已审阅，也不能把姿态对照当成真实病因证明。
- **资料粒度：** 现有 citations 挂在课程上；动画注释还有通用资料，但没有每个关节参数/时间点的实拍标定。下表来源是现有声明的索引，不表示已重新读取或认可所有姿态。

## 迁移验收卡（每个教学任务与变体分别填写）

每项记录四类状态：证据待核/已核，动作关系待审/已审，画面可读性待看/已看，交互待测/已测。只有四项完成且没有阻断缺陷才可替换；自动测试只覆盖其中可计算的几何/状态约束。

1. **证据与任务：** 写清学习者前提、地形/速度/装备范围、目标板表现；记录机构一手资料页码/章节及实际视频时间点，分别列出直接支持、推导与未知。资料只支持定性关系时不编造关节角、肌肉用力或压力百分比。
2. **两刃与两向过渡：** 每种前脚方向检查后刃保持、后→前释放/放平/新刃建立、前刃保持、前→后全过程；分别检验踝相对靴底、靴筒、高背接触、膝朝脚向、髋空间、躯干相对骨盆关系。不能把雪板整体滚转算成靴内踝活动，也不能只取峰值一帧。
3. **板表现与时序：** 板轴、实际移动方向、工作刃、滑移、路线与阶段文案同步；侧滑先解除会造成抓刃的关系再换侧；腿长变化不等于压力大小。动作提示、身体位移箭头、外力箭头分别标清。
4. **多视角审阅：** 实体和骨架并看；沿板宽、沿板长、斜前/斜后、俯视检查暂停关键帧及完整慢放。检查穿插、固定脚位、骨段长度、循环/100% 末态、模式同进度切换，保留可追溯截图/录像与具体缺陷记录。
5. **错误对照边界：** 每个反例只故意改变要观察的变量；不能为突出错误制造不可达关节。按当前引用逐项保留任务语义；未引用、未支持的预设不算已接入，不能用一个 error 模式吞掉全部反例。
6. **交互、离线与数据：** 旋转/缩放、预设复位、播放后保留观察角、拖进度、速度、模式、regular/goofy、触控滚动/旋转、键盘与窄屏、WebGL 不可用的正文降级；进出课释放画布；刷新及发布更新后仍可读取同一浏览器中的收藏、学习进度和个人补充。
7. **替换与发布：** 按本清单的引用 ID 对勾，说明旧用途与新入口映射；小批量独立提交且可 revert；对应提交 Pages 部署成功后在线复看。报告实际看过的模式/阶段和未解决项，不把测试数量当教学准确率。

## 模块覆盖

| 模块 | 课程 | 当前动画引用 | 装备图 | 无图课程 |
| --- | --- | --- | --- | --- |
| 进阶学习地图 | 4 | 0 | 0 | 4 |
| 站姿与重心 | 6 | 6 | 0 | 0 |
| 立刃与放刃 | 12 | 13 | 0 | 1 |
| 内倾与反弓 | 5 | 6 | 0 | 0 |
| 控压与屈伸时机 | 10 | 12 | 0 | 0 |
| 换刃与下肢引导 | 10 | 14 | 0 | 0 |
| 旋转协调与反脚 | 13 | 17 | 0 | 0 |
| JSBA 刻滑 · 弧线、屈伸与低姿态八字 | 16 | 18 | 0 | 2 |
| CASI 小回转 · 通向四级专家板控 | 13 | 35 | 0 | 2 |
| 热身与体能 | 13 | 20 | 0 | 0 |
| 装备与舒适站姿 | 6 | 1 | 2 | 3 |
| 滑行问题诊断 | 6 | 6 | 0 | 0 |
| 练习设计与长期进阶 | 4 | 2 | 0 | 2 |

## 旧注册类型来源与当前引用接入（包含未引用预设）

| 类型 | 旧预设名称 | 旧共享模型 | 当前引用 / 键数 | 当前接入 |
| --- | --- | --- | --- | --- |
| `center-low` | 降低重心：屈踝、屈膝、屈髋 | 雪上关键帧 + 双腿 IK | 1 / 1 | 1/1 个当前课程引用已接入课内 3D；实际支持范围仍按 task／变体门控；逐引用去向见下表 |
| `center-high` | 可活动的中立姿态 | 雪上关键帧 + 双腿 IK | 4 / 2 | 4/4 个当前课程引用已接入课内 3D；实际支持范围仍按 task／变体门控；逐引用去向见下表 |
| `fore-aft` | 沿板长的平衡与压力调整 | 雪上关键帧 + 双腿 IK | 7 / 4 | 7/7 个当前课程引用已接入课内 3D；实际支持范围仍按 task／变体门控；逐引用去向见下表 |
| `toe-edge` | 前刃：用关节逐渐立刃 | 雪上关键帧 + 双腿 IK | 6 / 1 | 6/6 个当前课程引用已接入课内 3D；实际支持范围仍按 task／变体门控；逐引用去向见下表 |
| `heel-edge` | 后刃：髋膝踝协调，不折腰坐尾 | 雪上关键帧 + 双腿 IK | 6 / 1 | 6/6 个当前课程引用已接入课内 3D；实际支持范围仍按 task／变体门控；逐引用去向见下表 |
| `absorption` | 屈曲吸收：腿变短，身体更平顺 | 雪上关键帧 + 双腿 IK | 0 / 0 | 旧预设保留作来源盘点；当前没有课程引用，不计入已接入引用 |
| `pressure-extend` | 伸展调压：有节奏地屈伸双腿 | 雪上关键帧 + 双腿 IK | 4 / 3 | 4/4 个当前课程引用已接入课内 3D；仅支持列明变体 phase-study、heel、timing-study，未引用的其他变体不在接入范围；逐引用去向见下表 |
| `pressure-flex` | 屈曲的两个阶段：开始下蹲与停住下落 | 雪上关键帧 + 双腿 IK | 3 / 2 | 3/3 个当前课程引用已接入课内 3D；仅支持列明变体 phase-study、toe，未引用的其他变体不在接入范围；逐引用去向见下表 |
| `inclination` | 内倾与反弓的配合 | 雪上关键帧 + 双腿 IK | 4 / 4 | 4/4 个当前课程引用已接入课内 3D；实际支持范围仍按 task／变体门控；逐引用去向见下表 |
| `edge-change-up` | 伸展式换刃：旧刃 → 回到居中位置 → 新刃 | 雪上关键帧 + 双腿 IK | 5 / 1 | 5/5 个当前课程引用已接入课内 3D；实际支持范围仍按 task／变体门控；逐引用去向见下表 |
| `edge-change-down` | 回收式换刃：屈腿让板从身下通过 | 雪上关键帧 + 双腿 IK | 3 / 2 | 3/3 个当前课程引用已接入课内 3D；仅支持列明变体 lower-com、retraction-study，未引用的其他变体不在接入范围；逐引用去向见下表 |
| `steering` | 脚、膝、髋渐进引导雪板转向 | 雪上关键帧 + 双腿 IK | 7 / 1 | 7/7 个当前课程引用已接入课内 3D；实际支持范围仍按 task／变体门控；逐引用去向见下表 |
| `shoulder-coordination` | 视线、肩髋与下肢协调 | 雪上关键帧 + 双腿 IK | 7 / 5 | 7/7 个当前课程引用已接入课内 3D；实际支持范围仍按 task／变体门控；逐引用去向见下表 |
| `garland` | 花环练习：同一刃、重复释放与建刃 | 雪上关键帧 + 双腿 IK | 2 / 2 | 2/2 个当前课程引用已接入课内 3D；实际支持范围仍按 task／变体门控；逐引用去向见下表 |
| `j-turn` | J 形转弯：短直滑 → 单一圆弧 → 横坡 | 雪上关键帧 + 双腿 IK | 2 / 1 | 2/2 个当前课程引用已接入课内 3D；实际支持范围仍按 task／变体门控；逐引用去向见下表 |
| `rail-track` | 浅弧刃滑：让板尾跟随板头 | 雪上关键帧 + 双腿 IK | 4 / 1 | 4/4 个当前课程引用已接入课内 3D；实际支持范围仍按 task／变体门控；逐引用去向见下表 |
| `gaze-control` | 头部观察与肩髋控制：转头不甩板 | 雪上关键帧 + 双腿 IK | 1 / 1 | 1/1 个当前课程引用已接入课内 3D；实际支持范围仍按 task／变体门控；逐引用去向见下表 |
| `hip-edge-change` | 髋引导换刃：保持踝膝协调 | 雪上关键帧 + 双腿 IK | 3 / 2 | 3/3 个当前课程引用已接入课内 3D；实际支持范围仍按 task／变体门控；逐引用去向见下表 |
| `knee-edge-change` | 用膝盖的移动体会换刃：小幅、渐进、协调 | 雪上关键帧 + 双腿 IK | 1 / 1 | 1/1 个当前课程引用已接入课内 3D；实际支持范围仍按 task／变体门控；逐引用去向见下表 |
| `retraction-turns` | 回收式连续转弯：屈曲换刃、弯内伸展 | 雪上关键帧 + 双腿 IK | 2 / 1 | 2/2 个当前课程引用已接入课内 3D；实际支持范围仍按 task／变体门控；逐引用去向见下表 |
| `twist`（旧同帧：pedalling） | 扭板：前后脚不同刃角的协调 | 雪上关键帧 + 双腿 IK | 2 / 1 | 2/2 个当前课程引用已接入课内 3D；实际支持范围仍按 task／变体门控；逐引用去向见下表 |
| `rotation` | 同向协调旋转：下肢引导、上身跟进 | 雪上关键帧 + 双腿 IK | 2 / 1 | 2/2 个当前课程引用已接入课内 3D；实际支持范围仍按 task／变体门控；逐引用去向见下表 |
| `counter-rotation` | 反向旋转：特定任务的短时分离 | 雪上关键帧 + 双腿 IK | 2 / 1 | 2/2 个当前课程引用已接入课内 3D；实际支持范围仍按 task／变体门控；逐引用去向见下表 |
| `switch` | 反脚滑行：原后脚变成前脚 | 雪上关键帧 + 双腿 IK | 1 / 1 | 1/1 个当前课程引用已接入课内 3D；实际支持范围仍按 task／变体门控；逐引用去向见下表 |
| `dry-squat` | 离雪自重深蹲：髋膝协调、全脚掌支撑 | 离雪站立关节模型 | 6 / 2 | 6/6 个当前课程引用已接入课内 3D；实际支持范围仍按 task／变体门控；逐引用去向见下表 |
| `dry-plank` | 离雪前平板支撑：肘在肩下、躯干一线 | 离雪侧面专用模型 | 2 / 1 | 2/2 个当前课程引用已接入课内 3D；实际支持范围仍按 task／变体门控；逐引用去向见下表 |
| `dry-calf-raise` | 离雪提踵：抬脚跟、缓慢下放 | 离雪站立关节模型 | 2 / 1 | 2/2 个当前课程引用已接入课内 3D；实际支持范围仍按 task／变体门控；逐引用去向见下表 |
| `dry-wall-edge` | 离雪扶墙前刃体感：踝膝髋协调 | 离雪站立关节模型 | 2 / 1 | 2/2 个当前课程引用已接入课内 3D；实际支持范围仍按 task／变体门控；逐引用去向见下表 |
| `ankle-mobility` | 扶墙小腿伸展：后脚跟留在地面 | 离雪侧面专用模型 | 2 / 1 | 2/2 个当前课程引用已接入课内 3D；实际支持范围仍按 task／变体门控；逐引用去向见下表 |
| `hip-mobility` | 半跪拉伸髋前侧：骨盆控制、躯干直立 | 离雪侧面专用模型 | 2 / 1 | 2/2 个当前课程引用已接入课内 3D；实际支持范围仍按 task／变体门控；逐引用去向见下表 |
| `dry-hamstring` | 仰卧活动大腿后侧（腘绳肌）：托腿、慢伸膝 | 离雪侧面专用模型 | 2 / 1 | 2/2 个当前课程引用已接入课内 3D；实际支持范围仍按 task／变体门控；逐引用去向见下表 |
| `mixed-rotation` | 肩部节奏组合：前刃反拧 → 回到居中位置 → 后刃协调 | 雪上关键帧 + 双腿 IK | 1 / 1 | 1/1 个当前课程引用已接入课内 3D；实际支持范围仍按 task／变体门控；逐引用去向见下表 |
| `dry-shoulder-rolls` | 离雪肩部绕环：放松双臂、小幅活动 | 离雪站立关节模型 | 2 / 1 | 2/2 个当前课程引用已接入课内 3D；实际支持范围仍按 task／变体门控；逐引用去向见下表 |
| `pedalling`（旧同帧：twist） | 踩踏式协调：前后脚逐步配合 | 雪上关键帧 + 双腿 IK | 0 / 0 | 旧预设保留作来源盘点；当前没有课程引用，不计入已接入引用 |
| `short-turns` | 普通搓雪小回转：圆弯、持续引导 | 小回转共享时序/轨迹 + 双腿 IK | 20 / 11 | 20/20 个当前课程引用已接入课内 3D；实际支持范围仍按 task／变体门控；逐引用去向见下表 |
| `short-turn-progression` | 侧滑接单个换刃弯 | 小回转共享时序/轨迹 + 双腿 IK | 9 / 6 | 9/9 个当前课程引用已接入课内 3D；实际支持范围仍按 task／变体门控；逐引用去向见下表 |
| `short-turn-balance` | 双脚居中引导：板头板尾都在转 | 小回转共享时序/轨迹 + 双腿 IK | 5 / 3 | 5/5 个当前课程引用已接入课内 3D；实际支持范围仍按 task／变体门控；逐引用去向见下表 |
| `duck-carve` | duck-carve | 原生三维独立任务（无旧预设） | 0 / 0 | 旧预设保留作来源盘点；当前没有课程引用，不计入已接入引用 |
| `expert-short-turns` | expert-short-turns | 原生三维独立任务（无旧预设） | 2 / 2 | 2/2 个当前课程引用已接入课内 3D；实际支持范围仍按 task／变体门控；逐引用去向见下表 |
| `expert-short-sequence` | expert-short-sequence | 原生三维独立任务（无旧预设） | 2 / 2 | 2/2 个当前课程引用已接入课内 3D；实际支持范围仍按 task／变体门控；逐引用去向见下表 |
| `jsba-carving` | jsba-carving | 原生三维独立任务（无旧预设） | 12 / 6 | 12/12 个当前课程引用已接入课内 3D；实际支持范围仍按 task／变体门控；逐引用去向见下表 |

## 变体键与全部实际配置

每一行按应用实际键分组。配置组合保留 view、jointLabels 等展示字段，便于审查同键不同表现；它们不是多套独立动作。每个引用的完整 steps 与配置在 JSON 中保留。

| 变体键 | 引用 ID | 不同配置数 | 去向 |
| --- | --- | --- | --- |
| `center-low:neutral` | v-base-stance/1 | 1 | D1：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `shoulder-coordination:arms-feedback` | v-arms-feedback/1、v-hand-back-cue/1 | 2 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
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
| `short-turns:round` | v12-rhythm-why/1、s-short-rhythm/1、s-short-diagnosis/1 | 1 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `edge-change-up` | v12-up-drill/1、v-transition-map/1、v-transition-map/3、v15-incline-change/1、v24-heel-transition/1 | 4 | D4：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `edge-change-down:lower-com` | v13-down-drill/1 | 1 | D4：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `edge-change-down:retraction-study` | v13-down-drill/2、v-transition-map/2 | 1 | D4：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `garland:toe` | v14-steering/1 | 1 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `garland:heel` | v14-steering/2 | 1 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `twist` | v14-twist/1、s14-twist-drill/1 | 2 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `gaze-control` | v15-gaze-drill/1 | 1 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `hip-edge-change` | v16-hip-change/1、v16-hip-drill/1 | 2 | D4：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `knee-edge-change` | v17-knee-change/1 | 1 | D4：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `retraction-turns` | v17-retract-drill/1、v19-stable-upper/2 | 1 | D4：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `rotation` | v-shoulder-rhythm-map/1、v18-follow/1 | 1 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `counter-rotation` | v-shoulder-rhythm-map/2、v19-counter/1 | 1 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `short-turns:round:extend` | v-shoulder-rhythm-map/3、v-toe-open-causal/2、v19-stable-upper/1、s-short-integrated/1、s22-warmup/4 | 2 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `shoulder-coordination:neutral` | v-mid-position-30/1、v18-neutral/1 | 1 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `mixed-rotation` | v19-mixed/1 | 1 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `shoulder-coordination:open-heel` | v-heel-open-progression/1 | 1 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `short-turns:asymmetric:extend` | v-toe-open-causal/1 | 1 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `shoulder-coordination:closed-toe` | v-toe-closed-drill/1 | 1 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `switch` | v19-switch/1 | 1 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `rail-track` | v20-carve/2、s20-rails/1、v24-skid-track/1、v21-method/1 | 3 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `j-turn` | v-toe-low-drill/1、s-short-adapt/7 | 2 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `jsba-carving:complete` | s-carve-expert-arc/1 | 1 | D3：独立 JSBA 刻滑六类任务；资料范围见 jsba-technical-source-review.md，动作编排与人工验收另记，不从注册或历史动作继承通过 |
| `short-turns:round:flex` | s-short-integrated/2 | 1 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `short-turns:tail-brake` | s-short-integrated/3、s-short-diagnosis/2 | 1 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `short-turn-progression:side-slip` | s-short-sideslip/1 | 1 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `short-turn-progression:side-slip-shorter` | s-short-sideslip/2 | 1 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `short-turn-progression:linked` | s-short-sideslip/3 | 1 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `short-turn-progression:medium-to-short` | s-short-size-ladder/1、s-short-adapt/2 | 1 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `short-turn-progression:short-steady` | s-short-size-ladder/2、s-short-adapt/1 | 1 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `short-turn-progression:short-to-medium` | s-short-size-ladder/3、s-short-adapt/4 | 1 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `short-turn-balance:centered` | s-short-balance/1 | 1 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `short-turn-balance:nose-pivot` | s-short-balance/2、s-short-diagnosis/8 | 1 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `short-turn-balance:back-seat` | s-short-balance/3、s-short-diagnosis/9 | 1 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `short-turns:asymmetric` | s-short-rhythm/2、s-short-diagnosis/5 | 1 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `short-turns:shoulder-led` | s-short-diagnosis/3 | 1 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `short-turns:edge-locked` | s-short-diagnosis/4 | 1 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `short-turns:low-stuck` | s-short-diagnosis/6 | 1 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `short-turns:round:retract` | s-short-diagnosis/7、s-short-adapt/3 | 1 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `short-turns:over-inclined` | s-short-diagnosis/10 | 1 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `dry-squat` | v22-strength/1、v22-heel-rehearsal/1、v22-squat/1、s22-warmup/2、v23-knees/1 | 4 | D6：独立普通鞋课内 3D；接触、骨架与实体同源，逐任务验收见 lesson-player-review.md |
| `dry-calf-raise` | v22-strength/2、v22-calf/1 | 1 | D6：独立普通鞋课内 3D；接触、骨架与实体同源，逐任务验收见 lesson-player-review.md |
| `dry-plank` | v22-strength/3、v22-plank/1 | 1 | D6：独立普通鞋课内 3D；接触、骨架与实体同源，逐任务验收见 lesson-player-review.md |
| `dry-wall-edge` | v22-wall/1、s22-warmup/3 | 1 | D6：独立普通鞋课内 3D；接触、骨架与实体同源，逐任务验收见 lesson-player-review.md |
| `ankle-mobility` | v22-flexibility/1、s22-ankle-mobility/1 | 1 | D6：独立普通鞋课内 3D；接触、骨架与实体同源，逐任务验收见 lesson-player-review.md |
| `hip-mobility` | v22-flexibility/2、s22-hip-mobility/1 | 1 | D6：独立普通鞋课内 3D；接触、骨架与实体同源，逐任务验收见 lesson-player-review.md |
| `dry-hamstring` | v22-flexibility/3、s22-hamstring/1 | 1 | D6：独立普通鞋课内 3D；接触、骨架与实体同源，逐任务验收见 lesson-player-review.md |
| `dry-squat:hold` | v22-hold/1 | 1 | D6：独立普通鞋课内 3D；接触、骨架与实体同源，逐任务验收见 lesson-player-review.md |
| `dry-shoulder-rolls` | s22-shoulder/1、s22-warmup/1 | 1 | D6：独立普通鞋课内 3D；接触、骨架与实体同源，逐任务验收见 lesson-player-review.md |
| `shoulder-coordination` | v24-heel-pivot/1 | 1 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `pressure-extend:timing-study` | v21-linear/1 | 1 | D4：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `jsba-carving:reference` | s-jsba-basic-carve/1、s-jsba-dynamic-carve/1、s-carve-expert-pressure/1、s-carve-expert-pressure/2、s-jsba-short-carve/1 | 3 | D3：独立 JSBA 刻滑六类任务；资料范围见 jsba-technical-source-review.md，动作编排与人工验收另记，不从注册或历史动作继承通过 |
| `expert-short-turns:progressive` | s-short-expert-steering/1 | 1 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `expert-short-turns:continuous` | s-short-expert-pressure/1 | 1 | D3：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md |
| `expert-short-sequence:planned-recovery` | s-short-expert-flow/1 | 1 | D3：独立有限短弯滑段；任务规格见 level4-short-animation-coverage.md，人工验收范围另记，不从注册或历史动作继承通过 |
| `expert-short-sequence:guided-slide` | s-short-expert-transfer/1 | 1 | D3：独立有限短弯滑段；任务规格见 level4-short-animation-coverage.md，人工验收范围另记，不从注册或历史动作继承通过 |
| `jsba-carving:large-to-short` | s-jsba-size-control/1 | 1 | D3：独立 JSBA 刻滑六类任务；资料范围见 jsba-technical-source-review.md，动作编排与人工验收另记，不从注册或历史动作继承通过 |
| `jsba-carving:normal-dynamic` | s-jsba-duck-mechanics/1 | 1 | D3：独立 JSBA 刻滑六类任务；资料范围见 jsba-technical-source-review.md，动作编排与人工验收另记，不从注册或历史动作继承通过 |
| `jsba-carving:recover` | s-duck-low-linked/1、s-carve-expert-variation/2 | 1 | D3：独立 JSBA 刻滑六类任务；资料范围见 jsba-technical-source-review.md，动作编排与人工验收另记，不从注册或历史动作继承通过 |
| `jsba-carving:low-dynamic` | s-carve-expert-variation/1、s-carve-expert-review/1 | 1 | D3：独立 JSBA 刻滑六类任务；资料范围见 jsba-technical-source-review.md，动作编排与人工验收另记，不从注册或历史动作继承通过 |

## 逐课用途、资料与替换入口

每个引用的 renderer/status 保存在 JSON：lesson-3d 表示默认播放器已接入；legacy-svg 表示仍使用旧播放器，当前数量为 0。status 不自动追踪人工审阅或线上发布，不能代替教学验收。未配动画的课保留正文，不视作漏迁。课程链接打开后，按清单 /N 查看第 N 个示意。

| 课程入口 | 教学用途（原 goal） | 全部示意键（按按钮次序） | 现有资料 |
| --- | --- | --- | --- |
| [v-purpose](https://jinke.me/snowboard/#lesson=v-purpose) | 进阶滑行：先明确自己要练到什么：每次上雪只选一个能看见、能复查的进步目标。 | 正文保留，无动作图 | [S03](#source-s03)、[S15](#source-s15) |
| [v-dimensions](https://jinke.me/snowboard/#lesson=v-dimensions) | 看懂雪板：六个基本控制点：出现失误时，先判断要改哪一项，再选动作。 | 正文保留，无动作图 | [S01](#source-s01)、[S02](#source-s02) |
| [v-progression](https://jinke.me/snowboard/#lesson=v-progression) | 从稳定连弯走向刻滑与搓雪小回转：依据实际短板选择下一步，不按动作外形盲目升级。 | 正文保留，无动作图 | [S09](#source-s09)、[S11](#source-s11) |
| [v-isolate-combine](https://jinke.me/snowboard/#lesson=v-isolate-combine) | 单项练完，怎样用回正常滑行：每项练习都能回答：改了什么，是否有效，能不能用回自然滑行。 | 正文保留，无动作图 | [S15](#source-s15)、[S03](#source-s03) |
| [v-base-stance](https://jinke.me/snowboard/#lesson=v-base-stance) | 基本站姿：站在两脚之间，关节能动：不用先大幅摆臂或扑身找平衡，就能调节立刃、屈伸和进入下一弯。 | 1. `center-low:neutral` | [S16](#source-s16)、[S03](#source-s03)、[S01](#source-s01) |
| [v-arms-feedback](https://jinke.me/snowboard/#lesson=v-arms-feedback) | 双臂作参考：转头观察时别把板带跑：转头观察后仍能维持原路线，不靠固定双臂滑行。 | 1. `shoulder-coordination:arms-feedback` | [S16](#source-s16)、[S03](#source-s03)、[S37](#source-s37) |
| [v-fore-aft-movement](https://jinke.me/snowboard/#lesson=v-fore-aft-movement) | 前后重心：调节两脚承重：能向板头或板尾略移，并顺畅回到两脚都能工作的状态。 | 1. `fore-aft` | [S01](#source-s01)、[S10](#source-s10)、[S16](#source-s16) |
| [v-fore-aft-roles](https://jinke.me/snowboard/#lesson=v-fore-aft-roles) | 转弯时，前脚和后脚怎样配合：找到是哪一段雪板反应不对，不把固定“先压前、再压后”当所有弯的口令。 | 1. `fore-aft:front-center-back` | [S10](#source-s10)、[S16](#source-s16)、[S17](#source-s17) |
| [v-fore-aft-drill](https://jinke.me/snowboard/#lesson=v-fore-aft-drill) | 前—中—后：感受两脚承重变化：知道自己的调整影响了什么，并把夸张的感知动作缩回正常滑行。 | 1. `fore-aft:front-center-back` | [S16](#source-s16) |
| [v-toe-high-low](https://jinke.me/snowboard/#lesson=v-toe-high-low) | 前刃高低站位：蹲得下，也站得起：站高一点和蹲低一点都能控刃，不靠锁膝或折腰。 | 1. `center-high:toe` | [S03](#source-s03)、[S16](#source-s16) |
| [v-active-passive-edge](https://jinke.me/snowboard/#lesson=v-active-passive-edge) | 立刃怎样配合：身体内倾与反弓：能用小动作立刃，并知道加大内倾时要看路线和抓地。 | 1. `inclination:inclination-focused`<br>2. `inclination:angulation-focused` | [S16](#source-s16)、[F01](#source-f01)、[S01](#source-s01)、[S10](#source-s10) |
| [v-toe-static-five](https://jinke.me/snowboard/#lesson=v-toe-static-five) | 原地练前刃，再用单弯验证：每次立刃后都能恢复，并把感觉对应到实际雪痕。 | 1. `toe-edge` | [S06](#source-s06)、[S16](#source-s16) |
| [v-toe-tongue](https://jinke.me/snowboard/#lesson=v-toe-tongue) | 前刃基础：脚跟踩稳，膝髋一起调刃：前刃能渐进立起、稳住，也能按路线慢慢放开。 | 1. `toe-edge`<br>2. `heel-edge` | [S06](#source-s06)、[S16](#source-s16) |
| [v-toe-lock-ankle](https://jinke.me/snowboard/#lesson=v-toe-lock-ankle) | 前刃角度怎么调：膝髋向脚尖侧，脚踝别锁死：刃角稍大后仍能控制路线，并能顺畅进入下一步。 | 1. `toe-edge` | [S06](#source-s06)、[S16](#source-s16) |
| [v-heel-pull](https://jinke.me/snowboard/#lesson=v-heel-pull) | 后刃基础：脚跟踩稳，膝髋保持能动：后刃既能稳住，也能继续屈伸和放开，不靠踢后脚。 | 1. `heel-edge` | [S06](#source-s06)、[S16](#source-s16) |
| [v-heel-static-repetition](https://jinke.me/snowboard/#lesson=v-heel-static-repetition) | 原地练后刃：立得起，也放得下：后刃动作能自主完成，不靠他人拉住或大摆臂。 | 1. `heel-edge` | [S06](#source-s06)、[S16](#source-s16) |
| [v-toe-counterbalance](https://jinke.me/snowboard/#lesson=v-toe-counterbalance) | 前刃反弓：膝髋向脚尖侧，上身不扑向雪面：增加一点前刃角度后，仍能稳住路线并进入下一弯。 | 1. `toe-edge` | [S16](#source-s16)、[S06](#source-s06)、[S10](#source-s10)、[S17](#source-s17) |
| [v-heel-counterbalance](https://jinke.me/snowboard/#lesson=v-heel-counterbalance) | 后刃反弓：屈膝屈髋，平衡上身与臀部的位置：后刃脚下变重时还能调整，不整个人向弯内躺倒。 | 1. `heel-edge` | [S06](#source-s06)、[S16](#source-s16) |
| [v-lower-body-priority](https://jinke.me/snowboard/#lesson=v-lower-body-priority) | 下肢带转向，全身配合平衡：手臂放松时也能转圆弯，不靠抡肩或踢后脚。 | 1. `steering` | [S03](#source-s03)、[S16](#source-s16) |
| [v-heel-brief-hold](https://jinke.me/snowboard/#lesson=v-heel-brief-hold) | 后刃单弯：稳住一段，再完成并停住：后刃的建立、保持和结束都能主动控制。 | 1. `heel-edge` | [S06](#source-s06)、[S16](#source-s16) |
| [v-heel-feedback](https://jinke.me/snowboard/#lesson=v-heel-feedback) | 检查后刃：感觉、录像和雪痕一起看：能据实际结果保留或撤回一个调整。 | 正文保留，无动作图 | [S16](#source-s16)、[S10](#source-s10) |
| [v-toe-ankle-role](https://jinke.me/snowboard/#lesson=v-toe-ankle-role) | 脚踝怎样借助雪鞋调节前刃：靴能托住小腿，脚踝仍能微调，而不是锁死或在靴内松动。 | 1. `toe-edge` | [S16](#source-s16)、[S06](#source-s06)、[F01](#source-f01) |
| [v-low-high-principle](https://jinke.me/snowboard/#lesson=v-low-high-principle) | 站多高合适：为下一次屈伸留空间：无论高低，都给下一步调刃与屈伸留空间。 | 1. `center-high:toe`<br>2. `center-high:heel` | [S16](#source-s16)、[S06](#source-s06)、[S10](#source-s10)、[A01](#source-a01)、[S17](#source-s17) |
| [v-heel-low-inclination](https://jinke.me/snowboard/#lesson=v-heel-low-inclination) | 后刃内倾练习：先稳住弧线，再加幅度：内倾增加时，雪板与身体仍沿可控弧线走。 | 1. `inclination:heel` | [S16](#source-s16)、[S17](#source-s17)、[S06](#source-s06) |
| [v-heel-height-progression](https://jinke.me/snowboard/#lesson=v-heel-height-progression) | 后刃高低对照：站高一点仍能控刃：较高站位仍能控速、吸收和换刃，不把站高做成锁膝。 | 1. `center-high:heel` | [S16](#source-s16)、[S11](#source-s11)、[S17](#source-s17) |
| [v-heel-incline-extension](https://jinke.me/snowboard/#lesson=v-heel-incline-extension) | 后刃弯里渐进伸腿与收腿：伸腿帮助维持路线，不变成猛蹬或后脚横推。 | 1. `pressure-extend:heel` | [S16](#source-s16)、[S10](#source-s10) |
| [v-toe-reach-snow](https://jinke.me/snowboard/#lesson=v-toe-reach-snow) | 前刃内倾：手臂自然，不主动够雪：前刃幅度增加后仍看得见出口，也能准备下一弯。 | 1. `inclination:toe` | [S16](#source-s16)、[S10](#source-s10)、[S17](#source-s17) |
| [v-pressure-overview](https://jinke.me/snowboard/#lesson=v-pressure-overview) | 脚下压力：分清大小、方向和前后分配：先判断要稳住板、吸收变化还是放开旧刃，再选动作。 | 1. `pressure-flex:phase-study`<br>2. `pressure-extend:phase-study` | [S16](#source-s16)、[S01](#source-s01)、[A01](#source-a01) |
| [v-toe-kneel-pressure](https://jinke.me/snowboard/#lesson=v-toe-kneel-pressure) | 前刃吸收压力：柔和屈腿，不猛跪：吸收压力变化后仍能继续调刃，不猛跪、不蹲到底。 | 1. `pressure-flex:toe` | [S16](#source-s16)、[S10](#source-s10)、[S06](#source-s06) |
| [v-heel-open-rear-foot](https://jinke.me/snowboard/#lesson=v-heel-open-rear-foot) | 开放站姿滑后刃：后脚也要能控刃：后刃板尾能按计划转弯，下一弯也不被后坐拖住。 | 1. `fore-aft:rear-heel` | [S01](#source-s01)、[S10](#source-s10)、[S16](#source-s16)、[S17](#source-s17) |
| [v-toe-front-participation](https://jinke.me/snowboard/#lesson=v-toe-front-participation) | 前刃入弯：前脚稍先引导，后脚及时跟上：入弯更顺，弯中仍由两脚配合，不一直压在前脚。 | 1. `fore-aft:front-return-toe` | [S10](#source-s10)、[S03](#source-s03)、[S16](#source-s16)、[S17](#source-s17)、[S06](#source-s06) |
| [v11-flex](https://jinke.me/snowboard/#lesson=v11-flex) | 屈腿与压力：开始下蹲和收住动作有何不同：按需要缩短腿长，同时保住路线和后续活动空间。 | 1. `pressure-flex:phase-study` | [S16](#source-s16)、[S10](#source-s10)、[A01](#source-a01) |
| [v11-extend](https://jinke.me/snowboard/#lesson=v11-extend) | 伸腿与压力：开始站起和停止上升有何不同：渐进伸腿后仍能屈回来，不靠猛蹬制造转弯。 | 1. `pressure-extend:phase-study` | [S16](#source-s16)、[S10](#source-s10)、[A01](#source-a01) |
| [v11-lateral](https://jinke.me/snowboard/#lesson=v11-lateral) | 开放站姿：分清板头板尾与两侧板刃：分清向前刃/后刃移动，与向板头/板尾偏移。 | 1. `hip-edge-change:open` | [S16](#source-s16)、[S01](#source-s01)、[S17](#source-s17) |
| [v12-rhythm-why](https://jinke.me/snowboard/#lesson=v12-rhythm-why) | 连弯节奏：先完成弯形，再调整快慢：连续换刃少停顿，弯尾不堆成一次猛烈急刹。 | 1. `short-turns:round` | [S16](#source-s16)、[S06](#source-s06) |
| [v12-up-drill](https://jinke.me/snowboard/#lesson=v12-up-drill) | 伸展式换刃：起身同时放开旧刃：贴雪完成换刃，并给新弯继续屈腿留空间。 | 1. `edge-change-up` | [S10](#source-s10)、[S16](#source-s16)、[S06](#source-s06) |
| [v13-down-drill](https://jinke.me/snowboard/#lesson=v13-down-drill) | 屈曲换刃与回收换刃：两种收腿方式：分清两种动作路径，放开旧刃后平顺接上新刃。 | 1. `edge-change-down:lower-com`<br>2. `edge-change-down:retraction-study` | [S06](#source-s06)、[S16](#source-s16)、[T01](#source-t01) |
| [v-transition-map](https://jinke.me/snowboard/#lesson=v-transition-map) | 双向换刃：放开旧刃，顺畅接上新弯：旧刃能放开，新刃能连续建立，中间不僵停也不扑肩。 | 1. `edge-change-up`<br>2. `edge-change-down:retraction-study`<br>3. `edge-change-up` | [S16](#source-s16)、[S17](#source-s17)、[S06](#source-s06) |
| [v14-steering](https://jinke.me/snowboard/#lesson=v14-steering) | 下肢引导搓雪弯：连续转向，不甩后脚：转出连续圆弧，避免前脚钉住、后脚突然把板尾甩过去。 | 1. `garland:toe`<br>2. `garland:heel`<br>3. `steering` | [S16](#source-s16)、[A02](#source-a02)、[S10](#source-s10) |
| [v14-twist](https://jinke.me/snowboard/#lesson=v14-twist) | 板体扭转：前后脚调刃可以有先后：辨认两脚独立动作，并让后段及时接上新刃。 | 1. `twist` | [S16](#source-s16)、[S01](#source-s01) |
| [v15-incline-change](https://jinke.me/snowboard/#lesson=v15-incline-change) | 身体怎样跨过雪板进入下一弯：身体跨板顺畅，不把肩先扔进新弯等雪板追上。 | 1. `edge-change-up` | [S17](#source-s17)、[S16](#source-s16) |
| [v15-gaze-drill](https://jinke.me/snowboard/#lesson=v15-gaze-drill) | 转头观察时，保持原来的路线：观察后仍能保持当前速度、滑行走廊和板刃控制。 | 1. `gaze-control` | [S16](#source-s16)、[S37](#source-s37)、[S10](#source-s10) |
| [v16-hip-change](https://jinke.me/snowboard/#lesson=v16-hip-change) | 髋参与换刃：向板刃移动，不向板尾坐：髋向目标板刃移动时，不无意坐向板尾，也能进入下一弯。 | 1. `hip-edge-change` | [S16](#source-s16)、[S01](#source-s01)、[S17](#source-s17) |
| [v16-hip-drill](https://jinke.me/snowboard/#lesson=v16-hip-drill) | 髋部换侧练习：原地感知，滑行验证：小幅两侧调节能自主恢复，滑行不因强调髋而更僵。 | 1. `hip-edge-change` | [S16](#source-s16)、[S06](#source-s06)、[S10](#source-s10) |
| [v17-knee-change](https://jinke.me/snowboard/#lesson=v17-knee-change) | 从膝的移动看踝膝髋怎样换刃：换刃动作更紧凑，但膝不强拧、弧线不变成直冲。 | 1. `knee-edge-change` | [S16](#source-s16) |
| [v17-retract-drill](https://jinke.me/snowboard/#lesson=v17-retract-drill) | 回收式搓雪小回转：板从身下通过：以回收改善短弯衔接，不损失圆弧、滑移和控速。 | 1. `retraction-turns` | [T01](#source-t01)、[S16](#source-s16)、[S06](#source-s06) |
| [s14-twist-drill](https://jinke.me/snowboard/#lesson=s14-twist-drill) | 前后脚踏动：练小幅先后调刃：能分别微调前脚和后脚处的立刃角度，也能让两脚及时一起进入新弯。 | 1. `twist` | [S16](#source-s16) |
| [v-shoulder-rhythm-map](https://jinke.me/snowboard/#lesson=v-shoulder-rhythm-map) | 旋转怎么配合：同向、反向与上身相对稳定：能从录像认出三种关系，再选适合当前弯形的动作。 | 1. `rotation`<br>2. `counter-rotation`<br>3. `short-turns:round:extend` | [S16](#source-s16) |
| [v-mid-position-30](https://jinke.me/snowboard/#lesson=v-mid-position-30) | 肩膀朝哪里：找到适合自己的自然朝向：用两侧弯形和控速来检查肩髋朝向是否合适。 | 1. `shoulder-coordination:neutral` | [S16](#source-s16) |
| [v19-mixed](https://jinke.me/snowboard/#lesson=v19-mixed) | 旋转方式切换：反向调整后接回自然圆弯：把已经会的小幅反向调速动作接回自然圆弯。 | 1. `mixed-rotation` | [S16](#source-s16)、[T01](#source-t01) |
| [v-heel-open-loading](https://jinke.me/snowboard/#lesson=v-heel-open-loading) | 开肩后的后刃：检查前后脚是否都能控制：在舒适开肩范围内，两脚仍能调整刃角，板尾不突然扫出。 | 1. `fore-aft:rear-heel` | [S16](#source-s16) |
| [v-heel-open-progression](https://jinke.me/snowboard/#lesson=v-heel-open-progression) | 开肩姿态练习：朝向、屈伸、倾斜分开试：在舒适朝向下连续转弯，仍能轻松释放旧刃。 | 1. `shoulder-coordination:open-heel` | [S16](#source-s16) |
| [v-toe-open-causal](https://jinke.me/snowboard/#lesson=v-toe-open-causal) | 两侧弯不一样：先找哪一步开始偏差：找出两侧差异最早出现的位置，并只改一处复测。 | 1. `short-turns:asymmetric:extend`<br>2. `short-turns:round:extend` | [S16](#source-s16)、[D01](#source-d01) |
| [v-toe-closed-drill](https://jinke.me/snowboard/#lesson=v-toe-closed-drill) | 前刃双脚配合：用自然朝向找回前脚引导：让前刃弧线更连续，避免一条腿从头撑到尾。 | 1. `shoulder-coordination:closed-toe` | [S16](#source-s16) |
| [v-hand-back-cue](https://jinke.me/snowboard/#lesson=v-hand-back-cue) | 用手臂作参照：发现多余的转肩：发现抢肩，并在手臂自然放松时完成同样圆弯。 | 1. `shoulder-coordination:arms-feedback` | [S16](#source-s16) |
| [v18-follow](https://jinke.me/snowboard/#lesson=v18-follow) | 同向旋转：腿带着板转，上身自然跟随：连续引导圆弯，减少入弯和弯尾的突然扫尾。 | 1. `rotation` | [S16](#source-s16) |
| [v18-neutral](https://jinke.me/snowboard/#lesson=v18-neutral) | 自然站姿：开肩后两条腿仍能活动：找到两侧都能顺利换刃的自然朝向。 | 1. `shoulder-coordination:neutral` | [S16](#source-s16) |
| [v19-counter](https://jinke.me/snowboard/#lesson=v19-counter) | 反向旋转：已掌握调速动作后的专项练习：小幅增加熟悉后刃调速动作中的上下身反向配合，再恢复原路线。 | 1. `counter-rotation` | [S16](#source-s16)、[T01](#source-t01) |
| [v19-switch](https://jinke.me/snowboard/#lesson=v19-switch) | 反脚滑行：让新的前脚带路：在反脚方向上两刃都能控速、完成弯和停止。 | 1. `switch` | [S16](#source-s16) |
| [v19-stable-upper](https://jinke.me/snowboard/#lesson=v19-stable-upper) | 上下身分离：上身走得稳，双腿继续转弯：减少无用的甩肩，同时保留双腿引导和自然平衡。 | 1. `short-turns:round:extend`<br>2. `retraction-turns` | [S16](#source-s16)、[T01](#source-t01)、[S10](#source-s10) |
| [v20-path](https://jinke.me/snowboard/#lesson=v20-path) | 刻滑主线：从双刃控制到高阶低姿态八字：能依据失控发生的阶段选择下一项技术，分清机构质量要求、个人风格示范与本站练习编排。 | 正文保留，无动作图 | [S42](#source-s42)、[S43](#source-s43)、[S45](#source-s45)、[S47](#source-s47)、[S44](#source-s44)、[S46](#source-s46)、[S50](#source-s50)、[S51](#source-s51) |
| [v20-carve](https://jinke.me/snowboard/#lesson=v20-carve) | 刻滑和搓雪：主动选择滑移多少：能减少或增加滑移，同时把圆弯和速度控制好。 | 1. `steering`<br>2. `rail-track` | [S16](#source-s16)、[S10](#source-s10) |
| [v20-traffic](https://jinke.me/snowboard/#lesson=v20-traffic) | 弯形控速：用出弯方向和搓雪量控制速度：在选定滑行走廊内用完整圆弧控速，减少弯尾突然横刹。 | 1. `steering`<br>2. `steering` | [S16](#source-s16)、[S37](#source-s37) |
| [v-toe-low-drill](https://jinke.me/snowboard/#lesson=v-toe-low-drill) | 前刃 J 弯：让雪板沿一条弧线转向横坡：完成可控的前刃单弧，知道哪里抓刃、哪里开始扫尾。 | 1. `j-turn` | [S16](#source-s16) |
| [s20-rails](https://jinke.me/snowboard/#lesson=s20-rails) | 浅刻滑：连接两侧窄痕，按计划结束：两侧各留下连续窄痕，并在预定位置主动结束。 | 1. `rail-track` | [S16](#source-s16) |
| [s-carve-expert-arc](https://jinke.me/snowboard/#lesson=s-carve-expert-arc) | JSBA 刻滑中大弯：建刃、压弯与出口：在熟悉压雪坡连续完成可控中大弯，弯中板尾跟随，出口能衔接下一弯而不急甩尾。 | 1. `jsba-carving:complete` | [S43](#source-s43)、[S42](#source-s42)、[S46](#source-s46)、[S50](#source-s50)、[S47](#source-s47)、[S49](#source-s49) |
| [s-short-integrated](https://jinke.me/snowboard/#lesson=s-short-integrated) | 连续小回转：圆弯不断，速度可控：在自选滑行走廊连续做出圆润、可控的搓雪小弯；能说明两向换刃的不同配合，发现问题后退回对应练习，并主动放大弯和停止。 | 1. `short-turns:round:extend`<br>2. `short-turns:round:flex`<br>3. `short-turns:tail-brake` | [A02](#source-a02)、[S10](#source-s10)、[S16](#source-s16)、[D01](#source-d01)、[S35](#source-s35) |
| [s-short-sideslip](https://jinke.me/snowboard/#lesson=s-short-sideslip) | 侧滑接单弯：一步步连成搓雪小回转：把“能用两刃侧滑和单弯停止”接到“连续的小搓雪弯”，补上换侧练习的中间台阶。 | 1. `short-turn-progression:side-slip`<br>2. `short-turn-progression:side-slip-shorter`<br>3. `short-turn-progression:linked` | [S16](#source-s16) |
| [s-short-size-ladder](https://jinke.me/snowboard/#lesson=s-short-size-ladder) | 从中弯到小弯：逐级缩小，再回到中弯：能主动缩小弯，也能随时放大弯，避免只会跟着固定节拍摆板。 | 1. `short-turn-progression:medium-to-short`<br>2. `short-turn-progression:short-steady`<br>3. `short-turn-progression:short-to-medium` | [S16](#source-s16)、[A02](#source-a02) |
| [s-short-balance](https://jinke.me/snowboard/#lesson=s-short-balance) | 双脚带板与前后平衡：不要围着板头甩尾：缩弯时保留两脚的控制，找到能连续换侧的前后位置。 | 1. `short-turn-balance:centered`<br>2. `short-turn-balance:nose-pivot`<br>3. `short-turn-balance:back-seat` | [A02](#source-a02)、[S10](#source-s10) |
| [s-short-rhythm](https://jinke.me/snowboard/#lesson=s-short-rhythm) | 小回转节奏：两侧一样完整，再谈快慢：两侧小弯都能从容完成，避免一边赶、一边拖。 | 1. `short-turns:round`<br>2. `short-turns:asymmetric` | [S16](#source-s16)、[A02](#source-a02) |
| [s-short-diagnosis](https://jinke.me/snowboard/#lesson=s-short-diagnosis) | 搓雪小回转排错：先看路线，再找动作原因：把“滑得不顺”变成可验证的问题，一次只改一件事。 | 1. `short-turns:round`<br>2. `short-turns:tail-brake`<br>3. `short-turns:shoulder-led`<br>4. `short-turns:edge-locked`<br>5. `short-turns:asymmetric`<br>6. `short-turns:low-stuck`<br>7. `short-turns:round:retract`<br>8. `short-turn-balance:nose-pivot`<br>9. `short-turn-balance:back-seat`<br>10. `short-turns:over-inclined` | [S10](#source-s10)、[S16](#source-s16)、[D01](#source-d01) |
| [s-short-adapt](https://jinke.me/snowboard/#lesson=s-short-adapt) | 小回转验收：能保持，也能随时改变：让小回转成为可选择的滑行方式，而不是只能在固定节拍下维持的动作。 | 1. `short-turn-progression:short-steady`<br>2. `short-turn-progression:medium-to-short`<br>3. `short-turns:round:retract`<br>4. `short-turn-progression:short-to-medium`<br>5. `steering`<br>6. `steering`<br>7. `j-turn` | [S16](#source-s16)、[S10](#source-s10)、[A02](#source-a02) |
| [v22-strength](https://jinke.me/snowboard/#lesson=v22-strength) | 体能怎么练：力量、耐力和动作质量一起看：找出疲劳是否影响控制，建立能坚持、能恢复的离雪训练。 | 1. `dry-squat`<br>2. `dry-calf-raise`<br>3. `dry-plank` | [S21](#source-s21)、[S22](#source-s22) |
| [v22-wall](https://jinke.me/snowboard/#lesson=v22-wall) | 扶墙屈踝：小腿向前，脚跟留地：能小幅屈踝并主动返回，不靠抬跟或手推墙硬压。 | 1. `dry-wall-edge` | [S06](#source-s06)、[S25](#source-s25)、[S24](#source-s24) |
| [v22-heel-rehearsal](https://jinke.me/snowboard/#lesson=v22-heel-rehearsal) | 后刃动作预习：屁股后下移，身体保持平衡：下降、停住和起身都能踩稳脚掌。 | 1. `dry-squat` | [S16](#source-s16)、[S25](#source-s25) |
| [v22-flexibility](https://jinke.me/snowboard/#lesson=v22-flexibility) | 活动度：既能伸展开，也能自己收回来：找准一个受限动作，用舒适练习改善后重新检查。 | 1. `ankle-mobility`<br>2. `hip-mobility`<br>3. `dry-hamstring` | [S24](#source-s24)、[S29](#source-s29) |
| [v22-hold](https://jinke.me/snowboard/#lesson=v22-hold) | 浅半蹲保持：能呼吸，也能随时站起：在停留中维持姿态，并平稳结束动作。 | 1. `dry-squat:hold` | [S25](#source-s25)、[S21](#source-s21) |
| [v22-calf](https://jinke.me/snowboard/#lesson=v22-calf) | 双脚提踵：慢慢抬跟，也慢慢放下：提起、短停和下降都能控制，双脚不向内外翻。 | 1. `dry-calf-raise` | [S28](#source-s28)、[S16](#source-s16) |
| [v22-squat](https://jinke.me/snowboard/#lesson=v22-squat) | 自重深蹲：脚掌踩稳，髋膝踝一起动：完成可控的下降、短停和起身，为离雪力量训练打基础。 | 1. `dry-squat` | [S25](#source-s25)、[S29](#source-s29)、[S21](#source-s21) |
| [v22-plank](https://jinke.me/snowboard/#lesson=v22-plank) | 前臂平板支撑：身体成线，呼吸不断：在短时前臂支撑中保持躯干形态与呼吸，并让膝受控回垫。 | 1. `dry-plank` | [S27](#source-s27)、[S34](#source-s34) |
| [s22-hamstring](https://jinke.me/snowboard/#lesson=s22-hamstring) | 大腿后侧动态拉伸：托住大腿，慢慢伸屈膝：大腿大致不动时，小腿能在舒适范围往返。 | 1. `dry-hamstring` | [S29](#source-s29) |
| [s22-hip-mobility](https://jinke.me/snowboard/#lesson=s22-hip-mobility) | 半跪髋前侧拉伸：轻收骨盆，再小幅前移：分清髋前侧拉伸和腰部代偿，能主动退回。 | 1. `hip-mobility` | [S29](#source-s29)、[S24](#source-s24) |
| [s22-ankle-mobility](https://jinke.me/snowboard/#lesson=s22-ankle-mobility) | 扶墙拉伸小腿：后脚跟踩地，慢慢前移：保持脚踝稳定，在舒适范围内拉伸并返回。 | 1. `ankle-mobility` | [S28](#source-s28)、[S24](#source-s24) |
| [s22-shoulder](https://jinke.me/snowboard/#lesson=s22-shoulder) | 肩绕环热身：肩膀画小圈，手臂放松：轻松活动肩部，分清肩绕环与摆臂。 | 1. `dry-shoulder-rolls` | [S33](#source-s33) |
| [s22-warmup](https://jinke.me/snowboard/#lesson=s22-warmup) | 上雪前热身：先活动全身，再试两刃控制：让身体逐渐进入状态，确认当天能可靠控速和换刃。 | 1. `dry-shoulder-rolls`<br>2. `dry-squat`<br>3. `dry-wall-edge`<br>4. `short-turns:round:extend` | [S33](#source-s33)、[S24](#source-s24)、[S09](#source-s09) |
| [v-heel-highback-setting](https://jinke.me/snowboard/#lesson=v-heel-highback-setting) | 高背板前倾：反应更快，也要能屈伸：找到后刃容易控制、双腿仍能自然活动的设置。 | 正文保留，无动作图 | [S20](#source-s20)、[S16](#source-s16)、[S06](#source-s06) |
| [v23-highback](https://jinke.me/snowboard/#lesson=v23-highback) | 雪靴与高背板：先穿稳、扣好，再调响应：减少松动和无效空隙，让脚下动作能及时传到雪板。 | 正文保留，无动作图 | [S20](#source-s20)、[S32](#source-s32) |
| [v23-width](https://jinke.me/snowboard/#lesson=v23-width) | 站距：先从舒适屈伸开始：用舒适度和两刃控制比较站距，保留可恢复的设置。 | 正文保留，无动作图 | [S20](#source-s20)、[S31](#source-s31)、[S16](#source-s16) |
| [v23-angles](https://jinke.me/snowboard/#lesson=v23-angles) | 固定器角度：鸭式、正零和双正怎么选：读懂角度并找到舒适、可控的设置，不照搬他人的数字。 | 交互：`binding-stance` → D7 | [S19](#source-s19)、[S32](#source-s32)、[S16](#source-s16) |
| [v23-knees](https://jinke.me/snowboard/#lesson=v23-knees) | 膝盖怎么走：顺着脚的自然方向屈伸：在穿靴、扣板后仍能舒适屈伸和调整刃角。 | 1. `dry-squat` | [S16](#source-s16)、[S25](#source-s25)、[S29](#source-s29) |
| [s23-boot-centering](https://jinke.me/snowboard/#lesson=s23-boot-centering) | 雪靴居中与拖靴：两边都要留够空间：分清靴配合、横向居中和整套后移，找出可能的拖靴限制。 | 交互：`boot-clearance` → D7 | [S20](#source-s20)、[S32](#source-s32) |
| [v24-heel-edge](https://jinke.me/snowboard/#lesson=v24-heel-edge) | 后刃摔倒怎么查：被绊住，还是板滑走：用低风险的小动作验证原因，不反复重现摔倒。 | 1. `heel-edge` | [S16](#source-s16)、[S10](#source-s10)、[S26](#source-s26) |
| [v24-heel-pivot](https://jinke.me/snowboard/#lesson=v24-heel-pivot) | 开肩后板尾乱甩：查刃角、前后平衡和转肩：找出板尾最早偏转的阶段，再一次只改一个原因。 | 1. `shoulder-coordination` | [S16](#source-s16)、[S26](#source-s26) |
| [v24-heel-transition](https://jinke.me/snowboard/#lesson=v24-heel-transition) | 后刃换前刃总是慢：先看旧刃放开没有：减少换刃中的无效等待，不靠投肩或猛扭身体。 | 1. `edge-change-up` | [S17](#source-s17)、[S16](#source-s16)、[S26](#source-s26) |
| [v24-toe-unstable](https://jinke.me/snowboard/#lesson=v24-toe-unstable) | 前刃站不稳：别只顾往前趴：用小幅前刃单弯恢复抓地和放刃，再查失稳来源。 | 1. `toe-edge` | [S16](#source-s16)、[S10](#source-s10)、[S26](#source-s26) |
| [v24-rear-load](https://jinke.me/snowboard/#lesson=v24-rear-load) | 前刃后腿特别累：查位置，也查活动是否受限：减掉单腿硬撑，同时保留板头引导与板尾跟随。 | 1. `fore-aft` | [S16](#source-s16)、[S26](#source-s26) |
| [v24-skid-track](https://jinke.me/snowboard/#lesson=v24-skid-track) | 想刻滑却扫尾：先找轨迹从哪里变宽：用一个容易的单弧验证原因，再连接两侧。 | 1. `rail-track` | [S16](#source-s16)、[S10](#source-s10)、[S26](#source-s26)、[D01](#source-d01)、[S20](#source-s20) |
| [v-heel-two-run-claim](https://jinke.me/snowboard/#lesson=v-heel-two-run-claim) | 什么时候升级：能重复、能结束、自然滑也能用：给一个目标写清通过标准，用结果决定是否升级。 | 正文保留，无动作图 | [S16](#source-s16)、[S26](#source-s26) |
| [v21-method](https://jinke.me/snowboard/#lesson=v21-method) | 怎么安排练习：先滑一遍，拆一项，再自然滑：把一个滑行问题写成能执行、能比较的短组练习。 | 1. `rail-track` | [T01](#source-t01)、[S26](#source-s26) |
| [v21-linear](https://jinke.me/snowboard/#lesson=v21-linear) | 动作时机：什么时候开始，什么时候停：能调整一段屈伸的时机与速度，同时保持圆弯。 | 1. `pressure-extend:timing-study` | [S16](#source-s16)、[T01](#source-t01)、[S26](#source-s26) |
| [v3-index](https://jinke.me/snowboard/#lesson=v3-index) | 进阶怎么选课：两条主线与并行能力：根据当前问题和前置能力，选一项值得练的内容。 | 正文保留，无动作图 | [S16](#source-s16)、[T01](#source-t01)、[T02](#source-t02)、[T03](#source-t03)、[S26](#source-s26) |
| [s-jsba-basic-carve](https://jinke.me/snowboard/#lesson=s-jsba-basic-carve) | 起身式刻滑：转换时伸展开，新弧中渐屈腿：在熟悉中大弯中用温和起身组织转换，双腿始终可调，连续弧不因上下动作而弹跳或扫尾。 | 1. `jsba-carving:reference` | [S42](#source-s42)、[S50](#source-s50)、[S51](#source-s51)、[S45](#source-s45)、[S53](#source-s53)、[S46](#source-s46)、[S43](#source-s43)、[S47](#source-s47) |
| [s-short-expert-map](https://jinke.me/snowboard/#lesson=s-short-expert-map) | CASI 四级搓雪小回转：目标、转向与屈伸配合：理解专家短弯的任务条件和技术构成，能用弯形、转向分配与两向换刃判断该练哪一项。 | 正文保留，无动作图 | [S38](#source-s38)、[S16](#source-s16)、[S40](#source-s40)、[S41](#source-s41) |
| [s-short-expert-steering](https://jinke.me/snowboard/#lesson=s-short-expert-steering) | 进阶小回转：在较窄的滑行走廊里保持完整弯形：在已能管理速度的条件下维持计划滑行走廊，让新弯较早产生有效方向变化，再逐步接近官方2–3米高阶任务。 | 1. `expert-short-turns:progressive` | [S38](#source-s38)、[S16](#source-s16) |
| [s-short-expert-pressure](https://jinke.me/snowboard/#lesson=s-short-expert-pressure) | 进阶小回转：屈伸与换刃时机：在既有可控弧线中识别受力和释放的作用，管理不需要的弹跳与雪板反应，并持续接入下一弧。 | 1. `expert-short-turns:continuous` | [S38](#source-s38)、[S16](#source-s16) |
| [s-short-expert-flow](https://jinke.me/snowboard/#lesson=s-short-expert-flow) | 进阶小回转：从入段到结束都保持控制：在计划条件下完成一整段连续小弯，出现轻微变化仍能作主动调整，并保留计划退出。 | 1. `expert-short-sequence:planned-recovery` | [S38](#source-s38)、[S16](#source-s16) |
| [s-short-expert-transfer](https://jinke.me/snowboard/#lesson=s-short-expert-transfer) | 进阶小回转：换一个条件，重新找到节奏：能识别条件变化带来的新要求，并以可控的任务阶梯恢复短弯表现，不把一次成功套到全部雪况。 | 1. `expert-short-sequence:guided-slide` | [S38](#source-s38)、[S16](#source-s16) |
| [s-short-expert-review](https://jinke.me/snowboard/#lesson=s-short-expert-review) | CASI 四级搓雪小回转：完整滑段常见错误与修正：能够区分路线、放刃、身体配合与疲劳造成的不同问题，选择对应修正，并在整段双向短弯中保持控速和恢复能力。 | 正文保留，无动作图 | [S38](#source-s38)、[S16](#source-s16)、[S39](#source-s39)、[S40](#source-s40) |
| [s-jsba-dynamic-carve](https://jinke.me/snowboard/#lesson=s-jsba-dynamic-carve) | 抱腿式刻滑：收腿释放，向新弧伸开承接：用可控的收腿和重新伸开连接两侧刻滑，身体路线较连贯，旧刃释放与新弧发展清楚。 | 1. `jsba-carving:reference` | [S42](#source-s42)、[S50](#source-s50)、[S45](#source-s45)、[S46](#source-s46)、[S53](#source-s53)、[S43](#source-s43)、[S47](#source-s47) |
| [s-carve-expert-pressure](https://jinke.me/snowboard/#lesson=s-carve-expert-pressure) | 刻滑发力逻辑：身体运动、刃上压力与板的反应：能说明一个动作改变了什么、板上应出现什么结果，并用逐渐建立和释放支持替代猛踩、塌腿或甩肩。 | 1. `jsba-carving:reference`<br>2. `jsba-carving:reference` | [S43](#source-s43)、[S42](#source-s42)、[S46](#source-s46)、[S47](#source-s47)、[S50](#source-s50) |
| [s-jsba-size-control](https://jinke.me/snowboard/#lesson=s-jsba-size-control) | 刻滑弯幅与节奏：改变完整弧，保持连续支持：能在熟悉条件中有目的地改变刻滑弯幅和节奏，转换前后仍保住抓雪、出口与整体平衡。 | 1. `jsba-carving:large-to-short` | [S43](#source-s43)、[S42](#source-s42) |
| [s-jsba-short-carve](https://jinke.me/snowboard/#lesson=s-jsba-short-carve) | 纯刻滑短弯：更快换边，仍让板沿弧线转：在适合条件下连续做出左右相称的刻滑短弯，节奏稳定，尾部基本跟随，随时能改为搓雪退出。 | 1. `jsba-carving:reference` | [S42](#source-s42)、[S43](#source-s43)、[S50](#source-s50)、[S53](#source-s53) |
| [s-jsba-duck-mechanics](https://jinke.me/snowboard/#lesson=s-jsba-duck-mechanics) | 八字刻滑身体机制：两刃、肩髋与装备条件：在自己的舒适八字设置下，辨认两刃膝髋与胸廓关系，避免拖靴、硬扭膝和沿板长坐尾。 | 1. `jsba-carving:normal-dynamic` | [S44](#source-s44)、[S47](#source-s47)、[S46](#source-s46)、[S49](#source-s49)、[S54](#source-s54)、[S43](#source-s43)、[S52](#source-s52)、[S55](#source-s55) |
| [s-duck-low-linked](https://jinke.me/snowboard/#lesson=s-duck-low-linked) | 低姿态八字刻滑：保持窄痕，完成两侧转换：从正常高度进入略低的前后刃弧线，并主动恢复正常高度；整段保持窄痕、可选出口和主动搓雪退出能力。 | 1. `jsba-carving:recover` | [S19](#source-s19)、[S16](#source-s16)、[S10](#source-s10)、[D01](#source-d01)、[S17](#source-s17)、[T02](#source-t02)、[S36](#source-s36)、[S42](#source-s42)、[S50](#source-s50) |
| [s-carve-expert-variation](https://jinke.me/snowboard/#lesson=s-carve-expert-variation) | 高阶低姿态八字：两刃承接与两向转换：连续完成较低姿态的两侧弧线和两向换刃，保持窄痕、可选出口与恢复能力。 | 1. `jsba-carving:low-dynamic`<br>2. `jsba-carving:recover` | [S43](#source-s43)、[S46](#source-s46)、[S47](#source-s47)、[S49](#source-s49)、[S50](#source-s50)、[S48](#source-s48)、[S44](#source-s44)、[S42](#source-s42)、[S54](#source-s54)、[S52](#source-s52)、[S55](#source-s55) |
| [s-carve-expert-review](https://jinke.me/snowboard/#lesson=s-carve-expert-review) | 刻滑错误诊断：抓雪、低位与换刃为什么断开：能区分至少三种相似外观的不同原因，选择与阶段对应的技术修正。 | 1. `jsba-carving:low-dynamic` | [S43](#source-s43)、[S46](#source-s46)、[S47](#source-s47)、[S42](#source-s42)、[S52](#source-s52) |
| [v-toe-touch-criterion](https://jinke.me/snowboard/#lesson=v-toe-touch-criterion) | 刻滑是否进步：看轨迹、控速、放刃和适应：用能重复观察的结果决定下一步，而不是凭一个好看的姿势升级。 | 正文保留，无动作图 | [S16](#source-s16)、[S15](#source-s15)、[S43](#source-s43) |

## 现有资料索引

以下读取自 content.json；日期、版本、定位属于原资料记录，本次盘点不重新验证外部页面。每课具体依据及引用范围见 JSON 的 lessons[].citations。

<a id="source-s01"></a>

- **S01** [单板六项基本原则](https://thesnowpros.org/2021/01/8840/)（PSIA-AASI）。沿板长和板宽的受力、总压力、立刃、轴转与扭板，构成理解控板动作的六项基本原则。

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

- **S11** [Snowboard Level Three](https://www.nzsia.org/snowboard/snowboard-level-three-new/)（NZSIA / SBINZ）。Ride Module / Carving、Freeriding及Versatility Riding评估要点

<a id="source-s15"></a>

- **S15** [AASI Snowboard National Standards](https://thesnowpros.org/wp-content/uploads/2025/10/AASI_Snowboard_Standards0224_updated_100325_v3.pdf)（PSIA-AASI）。链接文件名仍带旧日期，版本以本轮读取正文为准。

<a id="source-s17"></a>

- **S17** [The Critical Link](https://casi-acms.com/casi-blog/the-critical-link/)（CASI / Simon Holden）。换弯处重新居中，受控进入新刃；避免把身体猛投进弯内等待板追上。

<a id="source-s18"></a>

- **S18** [Your Responsibility Code](https://www.nsaa.org/nsaa/safety/)（NSAA）。控速、前下方优先、可见停车与进入雪道前观察等路线原则。

<a id="source-s19"></a>

- **S19** [Snowboard Stance Angles Explained](https://www.burton.com/en-au/blogs/the-burton-blog/snowboard-stance-angles)（Burton Guides）。八字、前正后零与双正角站姿的用途及个体舒适差异，不给唯一正确角度。

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

<a id="source-d01"></a>

- **D01** [Asymmetry in Snowboarding](https://casi-acms.com/national-tech-team-articles/asymmetry-in-snowboarding/)（CASI / Breen Trott（Level 4 Evaluator））。正文第 4–7 段：advanced riders / hip and knee / comparing turns

<a id="source-s35"></a>

- **S35** [Level 2 Instructor: Riding Standards (2023)](https://www.youtube.com/watch?v=VSNG8OeHkjo)（CASIACMS）。1:50.617–1:54.117，小回转片段的有限关键帧

<a id="source-s36"></a>

- **S36** [Carving Instructor: Riding Standards (2025)](https://www.youtube.com/watch?v=zaQubyopOy8)（CASIACMS）。0:28.848–0:30.848，低位弧与转换关键帧

<a id="source-s37"></a>

- **S37** [Alpine Responsibility Code](https://cwsaa.org/safety-risk-awareness/alpine-responsibility-code/)（Canada West Ski Areas Association（CWSAA））。Alpine Responsibility Code 第1–4条；页面内旧2010视频不作为现行文本依据

<a id="source-s38"></a>

- **S38** [Level 4 Riding Module Course Guide：四级滑行模块与专家转弯标准](https://members.casi-acms.com/documents/Riding_LV4_EN.pdf)（CASI）。印刷p.5评分；p.6总体、短弯及中弯搓雪；p.7自由滑行及专家大回转刻滑；p.8技能变化；p.15版本；PDF页序相同

<a id="source-s40"></a>

- **S40** [Level 4 Instructor：现行官方课程与准备要求](https://casi-acms.com/courses/level-4-instructor/)（CASI）。Duration；AM I READY? → RIDING MODULE；FAQ → How should I prepare for Level 4?

<a id="source-s41"></a>

- **S41** [2026–27更新：课程框架与评估网格状态](https://casi-acms.com/casi-blog/whats-new-for-the-2026-2027-season/)（CASI）。Maintaining Our Framework；Technical Project – New Assessment Grids

<a id="source-s39"></a>

- **S39** [Level 4 Instructor: Riding Standards (2024)：官方四级滑行示范](https://www.youtube.com/watch?v=XFbVBdSRGgE)（CASIACMS）。小回转：40.073–41.073、46.073–50.073秒；大回转刻滑：168.293–170.793、171.293–174.293秒。2024视频任务编号与2025指南按名称对应。

<a id="source-s42"></a>

- **S42** [JSBA 教育规程：Basic、Dynamic 与技术认定任务](https://www.jsba.or.jp/education/rules/pdf/education_rules.pdf)（JSBA）。PDF 第 12 页别表 A-1；第 21 页别表 B-1、B-2

<a id="source-s43"></a>

- **S43** [第 33 届 JSBA 全日本技术选：刻滑质量与弯形控制](https://www.jsba.or.jp/ajstc_site/ajstc33/regulations.html)（JSBA）。各種目ジャッジングポイント；カービング種目共通ポイント；long、middle、short

<a id="source-s44"></a>

- **S44** [JSBA 官方示范者：脚角与器材的实际多样性](https://jsba.or.jp/education/demonstrator/)（JSBA）。田口瑞树、藤巻俊介、新野裕幸等个人装备栏

<a id="source-s45"></a>

- **S45** [新 JSBA 教程启用公告](https://www.jsba.or.jp/news/detail/440/)（JSBA）。正文：2025 年 9 月以后的讲习与检定

<a id="source-s46"></a>

- **S46** [上半身を使って低い姿勢：全身协调与低位余量](https://note.com/good_sb1976/n/nba372e41a40f)（青木玲本人技术研究日志）。上半身を使っても、バランスは取れる；腰を落とすだけでは届かない姿勢；低さではなく、動ける姿勢へ

<a id="source-s47"></a>

- **S47** [ダッグスタンスで滑った事ありますか？：脚角与可动方向](https://note.com/good_sb1976/n/nfa92842a8793)（青木玲本人技术研究日志）。テク選で優勝したときは18°／−6°；ターンを深く考えたら角度も変わった；今は30°／0°で落ち着いている

<a id="source-s48"></a>

- **S48** [MIRATORI：前后刃转换的本人公开讲解](https://www.youtube.com/watch?v=-ES6HpVWME4)（MIRATORI Channel / 澤田剛志）。本人课程页链接的 How to carving 播放单；片长 5:39；两向转换的分段观察见课程视频卡

<a id="source-s49"></a>

- **S49** [日本スノーボード協会 スノーボード教程：出版方勘误](https://www.yamakei.co.jp/products/b5ad0a0ad552939e5e98233630d1c2f7.pdf)（山と溪谷社 / JSBA 教程出版方）。原书 p.30 lean / lean-out；p.159 技术体系

<a id="source-s50"></a>

- **S50** [第 21 届 JSBA 技术选：起身系与抱腿系的历史展开任务](https://www.jsba.or.jp/ajstc_site/ajstc21/rules.html)（JSBA）。カービングターンロング；カービングターンミドル

<a id="source-s51"></a>

- **S51** [ベーシックカーブショート：公认学校真实训练记录](https://asahiprime-snowboardschool.jp/basiccurveshort/)（あさひプライムスノーボードスクール）。ベーシックカーブショートを極める；屈伸训练正文

<a id="source-s53"></a>

- **S53** [JSBA インストラクター検定：Basic 与 Dynamic 示范及讲解](https://www.youtube.com/watch?v=cMgNnGdsmpg)（JSBA 官方视频）。Basic Long：115.033、117.033、119.033 秒；Dynamic Short：625.033–626.833、630.033–632.433 秒；点评11:47–12:48

<a id="source-s52"></a>

- **S52** [MIRATORI：前刃探胸与膝髋配合的本人示范](https://www.youtube.com/watch?v=TwjZvBUY7hU)（MIRATORI Channel / 澤田剛志）。130.033、195.033秒原地对照；10.033–12.033秒剪辑滑行片头

<a id="source-s54"></a>

- **S54** [MIRATORI：八字后刃的本人公开示范](https://www.youtube.com/watch?v=FookVR1Ojuw)（MIRATORI Channel / 澤田剛志）。5.033、5.433、5.833秒低位后刃；6.233–6.633秒另一个剪辑镜头

<a id="source-s55"></a>

- **S55** [MIRATORI：八字站姿中胸髋开放与两腿配合的本人演示](https://www.youtube.com/watch?v=R7xBPS_axN4)（MIRATORI Channel / 澤田剛志）。317.240、327.240、332.240、337.240、342.240、347.240、352.240、364.280秒；384.280、389.280秒另一前脚；字幕4:21–6:59


## 输入指纹

| 文件 | SHA-256 |
| --- | --- |
| content.json | 738cf65ac3e90a42082c112e819a74a3505f8850e1b3ed9cfc58226ae0860c7b |
| animations.js | 7eedde7b1efa12617bf2b768445141ed9d61625e90d96475ff4811208ec38575 |
| app.js | acb386f94751239e3ff3b3018cb322e9878b34fd27fa6f38c6acc03956b51e68 |
| lesson-player/registry.json | 39dec20947d196e6738083040effa6ee284c73b9f17057c7d4f27b111d4c7519 |

