# Expert Short Radius 专项课程设计

审读与设计日期：2026-10-15。此文件说明课程编排、证据边界和实现契约；它不是学员达标记录，也不是页面、动作或发布验证结果。

## 终点与证据

专项终点是 CASI Level 4 Riding 的 **Expert Short Radius**。保留原七课的可控搓雪基础与适用地形，再增加六课。学习、执行雪上练习和达到官方专项表现是三个不同结果；完整 CASI Level 4 资格还包含其他任务与模块。

| 来源 | 本轮实际读取范围 | 可用于课程的结论 | 不支持的外推 |
| --- | --- | --- | --- |
| [S38：Level 4 Riding，September 2025](https://members.casi-acms.com/documents/Riding_LV4_EN.pdf) | 本地 PDF p.3–9，重点 p.5–8；版本页由来源研究交叉核验 | p.6：2–3 米走廊、advanced/expert speeds、expert groomed terrain；控压管理 rebound/reaction；全程维持三核心与四高级；以弯形和 steering 控速。p.8：大中小技术弯主要调整技能用量与持续时间，整体序列不应大改。 | 无统一 km/h、坡角或规定弯数；不可把 L2 的走廊、其他选拔的弯数当本任务标准。 |
| S16：CASI Reference Guide | 本代理实际读 p.58、107；来源审计代理补读 p.43–59 并对六课逐字段审查 | p.58 定义四高级；p.43–59 支持平衡、转向、刃、压力、时序的课程归纳。屈伸阶段与作用不能只靠身体高度判断。 | Arc to Arc 不等于每弯纯刻滑，Loading & Deflection 不等于越弹越高，低姿态不等于高压力。 |
| S40：现行 Level 4 课程页；S41：2026–27 公告 | 由来源研究代理实际读取，定位见[官方标准研究](level4-short-official-standards.md) | 专家一致性、适应性和现任 L4 教练／考官反馈；2026–27 新 grid 仍在测试，不擅自改写已发布 criteria。 | 不把 September 2025 PDF 标成“2026 新评分表”，也不自造新表计分规则。 |
| [S39：官网当前嵌入 Riding Standards 2024](https://www.youtube.com/watch?v=XFbVBdSRGgE) | 主代理观察短弯段的 15 个时刻：黑衣 40.073–41.073 秒 6 帧；红衣 46.073–50.073 秒 9 帧 | 板／下肢改向、上身适量顺应、两侧倾转、膝髋持续调节，以及伸长与弯中变短并存。课程仅引用此有限观察，由[独立观察记录](level4-short-video-observation.md)限定。 | 没有实测压力、速度、走廊宽度；部分边刃与雪痕受遮挡。不能由这 15 帧宣称人工观察整个视频周期或官方分数。 |

S38 p.5 明确每任务两次计分机会、两名考官评分取平均、每任务最终至少 6/10；该页没有完整说明两次滑行如何合成最终成绩。课程不补写“取最好一趟”或“两趟平均”。本站复测安排也不是复刻正式考试算法。

## 13 课路线与能力图

原课程 ID 和基础目标保留。两条入口由问题决定，不把每一课强制串成刷课清单。

1. 换侧尚不稳：`s-short-sideslip`；中弯已稳定：`s-short-size-ladder`。两者结合 `s-short-balance` 检查居中与两侧控制。
2. `s-short-integrated` 组织完整连弯，`s-short-rhythm` 撤去固定口令后复测，`s-short-diagnosis` 按可见差异排错。
3. `s-short-adapt` 在熟悉范围维持、放大、变出口并结束。只有该范围可靠才进入专家目标基线；它本身不证明专家条件能力。
4. 新六课沿下表推进。转向和调压是同一阶段的两个精修方向，之后才合并为整段与条件迁移。

| 新课 ID | 进入条件 | 核心任务与输出 | 退阶 |
| --- | --- | --- | --- |
| `s-short-expert-map` | 原七课在熟悉条件可靠；较宽弯可控速、退出 | 区分当前条件和官方条件；保存完整基线、未知项与一个主要差距 | 基线仍反复急刹，回整合、缩弯或排错 |
| `s-short-expert-steering` | 已建立基线与可靠弧线 | 同条件比较连续双腿引导、新弧支撑和适当滑移；先保持出口，再小幅缩窄并主动放大 | 新刃锁住、逐弯加速或后段横刹，回原弯宽与熟悉滑移量 |
| `s-short-expert-pressure` | 可维持较宽可靠弧线并辨认一个响应问题 | 微调腿长变化时机／持续时间；查看释放后下一弧选择，撤提示复测 | 被动离雪、冲击、卡刃或疼痛，停止该提示，回较宽可控弯 |
| `s-short-expert-flow` | 转向与调压均已有可重复结果 | 入口、中段、末段及双向转换均保留核心与高级能力；定位第一次退化 | 速度累积、走廊扩大或释放卡顿，缩短滑段并回相应弱项 |
| `s-short-expert-transfer` | 完整滑段可靠 | 一次选一个主要条件变化，先用较宽弯确认，再逐步恢复短弯；记录结果和代价 | 新条件较宽弯也失控，则结束迁移，回更容易条件 |
| `s-short-expert-review` | 有完整记录，能说明任务条件与未知项 | 对照官方任务、有限真人观察和十一项记录；接外部反馈，形成下一次训练 | 条件不清、影像不足或能力范围不匹配，保留未观察并回相应课 |

能力图继续使用 target `short`，追加两个阶段 `expert-refine` 与 `expert-verify`。新节点为 `expert-short-reference`、`expert-short-steering`、`expert-short-pressure`、`expert-short-flow`、`expert-short-transfer`、`expert-short-review`。

依赖为：`adaptive-short-turns → expert-short-reference → steering + pressure → flow → transfer → review`，review 同时直接要求 flow。`v17-retract-drill` 为调压工具的相关入口，不是专家节点的必修姿势；反脚保持并行路线。六课全部关联同一个复盘协议，跨课保留记录。

## 训练机制和建议量

以下全部是本站教学安排，官方没有给出这些组数和弯数。练习数量服务于可观察与可比较；空间、疲劳、质量或控制能力不允许时减少或停止。

| 课 | 建议量与比较方式 |
| --- | --- |
| 基线 | 原熟悉条件两组各 6–8 弯；保留从入口到退出，不挑最好两弯；每组停稳休息并只选一个差距 |
| 转向 | 基线、连续引导对照、撤提示各一组 4–6 弯；本趟最多一次小幅缩窄，恢复宽弯检验选择能力 |
| 调压 | 两向各两次单次调整，每次接两个自然弯后停稳；有效且从容才做一至两组各 4–6 弯 |
| 连续性 | 原短组确认后，最多两组完整滑段；可从 6–8 延至 8–10 弯观察，但用安全起终点定义任务，不强凑弯数 |
| 迁移 | 一次只选一个主要变化；原条件基线一组，新条件先较宽弯一组，再最多两组 4–6 弯 |
| 专项复核 | 保存一段完整证据，充分复盘后另趟取一段相近条件记录；不是正式两次机会的模拟计分 |

每课均包含 prerequisites、mechanics、execution（含口令与观察）、checks、drill（场地、布置、步骤、成功、停止、进阶、dose）、mistakes（现象、可能原因、纠正、验证、鉴别）和定位引用。

## 条件记录与验收协议

协议 `casi-l4-short` 的十一项 ID 固定：`task_conditions`、`centred_mobile`、`lower_body_turning`、`working_edge_balance`、`strength_flow`、`arc_to_arc`、`loading_deflection`、`steering_versatility`、`shape_speed_control`、`run_consistency`、`variation_transfer`。详见补丁的 `assessmentProtocols[0].criteria`；每项有标题、可观察文本和返回课程。

这十一项是本站把官方任务和能力组织成的观察表，不是官方评分 grid。尤其“单条件变化”“主动退出”“完整时段加相近条件复测”是训练与证据质量安排，不能增加成官方硬性评分项。

每趟记录日期、地形、雪面、速度任务、走廊、装备、站姿、本次变化、完整证据、外部反馈及下一次练习；每项状态只有“未观察／需发展／本条件可重复”，另写时刻或现象。未知地形、精确宽度和速度要保留未知；不能从透视视频反推米数。选择“本条件可重复”也只覆盖记录条件。

摄像保留入口、中段、末段和两向；拍摄者固定在可见且远离滑线、走廊、停止区的位置。不同机位的不同趟分别记条件，不剪成一次连续表现。证据不能提供实测压力或载荷；现场观察和现任 L4 教练／考官的反馈用于解决更高要求任务下的判断。

## 动画契约

六课共新增四处播放器引用：steering 一处、pressure 一处、flow 两处；map、transfer、review 无重复作者播放器。每播放器可以在任务内切换对照；两个任务共有四种配置，`type: expert-short-turns`，显式 `duration: 16000` 为作者观察时钟，不是实测滑速。

| task | variant | 显示内容与约束 |
| --- | --- | --- |
| `expert-corridor-steering` | `progressive` / `late-steer` | 同一可见通道任务中比较引导分配和后段集中改向；路线曲率允许变化，因此不称同线路单变量实验。 |
| `expert-load-release` | `continuous` / `held-release` | 严格保持同线路、同板姿态／放刃事件，比较腿长调节与屈腿准备偏晚；不能描述成旧刃实际延迟释放。 |

播放器开启 `trackDiagnostics`；load-release 开启 `legLengthDiagram`。正文明确它们不模拟真实雪面反力、板弯曲、弹性能、压力、回弹或加速度。腿长示意不能替代力学测量，反例也不是要求雪上故意模仿。没有为迁移课制造未验证的冰雪／雪包动力学。

动作正确性仍须独立逐阶段、双方向与多视角审阅。模块测试、合法关节范围、截图生成和页面可运行均不自动证明教学动作正确。该验证由主代理和动作代理另记。

## 合并与审计边界

可合并数据位于 `.validation/level4/content-patch.json`，格式为 `level4-short-curriculum-patch-v1`：六个 `appendLessons`，三个原课 `lessonFieldEdits`，一个 `assessmentProtocols`，模块字段、能力图与课程目录追加。原课只增加相关入口，并在 `s-short-adapt.drill.progression` 明确进入专家基线的范围；不把原缓坡目标直接改成专家目标。

主代理负责添加 map 的 S41 版本说明、review 的 S39 `videoStudy`、最终页面与本机记录交互。来源代理逐字段审查新课程、视频卡和整份协议，分类 direct／synthesis／suggestion／unverified；不是只刷新内容 hash。本设计文件与补丁不是最终来源账，也不代替发布验收。
