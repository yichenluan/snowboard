# 进阶动画：证据与后续独立任务

核验日期：2026-10-14。这是资料审查和实现规格，不代表这些类型已迁移或完成实拍标定。

## 实际证据

本轮实际读取工作区 `.research/CASI-Reference-Guide.pdf` p.47–54、59–61、97–99、101–102、155–158、187，查看 p.50–52、155 原始图像；官网大 PDF 请求未成功，不记为在线全文读取。

| 来源 | 定位与适用结论 |
| --- | --- |
| [CASI Reference Guide](https://members.casi-acms.com/documents/Ref_Guide.pdf) | p.47–50：板轴相对移动方向的夹角、同向与反向旋转、内倾与成角。p.51–54：屈伸启动、收住和保持不同，主动调压与地形吸收不同。 |
| 同上 | p.59–61：转向为板控组合；局部踏动涉及板扭转；刻滑与搓雪按轨迹区分。p.97–98 为初学刻滑，p.99 已转入地形适应，不能统称刻滑章节。 |
| 同上 | p.101–102：反脚从居中、停止、单弯到连弯递进。p.155–158：两刃非对称、旋转关系和个体差异；不从旧教材推广性别定型。 |
| [CASI Level 3 Teaching Module](https://members.casi-acms.com/documents/TeachingModule_LEVEL%203%20COURSE%20GUIDE-EN.pdf) | 印刷 p.13 的回收用于高级起伏地形，非默认滑法；p.14 的另一刻滑任务反而提醒换刃过屈的影响；p.15 肩髋同时反向；p.16–17 短弯避免后刃过低与前刃过倾。已在线阅读。 |
| [AASI Performance Guide](https://thesnowpros.org/wp-content/uploads/2025/01/SB_snowboard_performance_PG-nov2022.pdf) | p.5 板尾跟随板头识别刻滑；p.14–15、25 屈伸策略随任务，可用伸展、屈曲或回收。已在线阅读。 |
| [SBINZ Manual 2017](https://www.nzsia.org/wp-content/uploads/2017/06/SBINZ_Manual_2017.pdf) | 实际读历史资料 `archive/prior-session/snowboard-guide/research/sbinz-manual-2017.pdf` PDF81/印刷 B/06：屈曲为身体向板降低，回收为腿板靠近身体；地形换刃不总在低位。网页大文件读取失败。 |
| [CASI The Critical Link](https://casi-acms.com/casi-blog/the-critical-link/) | 已读正文第2–5段：过渡重整身体与支撑，避免过早过量投向新弯；不要求长时间平板或唯一屈伸方式。 |

## 每项的独立要求

| 类型 | 阶段和验收要求 |
| --- | --- |
| inclination | 同板角对照身体几何关系；实际组合须匹配速度、弯形与雪况，不把同一路线当动力学证明。 |
| pressure-extend / pressure-flex | 区分加速、减速收住和保持；高度不是压力，髋高不是 COM。阶段图只能明确表示简化垂向贡献。 |
| edge-change-up | 旧刃→伸展配合减刃→近平板→新刃；前后两向分别审阅。伸膝不等于所有关节同时伸展。 |
| edge-change-down | lower-com 表达身体相对地面降低；retraction-study 表达板腿回收、从身下通过，不能只换名字。 |
| hip-edge-change / knee-edge-change | 踝膝髋共同协调；膝不作为独立轴转关节。原地髋练习须两侧各回中，不沿路线滑走。 |
| retraction-turns | 过渡前收腿、弯内恢复；身体路线较平顺，保留搓雪滑移，不全程最低位。 |
| rotation | 下肢带板，肩髋适量同向协调；观察世界角速度和相位，不只看最终夹角。 |
| counter-rotation | 已有后刃斜滑→释放部分约束→肩髋世界朝向同时反向→同后刃调速→恢复；不能调用前刃 J 弯。 |
| mixed-rotation | 有目的的小幅反向调整后解除多余扭转，接自然同向弯；不是普通连弯的固定配方。 |
| switch | 原后脚在前行方向；鼻尾、固定器、趾侧/跟侧硬件含义不换；不能只做 regular/goofy 镜像。 |
| rail-track | 头尾实际轨迹相随、减少枢转，浅弧连续；不是把普通轨迹线画细。 |
| absorption（无课程引用） | 必须有起伏地形与接触，不能以周期蹲起或雪面穿板冒充。 |

## 已发现、待后续迁移修正的旧映射

- `v19-counter`、`v-shoulder-rhythm-map`：正文后刃调速，旧 preset 却为前刃 J 弯。需独立 speed-check，不能只翻刃角符号。
- `v24-heel-transition`：目标 heel→toe，旧默认 up 为 toe→heel，需明确起止刃。
- `v16-hip-drill`：原地、两侧回中，旧 rail 路径且末态后刃，需独立 stationary。
- `v-heel-incline-extension`：“观察相对压力”应改观察膝髋、刃角与接触连续，当前无力模型。
- 部分刻滑来源将 p.97–99 混写；需按 p.61、97–98 收紧。
- 压力图旧髋高曲线不能叫 COM 高度，也不能说从高度计算真实压力。
- `v24-skid-track` 正确浅弧只能作基线，不能同时表示多种轨迹变宽原因。

首批 inclination 数值复查：同13°板角、t=.5 时，前刃更多内倾的骨盆/胸廓跨板位移约 +.223/+.353 m，更多成角约 +.161/+.133 m；后刃约 -.281/-.316 对 -.353/-.173 m。目标几何差异成立，真实同条件动态平衡没有证明。

继续共用脚位、骨长、装备连接和渲染；按任务独立编排路线、末态、屈伸及世界旋转。局部板扭转需要新能力，不能由刚体板代替。资料链接、测试和截图均不等于连续实拍标定。
