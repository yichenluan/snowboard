# JSBA 重构补充字段审读

审读日期：2026-10-16。本补审处理主线整合后发现的旧目标、旧示例时序和课序冲突。字段路径为零基索引，课程 ID 稳定。没有修改 `docs/source-claim-audit.json`，由主代理统一整合来源账。

## 实际审读范围

- 独立通读现行 10 节 JSBA 课与 6 节 CASI 专家短弯课的技术正文、练习、检查和排错；核对 6 节 CASI 与此前已逐字段审过的完整补丁。仅 `s-short-expert-flow.execution[2]` 和 `s-short-expert-review.videoStudy` 有后续调整，现行对象已重新读取。
- 完整读取 `v-toe-touch-criterion` 和 `s-duck-low-linked`，另核对 `v3-index.drill.dose` 与 `s-short-diagnosis.drill.steps[3]`，检查当前 `curriculum`、`navigationRoutes` 与已通过的能力前置图测试；逐条检索现行课程中的“记录”及旧 CASI 刻滑终点字样。`sources` 中有日期和范围的历史 CASI 描述不作为产品路线残留删除。
- 读取 `lesson-player/jsba-carving.ts` 的任务选项、比较配置、路线计划、`pose()` 和 `stages()`，确认 recover 使用收腿过渡：前两弧正常，中间两弧降低并恢复，末两弧正常；末态仍在滑行。本轮没有修改动作几何，也没有新增页面、连续播放、截图或真人视频观察。
- 技术来源范围沿用[本轮技术来源审读](jsba-technical-source-review.md)的 S42、S43、S50 及本课既有 S16/S10/S17/D01。没有新增网络检索、原始教材读取或视频观看；此补审不冒充对 2025 新版教程全文的独立核验。

## 改动与依据

`v-toe-touch-criterion` 不再把 CASI 四级 7–15 米大弯当刻滑主线终点，改为 JSBA 的板弯、弧形/尺寸及弯中质量观察，并区分本站低姿态八字与个人触雪风格。S43 是竞赛判据，不能由此要求普通训练统一提速或触雪。

`s-duck-low-linked` 保留基础脚角定义、前后刃非对称、两腿参与、高度/刃角/压力区别和五类排错；它承担“单侧略降→连接两弧→恢复”的入门。删除的是旧温和伸展示例冲突、被遮蔽的旧 `demo` 和重复记录流程。`s-carve-expert-variation` 仍承担较完整的低位两向转换与两工具应用；二者不需要合并成同一课。

pressure、主线说明及高阶低位课的下一步，均与现行正常高度工具→弯幅/纯刻短弯→高阶低位汇合顺序对齐。至少一种工具即可尝试某些具体弯形，主线最终学习两类工具是本站教学组织；不是“所有短弯必须同时采用两套节奏”的技术规定。

