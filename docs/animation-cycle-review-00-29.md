# 000–029 动画阶段样本人工审阅

本轮人工看完 30 个配置、46 项动画引用对应的 62 张新版分页联系图，共 598 个样本：328 个阶段帧、270 个多视角帧。各配置均保留 `partial`，教学 `passed` 为 0。本次未发现可确认的新 P0/P1；这只代表已看样本中的结果。

审阅方式：逐张用 `view_image` 读取 `sheets/manifest.json` 指定的带页号文件，同时读取 `event-frames.json` 的阶段目标。000–029 覆盖所有已声明阶段的入口、中点和末态；026 有 3 页阶段图。每配置另看 front、side、boots 的 .25/.5/.75。没有用测试通过或自动计数代替人工教学判断。

## 可追溯证据

- [逐配置 JSON](../.validation/continuation/animation-cycle-review-00-29.json) 保留配置、46 项稳定引用、时刻、每张联系图 SHA-256 和人工观察。
- [捕获清单](../.validation/continuation/event-frames.json) 保留实际 cue/status。
- [联系图索引](../.validation/continuation/sheets/manifest.json) 保留每页所含原始样本。

## 逐配置观察

所有行均为 `partial`。共同检查范围为阶段姿态、足部固定关系、明显穿插/反折、工作刃方向及与阶段目标的可见一致性。未见明显异常不构成连续动作、真实受力或全部站姿通过。

