# 离雪任务：迁移前的一手证据核查

核查日期：2026-10-14。以下为本轮实际读取的一手文字。普通鞋站立的4类型、12引用已实现；另4类型、8引用仍在候选验证。具体画面执行范围见[播放器审阅](lesson-player-review.md)，未完成实拍逐帧标定。

| 类型 | 直接支持与定位 | 实现要求（由资料推导） |
| --- | --- | --- |
| `dry-squat` | [ACE Bodyweight Squat](https://www.acefitness.org/resources/everyone/exercise-library/135/bodyweight-squat/)，Steps 1–6：髋膝共同下降，脚跟保持支撑，膝沿脚向，起身时髋与躯干一起上升 | 运动鞋/赤足模型与雪靴分开；脚不漂移；不可复用雪上固定胫骨前倾。小幅热身与力量深蹲用不同幅度。达到舒适范围即可，不强制大腿水平。 |
| `dry-plank` | [ACE Front Plank](https://www.acefitness.org/resources/everyone/exercise-library/32/front-plank/)，Steps 1–3：肘位于肩下，躯干腿保持组织，避免塌腰、耸肩和过高抬髋，持续呼吸 | 地面接触必须同时显示前臂与脚趾；不得用站立姿态旋转90°替代。阶段为准备、抬起、保持、受控放下。 |
| `dry-calf-raise` | [HSS Ankle Stretches and Exercises](https://www.hss.edu/health-library/move-better/ankle-stretches-exercises)，Calf Raises：双脚站立，抬双脚跟，短停并下放；需要时用稳固支撑 | 前脚掌保持接触，脚跟确实离地；身体随之上升，不能只把小腿拉长。与雪上前刃的脚跟留靴内清楚区分。 |
| `ankle-mobility` | 同一 HSS 文章，Runner Calf Stretch：手掌扶墙，前后错步，前腿略弯，换侧 | 必须有墙及手掌接触；后脚跟地面关系应可观察。不同膝位的拉伸用途不能合并成没有差异的一段。 |
| `hip-mobility` | [HSS Knee Stretches and Exercises](https://www.hss.edu/health-library/move-better/exercises-strengthen-knees)，Half-Kneeling Hip Flexor Stretch：半跪，前脚踏地，骨盆轻收，再小幅前移 | 显示后膝接触与前脚支撑，骨盆控制不通过腰椎后弯代替；不展示极端前压。 |
| `dry-hamstring` | 同一 HSS 文章，Dynamic Hamstring Floor Stretch：仰卧，托住一侧大腿，缓慢伸屈该侧膝，在舒适范围往复 | 手应真的托在大腿后；股骨位置相对稳定，运动主要发生在膝；不可整条腿反复大幅甩动冒充此练习。 |
| `dry-shoulder-rolls` | [NHS How to warm up before exercising](https://www.nhs.uk/live-well/exercise/how-to-warm-up-before-exercising/)，Shoulder rolls：肩向前与向后绕动，手臂放松 | 不能用肩关节大幅抡臂代替肩带小幅绕动。NHS 的整套示例同时包含原地踏步；若站定只拆解肩部，要明确这是局部动作示意。 |
| `dry-wall-edge` | 现有正文已明确普通鞋/赤足、双脚并列、全掌留地、手轻扶墙；它是作者设计的双侧踝背屈感知 | 独立普通鞋模型保持全掌及双掌接触。不能因为类型名包含 edge 就复用雪靴立刃，也不能把两脚并列版本称为来源中的前后分腿小腿拉伸。 |

## 文字边界

HSS 当前膝部页面明确允许舒适范围内膝自然向前活动，不支持“膝永远不能超过脚尖”。它讨论一般训练与临床相关教育，不能据此宣称训练必然修正雪上技术或代替个体评估。

数值、时间比例、人体比例和展示幅度都须作为作者编排另记；资料的重复次数不能机械成为动画通关门槛。本文尚未观看各嵌入视频，也未对画面姿态作认证。

## 20引用逐任务规格（站立12已实现，卧跪及分腿8待接入）

| 引用 | 独立任务与必要区别 |
| --- | --- |
| v22-strength/1、v22-squat/1 | bodyweight-squat：受控下降、短停、共同起身 |
| v22-heel-rehearsal/1 | supported-shallow-squat：普通鞋、双手轻扶稳椅，小幅预习；不能套力量深蹲 |
| v22-hold/1 | shallow-hold：浅幅下降、较长保持、主动起身 |
| s22-warmup/2 | warmup-shallow：普通鞋小幅连续往返，不演成深蹲训练 |
| v23-knees/1 | shoe-knee-baseline：只承担正文第一步普通鞋基线；穿靴与扣板复查未演示，标题和focus必须说明 |
| v22-strength/3、v22-plank/1 | 前臂平板：前臂与脚趾支地，整体抬离、保持、放回垫面；准备/结束不得躯干悬空 |
| v22-strength/2、v22-calf/1 | 双脚轻扶提踵：前掌留地、脚跟抬起，膝不靠深蹲伸直制造升高 |
| v22-wall/1、s22-warmup/3 | 普通鞋双脚并列扶墙屈踝：全掌留地，两膝沿各自脚向前移，再退回；不抬跟、不立刃 |
| v22-flexibility/1、s22-ankle-mobility/1 | 前后分腿小腿拉伸：后膝近伸直、后跟留地、双手扶墙；一侧设置、前移、保持、返回 |
| v22-flexibility/2、s22-hip-mobility/1 | 半跪髋前侧拉伸：前脚全掌、后膝软垫支撑，轻收骨盆、小幅前移、退回，不仰胸塌腰 |
| v22-flexibility/3、s22-hamstring/1 | 仰卧托大腿伸屈膝：头背骨盆由垫面支持，双手真实托腿，主要动膝，末态仍托腿屈膝 |
| s22-shoulder/1、s22-warmup/1 | 站定肩绕环拆解：肩带小幅前后绕、手臂自然垂；完整热身另含踏步 |

普通鞋骨架独立于雪靴模型，保持骨长；脚区分后足和前掌/趾段。接触约束放在鞋底、手掌、前臂、膝垫表面，不把关节中心埋进地面。墙/椅/垫实际出现，扶稳手掌不能随身体漂移或靠伸长手臂维持。非对称动作选左/右侧，不用regular/goofy；没有实际换侧时阶段只写“受控返回”。

补充实际核对的来源：[NHS Calf stretch](https://www.nhs.uk/live-well/exercise/flexibility-exercises/)明确后腿伸直、后跟留地；[Royal Orthopaedic Hospital](https://roh.nhs.uk/services-information/foot-and-ankle/calf-stretching)将后膝伸直/屈曲分作不同拉伸；[NHS OPAL Knee to Wall](https://www.opalreturntowork.nhs.uk/exercises/knee-to-wall-stretch/)是前后分腿、前腿屈踝，不能直接给两脚并列扶墙任务背书。

已改文案：v23-knees动画明确普通鞋基线；v22-heel-rehearsal与s22-warmup中的离雪部分明确普通鞋；肩绕环明确站定拆解。踝/髋拉伸接入时，返回阶段不能假称画面已换侧。上述范围收紧不删除正文中的后续穿靴/扣板复查。

## 普通鞋站立模型与审计

`dryland.ts` 不使用雪板或雪靴姿态。世界 +x 为人物左、+y 为上、+z 为前；实体与正侧面投影遵循同一解剖左右。鞋底区分后足与前掌，支点为表面点；固定墙与椅由独立几何生成，手臂在骨长不变条件下连接固定掌面。

12引用拆成8任务。力量深蹲、扶椅浅蹲、浅蹲保持、热身浅屈伸、普通鞋膝向基线分别规定范围和保持阶段。提踵先在脚跟留地时转移，再由后足绕前掌转动带动身体升高；抬跟期间膝角不变。作者示例脚跟抬高约7.73cm、骨盆升高约4.84cm，均非训练目标。肩带小圈位移最多约2.4cm，手臂随肩轻动；前后两圈的偏置及时间比例为作者编排，没有实拍标定。

自动检查覆盖12引用×201点的骨长、鞋底接触、固定道具与手掌，以及估计COM投影在实际足底支撑多边形内。COM仅是粗分段诊断，不是足底压力。独立审计另检查8任务×1001点的鞋盒所有角点和手盒表面：鞋底最低y=0，鞋面不穿地，墙掌面z=.5，椅掌面y=.985。踝位于后鞋面体积内，未发现腿端与鞋体真空隙；前后鞋面仍有约13mm造型接缝，鞋底连续。这些检查不等同于完整人体碰撞或动力学验证。