| 课程 ID | 修改字段 | 支持范围 | 当前字段指纹 |
| --- | --- | --- | --- |
| `v-toe-touch-criterion` | `mechanics[2]` | synthesis；S43 官方竞赛质量维度与本站应用目标边界。 | `fdaac6e29e709ca3` |
| `v-toe-touch-criterion` | `citations[2]` | synthesis；以 S43 取代旧 S38 大弯终点，不影响 S38 来源本身的历史说明。 | `698406d6e750c18e` |
| `s-duck-low-linked` | `summary` | suggestion；把本课限定为略降与恢复的入门。 | `3e14dc1bfc83e603` |
| `s-duck-low-linked` | `goal` | suggestion；保留两刃和恢复能力，不以姿态外观升级。 | `e4d02f25b8fe34dc` |
| `s-duck-low-linked` | `mechanics[5]` | synthesis/suggestion；S42/S50 提供工具背景，正常收腿→略低→恢复的具体时序来自当前本站 recover 编排。 | `c7aed1cd4fbbf0cf` |
| `s-duck-low-linked` | `execution[1].body` | suggestion；对应当前收腿过渡，删除旧温和伸展示例的冲突说明。 | `0986353d65e762a1` |
| `s-duck-low-linked` | `execution[1].sources` | S17/D01 既有两向转换背景，加 S42/S50 工具分类；来源不授予精确示例时序。 | `0689e5bf321cfe4e` |
| `s-duck-low-linked` | `execution[4].body` | suggestion；对应末两弧恢复正常、末态仍滑行；不再称末帧为下一周期起点。 | `0792e8386a0926cf` |
| `s-duck-low-linked` | `drill.setup` | suggestion；保留装备、同入口及熟悉策略，去记录流程。 | `757f784b03979cfe` |
| `s-duck-low-linked` | `drill.steps` | suggestion；保留单弧→连接→恢复，六步减为四步，去重复拍摄与两组记录式流程。 | `407f847779938ae0` |
| `s-duck-low-linked` | `drill.progression[2]` | suggestion；收腿未熟者正常高度补 Dynamic，通用工具不自动等于刻滑掌握。 | `b286ac701417b1eb` |
| `s-duck-low-linked` | `drill.progression[3]` | suggestion；改为 JSBA 两类工具、弯幅/纯刻短弯和高阶低位汇合，删除 CASI 刻滑旧路线。 | `0f3e9a27448f0df1` |
| `s-duck-low-linked` | `drill.dose` | suggestion；保留 2～3 次单弯、4～6 弧的本站起始建议，不设机构门槛或本机记录要求。 | `780a19de16d94e10` |
| `s-duck-low-linked` | `mistakes[3].differentiate` | suggestion；用具体板控观察判断触雪外观，不要求填写记录。 | `1b38e16eaab20387` |
| `s-duck-low-linked` | `citations[7]` | synthesis；新增 S42 的任务/本站编排边界，不声称取得新教程全文。 | `9507a4e1fea7aa41` |
| `s-duck-low-linked` | `citations[8]` | synthesis；新增 S50 的历史工具范围，不从名称推定压力。 | `3d3a70caf7226604` |
| `s-duck-low-linked` | `demo` | 删除已被 demos 优先级遮蔽的旧 duck-carve/linked-duck-carve 温和伸展配置；保留新 demos 原对象。 | `已删除` |
| `s-carve-expert-pressure` | `drill.progression[0]` | suggestion；按当前 DAG 在已练两类策略中比较，再进弯幅控制；不再逆向指示首次进入工具课。 | `00e1ac666c3d1783` |
| `v3-index` | `drill.dose` | suggestion；以主线/弱项选择、技术前置和滑行结果决定后续，删固定写作时间与更新记录要求。 | `a0e3decc63b919b1` |
| `s-short-diagnosis` | `drill.steps[3]` | suggestion；用目标问题、弯形、速度及退出判断修正，删写记录流程；其余可选录像观察保持。 | `ac61d8940df5dd67` |
| `v20-path` | `drill.progression[0]` | suggestion；与当前主线顺序统一：工具→弯幅/纯刻短弯→高阶低位汇合，低位入门可在正常控制可靠后并行。 | `ad3a097d6d92857d` |
| `s-carve-expert-variation` | `drill.progression[0]` | suggestion；在已掌握弯幅中应用两工具，再进完整诊断，去已过前置重新作为下一课的逆向指引。 | `8b37e89772f722b4` |

## 精确变更路径

以下相对于按 ID 选中的课程对象。数组 `drill.steps[4]`、`[5]` 为删除；`citations[7]`、`[8]` 为新增。

```text
lessons.v-toe-touch-criterion.mechanics[2].title
lessons.v-toe-touch-criterion.mechanics[2].body
lessons.v-toe-touch-criterion.mechanics[2].sources[0]
lessons.v-toe-touch-criterion.citations[2].source
lessons.v-toe-touch-criterion.citations[2].locator
lessons.v-toe-touch-criterion.citations[2].claim
lessons.v-toe-touch-criterion.citations[2].evidence
lessons.s-duck-low-linked.summary
lessons.s-duck-low-linked.goal
lessons.s-duck-low-linked.mechanics[5].title
lessons.s-duck-low-linked.mechanics[5].body
lessons.s-duck-low-linked.mechanics[5].sources[2]
lessons.s-duck-low-linked.mechanics[5].sources[3]
lessons.s-duck-low-linked.execution[1].body
lessons.s-duck-low-linked.execution[1].sources[2]
lessons.s-duck-low-linked.execution[1].sources[3]
lessons.s-duck-low-linked.execution[4].body
lessons.s-duck-low-linked.drill.setup
lessons.s-duck-low-linked.drill.steps[0]
lessons.s-duck-low-linked.drill.steps[1]
lessons.s-duck-low-linked.drill.steps[2]
lessons.s-duck-low-linked.drill.steps[3]
lessons.s-duck-low-linked.drill.steps[4]
lessons.s-duck-low-linked.drill.steps[5]
lessons.s-duck-low-linked.drill.progression[2]
lessons.s-duck-low-linked.drill.progression[3]
lessons.s-duck-low-linked.drill.dose
lessons.s-duck-low-linked.mistakes[3].differentiate
lessons.s-duck-low-linked.citations[7]
lessons.s-duck-low-linked.citations[8]
lessons.s-duck-low-linked.demo
lessons.s-carve-expert-pressure.drill.progression[0]
lessons.v20-path.drill.progression[0]
lessons.s-carve-expert-variation.drill.progression[0]
lessons.v3-index.drill.dose
lessons.s-short-diagnosis.drill.steps[3]
```