| 配置 / 类型 / 任务 | 引用 | 已看样本 | 可观察结果 | 边界 |
|---|---|---:|---|---|
| 000 / center-low / stationary | v-base-stance/1 | 9 + 9 | 舒适参考位的小幅屈曲、短留与恢复在阶段图中可辨；膝未伸至反折，双靴保持在固定器内。 | 小幅原地观察不能证明雪上压力或动态平衡。 |
| 001 / shoulder-coordination / arms-traverse-stop | v-arms-feedback/1 | 13 + 9 | 架臂到放下手臂、有限侧看及后段转向横坡分别可见；手接近髋但未见明确穿入大腿，肩未随转头大幅甩动。 | 本次只看所捕获前刃配置；有限侧看不等于完整上坡交通观察，静帧不能确认减速度。 |
| 002 / fore-aft / stationary | v-fore-aft-movement/1、v24-rear-load/1 | 9 + 9 | 阶段主视图可辨小幅向前、回中、向后、回中；脚位保持，骨盆与胸廓共同微调，没有大幅坐板尾。 | 代码 range(t) 的前脚侧极值为 .25，后脚侧极值为 .75；这两个真实极值已在原 front/side/boots 三视角截图中实际看过，峰值覆盖已确认。位置仍不能当作压力比例。 |
| 003 / fore-aft / stationary | v-fore-aft-roles/1 | 9 + 9 | 默认侧面阶段图较清楚地呈现前脚侧、后脚侧与回中的小幅位置差；双脚固定，下肢分别配合。 | 原 front/side/boots 的 .25/.75 正是前后真实极值，三视角覆盖已确认；身体位置不能当作前后脚压力分配。 |
| 004 / fore-aft / stationary | v-fore-aft-drill/1 | 9 + 9 | 斜侧阶段图可见前后微调与恢复；躯干没有用探头或伸臂替代整段位置移动，靴板关系保持。 | 原 front/side/boots 的 .25/.75 正是前后真实极值，三视角覆盖已确认；动作幅度小不构成峰值遗漏。 |
| 005 / center-high / single-arc | v-toe-high-low/1、v-low-high-principle/1 | 9 + 9 | 前刃弧线上骨盆高度适量上升后恢复，膝仍有屈曲；靴近景未见脚跟明显脱出或板脚分离。 | 仅验证高度与关节关系的可见差异，不据高度推算压力。 |
| 006 / inclination / edge-release-study | v-active-passive-edge/1 | 9 + 9 | 前刃建立、保持与释放可辨；中段整体倾斜比 007 更明显，足部保持固定。 | 倾斜与成角差异幅度有限，截图不能确认两者真实受力比例。 |
| 007 / inclination / edge-release-study | v-active-passive-edge/2 | 9 + 9 | 与 006 对照，中段上身相对更直立、下肢配平更明显；末段减刃，没有演成另一刃的完整转弯。 | 静帧只支持姿态关系对照，不证明真实受力或雪上收益。 |
| 008 / toe-edge / static-edge | v-toe-static-five/1 | 9 + 9 | 原地扶栏、双手支撑、小幅前刃与恢复可见；没有大幅折腰或跪向雪面。 | 扶栏立柱遮住局部足部近景，另两视角补充；这是有辅助的小幅原地辨认。 |
| 009 / toe-edge / edge-release-study | v-toe-tongue/1、v-toe-ankle-role/1 | 9 + 9 | 前刃建立时膝与髋向脚尖侧协调，小腿前倾；末段减刃，靴与固定器关系在近景保持。 | 同刃释放片段没有演示停车或完整连弯；不能从姿态推导压力。 |
| 010 / heel-edge / edge-release-study | v-toe-tongue/2 | 9 + 9 | 后刃中膝髋屈曲、骨盆向脚跟侧与高背关系可见，末段恢复；未见膝反折或脚板脱开。 | 只观察同刃建立和释放，不包括完整停车或连弯。 |
| 011 / toe-edge / edge-release-study | v-toe-lock-ankle/1、v-toe-counterbalance/1、v24-toe-unstable/1 | 9 + 9 | 小腿、膝与骨盆渐进建立前刃，释放段仍保持可屈伸关系；足部近景未见脚跟抬出靴或固定器。 | 能观察踝膝髋关系，不能据此证明靴内真实接触力或关节自由度数值。 |
| 012 / heel-edge / edge-release-study | v-heel-pull/1、v-heel-counterbalance/1、v24-heel-edge/1 | 9 + 9 | 后刃段膝髋共同折叠、胸廓相对回板；小腿与高背邻接关系可见，没有锁膝后折。 | 静态图不支持实际肌肉发力大小，结束是减旧刃而非停车。 |
| 013 / heel-edge / static-edge | v-heel-static-repetition/1 | 9 + 9 | 扶栏辅助下的小幅后刃、保持与回位可见，双手未明显离开栏杆；靴板位置保持。 | 只能解释有扶栏辅助的原地动作；立柱遮住一部分足部近景。 |
| 014 / steering / linked-steering | v-lower-body-priority/1、v14-steering/3 | 15 + 9 | 两侧弧线与前刃、近平板、后刃的姿态变化可辨；.50/.51/.52 附近没有可见的大幅姿态跳变，肩线自然跟随。 | 这些离散帧不能证明全段连续平滑、滑移量或真实减压；末帧仍是滑行片段。 |
| 015 / heel-edge / single-turn-stop | v-heel-brief-hold/1 | 9 + 9 | 后刃单弧持续转向，.8/.9/末态仍保留后刃；膝髋未锁死，也没有把单弯末态做成放平接下一弯。 | 静帧可确认方向与末态留刃，不能独立证明停止速度为零。 |
| 016 / center-high / single-arc | v-low-high-principle/2、v-heel-height-progression/1 | 9 + 9 | 同一后刃弧线上中低位、适度升高和重新屈腿可辨；高位没有把双腿拉成反折。 | 高度差较小且弧线同时变化；不由站高低判断压力。 |
| 017 / inclination / single-turn-stop | v-heel-low-inclination/1 | 9 + 9 | 后刃弧线中膝髋配合与适量整体倾入可见，后段转向横坡并保留工作刃，手臂未主动够雪。 | 只能确认所示幅度与末态，不能据图判定个体可恢复的最大内倾。 |
| 018 / pressure-extend / same-edge-extension | v-heel-incline-extension/1 | 11 + 9 | 同一后刃弧内伸腿、收回与后段保留后刃可见；幅度较小，双脚保持固定，未见横踢后脚或膝反折。 | 本次联系图只含渲染画布，未直接审阅画布外的腿长图表；压力和停止速度也不由静帧确认。 |
| 019 / inclination / edge-release-study | v-toe-reach-snow/1 | 9 + 9 | 前刃中下肢配平与适量内倾可见，双手自然放置且保持离雪，未以手撑雪代替平衡；末段减刃恢复。 | 只支持不主动够雪的可见动作，不证明真实雪况下的最大安全内倾。 |
| 020 / pressure-flex / pressure-phase-study | v-pressure-overview/1、v11-flex/1 | 9 + 9 | 原地平板下骨盆下降、低位保持与恢复可辨；膝髋参与屈曲，没有只弯腰，透明关节观察层能区分胸廓与骨盆。 | 画布图不能测量加速度/压力，也未包含画布外高度曲线；阶段文案已在 manifest 中另读。 |
| 021 / pressure-extend / pressure-phase-study | v-pressure-overview/2、v11-extend/1 | 9 + 9 | 原地平板从较低参考位适量伸展到较高位置并恢复，足部固定，膝没有反折锁死；与 020 的升降方向相反。 | 不以静止高位推断减压；本次未直接审阅画布外高度曲线或连续加速度。 |
| 022 / pressure-flex / same-edge-absorption | v-toe-kneel-pressure/1 | 11 + 9 | 同一前刃上小幅屈腿与收住下降可见，后段继续转向横坡而保留前刃；没有猛跪或蹲到底。 | 画布外腿长曲线未纳入此次像素观察；不能用姿态证明真实吸收压力大小或停止速度。 |
| 023 / fore-aft / single-arc | v-heel-open-rear-foot/1、v-heel-open-loading/1 | 9 + 9 | 后刃弧线中身体沿板长小幅向后脚侧调整并回中，前后腿分别配合，未靠伸臂探头或大幅坐尾。 | 变化幅度较小；刚体板和位置图不表示前后脚不同刃角、压力比例或板尾弹性响应。 |
| 024 / fore-aft / single-arc | v-toe-front-participation/1 | 9 + 9 | 前刃弧线中向前脚侧的小幅调整与恢复可辨，双靴仍固定，未见用上身突然扑向板头。 | 只能观察位置关系，不能确认板头实际受力或把该摆动作为每弯强制节奏。 |
| 025 / hip-edge-change / board-coordinate-study | v11-lateral/1 | 13 + 9 | 原地板宽方向先前刃、回平板、再后刃的关系可辨；胸廓/骨盆及前后膝标注可供区分，双靴保持固定。 | 板角很小且是原地机制拆解，不能作为滑行大角度换刃或无辅助极限平衡证明。 |
| 026 / short-turns / round-linked-skid | v12-rhythm-why/1、s-short-rhythm/1、s-short-diagnosis/1 | 41 + 9 | 41 个阶段帧呈现两轮前后刃交替及四次近平板区间；转弯曲线持续延伸，屈伸发生在过渡中，肩线随动作自然改变，未见后脚独立横踢。 | 9 个多视角帧主要覆盖控制段；没有观看逐帧连续视频，不能认证所有过渡瞬间、实际滑移量或所有站姿。 |
| 027 / edge-change-up / single-transition | v12-up-drill/1、v-transition-map/1 | 9 + 9 | 后刃到前刃的单次过渡中身体适量升高；近平板前后样本 .489388/.5/.510612 姿态相近，新前刃随后建立，脚未离开固定器。 | 只覆盖这一方向与默认站姿的离散样本；没有证明全程连续速度或真实卸压。 |
| 028 / edge-change-down / lower-transition | v13-down-drill/1 | 13 + 9 | 中段骨盆和胸廓降低、腿收短，.470407/.5/.529593 附近经过低位近平板，随后腿长恢复；与 027 的较高过渡可辨。 | 阶段 .529593 与 .53 间距很小，截图不代表已逐帧确认全部过渡；不能由降低高度直接推算压力。 |
| 029 / edge-change-down / retraction-transition | v13-down-drill/2、v-transition-map/2 | 13 + 9 | 板从身体一侧经过身下再向另一侧运行，胸廓起伏较 028 温和；双腿中段收短后恢复，靴板关系保持，没有锁死躯干。 | 仅此单次后刃到前刃片段；不能推广为双方向、全部站姿或连续速度已核验。 |

## 保留的证据限制

更正与撤销：先前将 002–004 的 .25/.75 误判为回中时刻。重新核对 lesson-player/motion.ts:65–68 的 range(t)，前后位置依次为 0→1→0→−1→0，真实极值就是 .25/.75，.125/.625 只是半程。原 front/side/boots 三视角已覆盖真实极值并已实际看过，故撤销“极值采样缺口”判读，不重复截图或增加样本数量。

截图可以显示屈伸、刃角和路线的相对关系，不能独立测出压力、减速度、停止速度或加速度；也没有证明每一对相邻样本之间都连续正确。原地扶栏、单弧释放、单弯停止与连续圆弯按各自任务分别判断，未将其中一种任务的观察扩大为另一种。

透明人体属于关节观察模式，阴影与板的视觉间距也不能单独作为离雪证据。此次画布截图没有覆盖画布外的高度/腿长曲线；那些图表需要另用页面或数值证据核对。