## 验证与边界

- `tests/progression.test.ts` 与 `tests/guide-state.test.ts`：7/7 通过；能力 DAG 含两类工具、纯刻短弯和低位，并保持正常控制先于低位应用。
- `git diff --check` 通过；JSON 可解析，课程/来源引用有效性另作结构检查。没有新增测试去复述文案。
- 现行产品正文检索未再发现旧 CASI 刻滑终点、7–15 米任务走廊、低位仅选修、协议/表单/本机记录依赖；来源中的历史任务说明仍按原范围保留。来源校验代码中的 `claim.assessment` 是证据层级字段，不是已删除的复盘协议。
- 6 节 CASI 技术正文未发现新的必须修正项。其 2–3 米为官方最终任务条件；本文没有据此宣称缓坡同宽、固定弯数或网站勾选等于真实专家水平。
- `v3-index.drill.dose` 与 `s-short-diagnosis.drill.steps[3]` 也已在授权后去掉写记录流程，保留技术选择与结果比较；其余“记录”多为装备原设置或具体观察，不机械全删。
- 本轮为文字、配置和代码时序一致性复核；测试与源码不能代替实际教学画面或现场滑行正确性。

## 四组路线内容的完整文字审读范围

本节补记此前实际实施的路线整合与本次对当前冻结对象的完整复读。此前仅精确替换 `curriculum`、`technicalMap`、`progressionMap`、`navigationRoutes` 四个顶层键，没有因此覆盖 `lessons` 或 `sources`。本次追加文档没有再修改 `content.json`。以下当前对象已逐项通读其文字和关系，不把“已通过 DAG 测试”当作文字审读。

| 对象 | 实际通读的字段范围 | 当前完整对象指纹 |
| --- | --- | --- |
| `curriculum` | 全部 16 阶段；每项 `id/title/goal/gate/lessons`，核对共同基础、CASI 六课、JSBA 工具/短弯/低位和辅助内容的先后及入口。 | `d989f43ca5363112` |
| `technicalMap` | 完整对象：标题、intro、goal、goalNote；4 个 body、6 个 controls、3 个 results、baseline、4 个 branches、2 个 supports 以及 feedback 的全部文字和链接字段。 | `4421ecc5026e8833` |
| `progressionMap` | 完整对象：8 stages、4 targets、36 nodes、9 sources、relationshipNote、moduleLinks、goalNote 与版本/intro；36 节点每项 title、focus、practice、gate 全文和 requires、supports、lessons、lane、role、stage 映射。 | `3757bc6e5f5adeff` |
| `navigationRoutes` | 全部 6 路线 foundation/short/carving/duck/switch/retraction；每项 id、title、summary、entry 及完整 lessons 顺序。 | `fa4f1853db9a90f0` |

### 路线结论与进度边界

- 对照本次工作前的 `HEAD:content.json`，32 个旧能力节点 ID 全部保留；新增 4 个结果节点为 `jsba-basic-carves`、`jsba-dynamic-carves`、`jsba-size-control`、`jsba-short-carves`。当前共 36 节点，其中 29 个 `ability`、7 个 `support`；保留旧 ID 不代表沿用旧 CASI 刻滑终点或旧文字核验。
- `targets` 中只有 `short` 和 `carving` 为 `primary:true`，分别指向 CASI 四级搓雪小回转与 JSBA 高阶低姿态八字刻滑。`switch` 是并行辅助能力；`duck` 是刻滑主线内的低位分段练习，二者均 `primary:false`。6 个阅读导航入口并不等于 6 条主目标。
- 正常高度的 `adjustable-carved-turns` 是 `duck-height-control` 的前置，后者再接 `duck-low-linked-carves`。完整弧线课后，Basic 与 Dynamic 并列发展，彼此不设强制先后；两者汇合到 pressure，再接 size-control、short-carves。高阶 variation 同时需要 `jsba-short-carves` 与 `duck-low-linked-carves`，最终 `expert-carve-review` 再以 `expert-carve-variation` 为前置。低位入门可在正常高度控制可靠后并行，最终汇合不会绕过正常高度工具和纯刻滑短弯。
- CASI 专家搓雪短弯不以前后刃纯刻滑为前置，也不强制屈曲或回收换刃。`retraction-short-turns` 是辅助支持，不能把它读成主线强制通过项；最终官方任务条件与本站日常练法仍分开。
- 旧进度原 ID 保留，但新增前置不由旧勾选自动满足。实际读取 `progression.js` 的 `analyze()`：只有当前节点已勾选且所有 `requires` 递归完成，才计 complete；旧勾选缺新前置时为 review。以“旧 32 节点全部勾选”作合成只读检验：`expert-carve-pressure`、`expert-carve-variation`、`expert-carve-review` 均为 review；新 Basic/Dynamic 为 ready，size/short 为 locked。检验没有读取或修改真实浏览器个人进度，也没有自动清除旧数据。
- 路线前置、gates 和 practice 是本站教学设计；JSBA 任务名/判据、CASI 短弯终点及辅助机构通用原则仅提供注明范围的依据。这里不宣称 JSBA 官方统一要求八字、低位、触雪或本站课序。

### 36 节点与 4 目标的当前对象指纹

指纹覆盖完整对象；文字审读实际覆盖上述所有可读字段，关系字段同时核对。索引按当前数组排列，并保留 ID 方便映射；不是对旧画面观察的重新授予。

| 路径 | ID / 当前标题 | 角色 | 当前对象指纹 |
| --- | --- | --- | --- |
| `progressionMap.nodes[0]` | `dual-edge-control` · 双刃控速与主动停止 | `ability` | `1fef5bb42f27253c` |
| `progressionMap.nodes[1]` | `linked-skidded-turns` · 连续搓雪弯 | `ability` | `d20b810d481081d5` |
| `progressionMap.nodes[2]` | `turn-shape-control` · 能调整弯形与滑行宽度 | `ability` | `47c821c5e8418173` |
| `progressionMap.nodes[3]` | `smooth-edge-change` · 放刃与平顺换刃 | `ability` | `1f64d85d2c5f2482` |
| `progressionMap.nodes[4]` | `fore-aft-balance` · 居中与前后平衡 | `support` | `4409c136e897bf6b` |
| `progressionMap.nodes[5]` | `edging-balance` · 两刃平衡与渐进立刃 | `support` | `8fcec956eabf37dd` |
| `progressionMap.nodes[6]` | `lower-body-steering` · 双腿引导转向与扭板 | `support` | `c7d4a66626b671a3` |
| `progressionMap.nodes[7]` | `leg-length-control` · 屈伸与压力变化 | `support` | `9d7a05abe17dc6b6` |
| `progressionMap.nodes[8]` | `upper-lower-separation` · 上下身分离与观察 | `support` | `f47f3cd0c7740210` |
| `progressionMap.nodes[9]` | `isolated-carved-arcs` · 前后刃都能滑出单条刻滑弧线 | `ability` | `7cedfea3b8b9469b` |
| `progressionMap.nodes[10]` | `short-turn-entry` · 从单弯接到小弯 | `ability` | `be191d52d6d3a034` |
| `progressionMap.nodes[11]` | `switch-basic-control` · 反脚双刃与单弯 | `ability` | `a4c798985b8ebd35` |
| `progressionMap.nodes[12]` | `flexion-release` · 选修 · 屈身换刃 | `support` | `a5c37a41b3eb8cf4` |
| `progressionMap.nodes[13]` | `open-linked-carves` · 浅弧连续刻滑 | `ability` | `da58c13bffdfc7fa` |
| `progressionMap.nodes[14]` | `short-linked-turns` · 连续搓雪小回转 | `ability` | `cffe346abd74737d` |
| `progressionMap.nodes[15]` | `switch-linked-turns` · 反脚连续控速弯 | `ability` | `54751f9b12d9ebc0` |
| `progressionMap.nodes[16]` | `adjustable-carved-turns` · 刻滑弯形与滑移可选 | `ability` | `ebabd81c9be228d9` |
| `progressionMap.nodes[17]` | `adaptive-short-turns` · 小回转 · 保持与变化 | `ability` | `0f7ea4f2d43d0177` |
| `progressionMap.nodes[18]` | `retraction-short-turns` · 选修 · 回收换刃 | `support` | `dfe3f66e628235b6` |
| `progressionMap.nodes[19]` | `duck-height-control` · 八字站姿：两刃高低与关节配合 | `ability` | `936c936c5670d575` |
| `progressionMap.nodes[20]` | `duck-low-linked-carves` · 低姿态八字：连续换刃与恢复 | `ability` | `797933938a63cf88` |
| `progressionMap.nodes[21]` | `expert-short-reference` · CASI 短弯：技术构成与目标 | `ability` | `289dcb2aa29b1864` |
| `progressionMap.nodes[22]` | `expert-short-steering` · 弯形与转向方式 | `ability` | `2021b487685ec2b2` |
| `progressionMap.nodes[23]` | `expert-short-pressure` · 小回转屈伸与换刃 | `ability` | `e25f8db20f128fd1` |
| `progressionMap.nodes[24]` | `expert-short-flow` · 全段连续表现 | `ability` | `f119b81071baf6bb` |
| `progressionMap.nodes[25]` | `expert-short-transfer` · 换条件后的控制 | `ability` | `0dc81756341bdf0f` |
| `progressionMap.nodes[26]` | `expert-short-review` · CASI 短弯：完整滑段与错误修正 | `ability` | `6b9815cb3e6871f1` |
| `progressionMap.nodes[27]` | `expert-carve-reference` · JSBA 刻滑：正常高度基础与技术选择 | `ability` | `66f4f29b9a770174` |
| `progressionMap.nodes[28]` | `expert-carve-arc` · 完整刻滑弧线与渐进抓雪 | `ability` | `9055db4796c9779a` |
| `progressionMap.nodes[29]` | `expert-carve-pressure` · 两类转换中的屈伸与板控 | `ability` | `35cdb46b6fd56413` |
| `progressionMap.nodes[30]` | `expert-carve-variation` · 低姿态八字：弯幅与转换应用 | `ability` | `30ba5f9377d234d2` |
| `progressionMap.nodes[31]` | `expert-carve-review` · JSBA 刻滑：整段应用与错误修正 | `ability` | `43e599ede654aa8d` |
| `progressionMap.nodes[32]` | `jsba-basic-carves` · Basic：伸展式连续刻滑 | `ability` | `e7c520e00b9dc719` |
| `progressionMap.nodes[33]` | `jsba-dynamic-carves` · Dynamic：抱腿式连续刻滑 | `ability` | `0739355bc1662e16` |
| `progressionMap.nodes[34]` | `jsba-size-control` · 刻滑弯幅与弧形可调 | `ability` | `1b563edd3a1f605a` |
| `progressionMap.nodes[35]` | `jsba-short-carves` · 纯刻滑短弯：双侧抓雪与连续转换 | `ability` | `4dbbc396b583f7f0` |
| `progressionMap.targets[0]` | `short` · CASI 四级搓雪小回转 | `primary:true` | `3e1d7fe51deedd7a` |
| `progressionMap.targets[1]` | `carving` · JSBA 高阶低姿态八字刻滑 | `primary:true` | `5788cf30a93abb5a` |
| `progressionMap.targets[2]` | `switch` · 并行能力 · 反脚 | `primary:false` | `0bbbc7c2ad089562` |
| `progressionMap.targets[3]` | `duck` · 刻滑分段练习 · 八字站姿与高低控制 | `primary:false` | `fc10fabf5c85fd30` |

以上为当前路线文字与结构的审读依据，可用于更新 `teaching-audit-review` 的真实文字审查。未新增/继承页面连续播放、三维姿态、真人对照或旧画面观察通过状态；旧观察及失效规则保持各自记录。
