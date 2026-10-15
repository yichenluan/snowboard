# 基础模块逐结论来源审查（2026-10-15）

## 直接执行

已逐课读取 stance、edging、inclination、pressure、transition 共 43 课全文，并对 98 条原 citation、107 条 mechanics 和 137 条 execution 逐项记录来源关系。范围包含课目标、前置条件、纠错、练习与验收；不是仅统计引用链接是否存在。结果保存在独立补丁，尚须主代理合并。

- [可合并补丁](../.validation/continuation/short-source-patch.json)：replaceLessonFieldsById-v1，按 lessonId 仅替换 fields 指定字段；sources 中含 S11 修订。每课携带修改前规范 JSON 的 SHA-256，遇到并行修改应逐字段合并。
- [逐结论账本](../.validation/continuation/short-source-ledger.json)：557 条记录，包括原引用、原理、操作、86 条纠错、43 个剂量、43 个课程边界与43套完整练习。每条有字段位置、结论、来源键、分类、限制及修改前内容（适用时）。
- [36 项来源证据册](../.validation/continuation/foundation-evidence-book.json)：每项记录实际读到的内容与不能外推的边界；账本内另含官方 URL。
- [修改前 43 课](../.validation/continuation/foundations-original.json)、[结构核对](../.validation/continuation/short-source-validation.json)。没有改动任何 demo/demos 字段。

97 条原引用经改写后能落到实际阅读的原文命题；另 1 条保留 unverified。这个数不代表原 97 张卡全部原样正确，更不代表整课已获直接支持。107 条 mechanics 含教学应用和诊断判断，整段标为 synthesis；137 条 execution 的顺序、口令与观察为 suggestion。纠错是待检验的假设，不是单凭一个症状确定的原因。来源卡的 direct 只限定其明确转述的原始命题。

### 实际读证据与定位

| 来源 | 本轮实际阅读 | 可支持范围与限制 |
| --- | --- | --- |
| [CASI Reference Guide](https://members.casi-acms.com/documents/Ref_Guide.pdf)（S16，©2021，192 页） | 本地原版，印刷/PDF 43–45、47–54、59–61、76、78、84–86、98、153–158、173、181–182 页 | 中立可动、下肢引导、内倾成角、屈伸加速度时序、双脚协同与装备条件。中立均衡不推广成全弯 50/50；不沿用伤病率与性别概括；不从腿长读出压力。官方 URL 以站内 source 对象为准。 |
| [SBINZ Snowboard Instructor Manual](https://www.nzsia.org/wp-content/uploads/2017/06/SBINZ_Manual_2017.pdf)（S06，2017，342 页） | 仓库原版归档，PDF 81/B06、190/E21、226–229/F05–F08 | up/down/retraction 区分、初级刻滑关节组合、回收与地形。前刃背屈限于该任务，不能规定所有高级弯固定踝角；回收不以“绝不离雪”定义。官方直连本轮 403，未声称当前线上文件相同。 |
| CASI Level 1（S03）、Level 2（A02）、Level 3（T01）官方课程 PDF | 本轮下载的 19/21/25 页版，分别 p.7–8、p.12、p.13；[文件与下载记录](../.validation/continuation/foundation-sources/manifest.json) | 可动中立、下肢花环、Freeride Flow 的屈曲过渡；考核任务和高级示例不等于所有学员的统一剂量或门槛。 |
| [AASI Snowboard Performance Guide](https://thesnowpros.org/wp-content/uploads/2025/01/SB_snowboard_performance_PG-nov2022.pdf)（S10，v2.0，2022-11-07） | 官方 PDF 经 web 读取，印刷/PDF p.3–5、11–15、25；下载返回 403 不妨碍本轮 web 正文可读 | F1–F6 与具体级别任务。p.15 二级刻滑明确屈曲释放，不能混引为中级全部伸展。p.4 F3 与任务说明有措辞张力，采用任务说明和不足栏的一致部分，不写成全书统一规则。 |
| [AASI 六项基本关系](https://thesnowpros.org/2021/01/8840/)（S01） | 正文完整六项 | 管理板长、板宽、压力大小、倾斜、枢转、扭转；不是 COM 位置单独决定所有受力。 |
| [Customised Snowboard Technique from Sweden](https://interski.nzsia.org/2019/03/19/customised-snowboard-technique-from-sweden/)（F01） | 全文、Our Reflections 与更新 | 两个 platform-angle 例子都是后刃，不能拿来直接证明前刃靴舌传力；前刃另用 S06，并保留迁移边界。 |
| [The Critical Link](https://casi-acms.com/casi-blog/the-critical-link/)（S17） | 全文六段与署名 | re-centering 与避免过早扑入新弯；是教练文章，不是动力学实验或高速弯强制竖直过渡。 |
| [NZSIA Snowboard Level Three](https://www.nzsia.org/snowboard/snowboard-level-three-new/)（S11） | 当前 Ride Module 的 Carving / Freeriding 条目 | 当前页面谈压力调节、有效刃角、侧切和适应性；没有原 source.summary 所说的“承认屈曲与伸展两种换刃策略”。补丁已修正全局说明。 |
| [OpenStax §6.1](https://openstax.org/books/university-physics-volume-1/pages/6-1-solving-problems-with-newtons-laws)（A01） | Example 6.3 / Figure 6.5 的电梯方程、恒速与下加速分支 | 平地屈伸简化类比。不能把竖直电梯公式直接当坡面转弯法向力公式。 |
| [NSAA Responsibility Code](https://www.nsaa.org/nsaa/safety/)（S18） | 原页工具失败，仅官方搜索索引第 5 条可见 | 起滑/进入雪道前向上观察的索引摘要可见，页面全文仍未核。向上坡转前观察与短暂扫描练习明确为本站建议，原引用保持 unverified。 |

CASI 原版路径为工作区根 .research/CASI-Reference-Guide.pdf，SHA-256 为 956c3ba73c3e265ca94397d9d53e4511b55df28065ea2630a3c34a690754fea7；SBINZ 归档路径为 archive/prior-session/snowboard-guide/research/sbinz-manual-2017.pdf，SHA-256 为 cf5e6004ac3dd4d48af06c391559f13f423b26d928d207a6957887fbab666d45。新版下载的 S03/A02/T01 哈希见 manifest。S10 是本轮官方 web 正文实读，未声称已保存成功下载的新 PDF。

### 关键修订前后

| 项目 | 修订前的问题 | 修订后的范围 |
| --- | --- | --- |
| v-toe-front-participation | 标题和摘要把“前脚带入”写成普遍顺序 | 以双刃基础、顺畅释放为前提的一次小幅可选观察，不是每次换刃硬规则。 |
| v17-knee-change | “按所选过渡方式协调屈腿”与伸展策略矛盾 | 按所选伸展或屈曲策略协调腿长，配合减角；腿长本身不等于即时减压。 |
| v13-down-drill | “回收不是把脚抽离雪面”容易成为定义 | 以腿板相对身体路径区分回收；贴雪只作为本站这项练习目标。 |
| v-fore-aft-roles | “只有释放完成”容易造成三步停顿 | 减旧刃与进入新路线连续衔接，再在可重复症状上试小幅前移。 |
| v-heel-counterbalance | 由观察判定沿板长压力没有突变 | 改为观察板头拖滞、板尾突扫和双脚配合，明确不能给出真实压力比例。 |
| v-pressure-overview | “压力已经很大时先吸收”像通用处方 | 压力积聚与僵硬反复同时出现时，小幅屈腿只是一个待检验选择。 |
| v-toe-tongue 等 | Ballerina 引错 p.76，背屈范围易外推 | 改 p.78；限定软靴和可控任务，保留踝活动，不规定全部高级弯恒定踝角。 |
| v15-incline-change | “落线前已有圆弧”像全级别判据 | 针对已会的连续圆弯排查长直冲，不把初学落线附近换刃本身判错。 |
| v15-gaze-drill | 起滑规则与上坡转、扫描训练混为直接支持 | 分开原规则、本站建议和原页尚未取得的证据缺口。 |
| 全部纠错与练习 | cause 容易读成唯一诊断；剂量不全 | 确定口吻改为“可先排查”；43 套不同小量任务，附休息、质量停止与退阶。 |

### 逐课覆盖

| 课程 | 原引用 / 原理 / 操作 | 本轮边界与编排 |
| --- | --- | --- |
| v-base-stance · 基本站姿：站在两脚之间，关节能动 | 3 / 3 / 3 | 均衡中立不外推为全弯50/50；关节协同不等于角度一致。 |
| v-arms-feedback · 双臂作参考：转头观察时别把板带跑 | 2 / 2 / 3 | 手臂参考线与扫描编排是本站建议，来源仅支持旋转传递与自然手臂。 |
| v-fore-aft-movement · 前后重心：调节两脚承重 | 2 / 2 / 3 | 独立屈伸能调沿板长关系，具体哪条腿屈多少为任务与个体选择。 |
| v-fore-aft-roles · 转弯时，前脚和后脚怎样配合 | 2 / 2 / 3 | 诊断为可检验假设；减刃、转向和建刃应衔接，不等待完全释放后才启动其余动作。 |
| v-fore-aft-drill · 前—中—后：感受两脚承重变化 | 1 / 2 / 3 | 保留适用范围；逐项证据、练习剂量与停止条件见账本对应 lessonId。 |
| v-toe-high-low · 前刃高低站位：蹲得下，也站得起 | 2 / 2 / 3 | 以本人舒适基线比较；正文既有2–3次建议合并到dose，避免重复剂量。 |
| v-active-passive-edge · 立刃的两种配合：身体内倾与关节成角 | 4 / 3 / 2 | 保留适用范围；逐项证据、练习剂量与停止条件见账本对应 lessonId。 |
| v-toe-static-five · 原地练前刃，再用单弯验证 | 2 / 2 / 3 | 保留适用范围；逐项证据、练习剂量与停止条件见账本对应 lessonId。 |
| v-toe-tongue · 前刃发力：胫骨贴靴舌，脚跟留在靴内 | 3 / 3 / 3 | 修正原第三引用p.76误指侧滑；Ballerina/Cowboy实际在p.78。靴舌传力是软靴教学归纳。 |
| v-toe-lock-ankle · 前刃调角：膝髋渐进移动，脚踝能调 | 3 / 3 / 3 | 保留适用范围；逐项证据、练习剂量与停止条件见账本对应 lessonId。 |
| v-heel-pull · 后刃发力：脚跟、高背板与膝髋配合 | 2 / 3 / 3 | 保留适用范围；逐项证据、练习剂量与停止条件见账本对应 lessonId。 |
| v-heel-static-repetition · 原地练后刃：立得起，也放得下 | 1 / 2 / 3 | 保留适用范围；逐项证据、练习剂量与停止条件见账本对应 lessonId。 |
| v-toe-counterbalance · 前刃成角：腿调角，上身保持平衡 | 2 / 2 / 3 | 保留适用范围；逐项证据、练习剂量与停止条件见账本对应 lessonId。 |
| v-heel-counterbalance · 后刃成角：髋向脚跟侧，上身配合平衡 | 3 / 3 / 3 | 保留适用范围；逐项证据、练习剂量与停止条件见账本对应 lessonId。 |
| v-lower-body-priority · 下肢带转向，全身配合平衡 | 2 / 3 / 3 | 保留适用范围；逐项证据、练习剂量与停止条件见账本对应 lessonId。 |
| v-heel-brief-hold · 后刃单弯：稳住一段，再完成并停住 | 1 / 2 / 3 | 保留适用范围；逐项证据、练习剂量与停止条件见账本对应 lessonId。 |
| v-heel-feedback · 检查后刃：感觉、录像和雪痕一起看 | 1 / 3 / 3 | 原引用只支持装备与活动性，不足以直接支持视频分析流程；补S10 Movement Analysis精确定位，流程保留suggestion。 |
| v-toe-ankle-role · 脚踝怎样借助雪鞋调节前刃 | 3 / 2 / 3 | F01是后刃示例，只支持COM与刃角可分开变化；前刃机制依S06，不能伪装F01直接证明。 |
| v-low-high-principle · 站多高合适：为下一次屈伸留空间 | 3 / 4 / 3 | 保留适用范围；逐项证据、练习剂量与停止条件见账本对应 lessonId。 |
| v-heel-low-inclination · 后刃内倾练习：先稳住弧线，再加幅度 | 2 / 2 / 3 | 保留适用范围；逐项证据、练习剂量与停止条件见账本对应 lessonId。 |
| v-heel-height-progression · 后刃高低对照：站高一点仍能控刃 | 2 / 2 / 3 | S11当前页只支持策略适应，具体高低对照由CASI机理归纳，不把新页面说成指定两种换刃。 |
| v-heel-incline-extension · 后刃弯里渐进伸腿与收腿 | 2 / 3 / 3 | 保留适用范围；逐项证据、练习剂量与停止条件见账本对应 lessonId。 |
| v-toe-reach-snow · 前刃内倾：手臂自然，不主动够雪 | 2 / 3 / 3 | 摸雪与折腰的原始直接支持在CASI p.98，补入以免只以一般倾斜原则代替。 |
| v-pressure-overview · 脚下压力：分清大小、方向和前后分配 | 4 / 3 / 2 | 电梯方程只解释简化竖直支撑，不能把蹲低或主观重感直接当转弯测力。 |
| v-toe-kneel-pressure · 前刃吸收压力：柔和屈腿，不猛跪 | 2 / 3 / 3 | 保留适用范围；逐项证据、练习剂量与停止条件见账本对应 lessonId。 |
| v-heel-open-rear-foot · 开放后刃：让后脚也能稳稳控刃 | 2 / 2 / 3 | 开放导致后段角度改变是可能路径，来源不支持所有开放姿势都应压后脚。 |
| v-toe-front-participation · 前刃入弯：试前脚引导，保持双脚接续 | 2 / 3 / 3 | 标题与summary收窄为前脚引导试验，避免把进阶示例写成每次前刃入弯必然前脚领先。 |
| v11-flex · 屈腿调压：开始下沉与收住动作不同 | 3 / 3 / 3 | 保留适用范围；逐项证据、练习剂量与停止条件见账本对应 lessonId。 |
| v11-extend · 伸腿调压：开始站起与停止上升不同 | 3 / 3 / 3 | 保留适用范围；逐项证据、练习剂量与停止条件见账本对应 lessonId。 |
| v11-lateral · 开放站姿：分清板头板尾与两侧板刃 | 2 / 2 / 3 | 保留适用范围；逐项证据、练习剂量与停止条件见账本对应 lessonId。 |
| v12-rhythm-why · 连弯节奏：先完成弯形，再调整快慢 | 2 / 2 / 3 | 保留适用范围；逐项证据、练习剂量与停止条件见账本对应 lessonId。 |
| v12-up-drill · 伸展式换刃：起身同时放开旧刃 | 3 / 2 / 3 | S10 p.15刻滑任务对屈曲释放有更具体要求，不拿p.14–15混合范围证明所有中级伸展过渡。 |
| v13-down-drill · 屈曲换刃与回收换刃：两种收腿方式 | 4 / 3 / 3 | 修正“回收不是把脚抽离雪面”的定义过度：贴雪是本课任务，回收本身不排除瞬间离雪。 |
| v-transition-map · 看清换刃：放旧刃、经过平板、建新刃 | 5 / 3 / 4 | 保留适用范围；逐项证据、练习剂量与停止条件见账本对应 lessonId。 |
| v14-steering · 下肢引导搓雪弯：连续转向，不甩后脚 | 3 / 3 / 4 | 保留适用范围；逐项证据、练习剂量与停止条件见账本对应 lessonId。 |
| v14-twist · 板体扭转：前后脚调刃可以有先后 | 2 / 2 / 4 | 保留适用范围；逐项证据、练习剂量与停止条件见账本对应 lessonId。 |
| v15-incline-change · 身体怎样跨过雪板进入下一弯 | 2 / 2 / 4 | 新弯上半段在落线前已有弧线是较成熟连弯观察点，不能将初级落线附近换刃一律判错。 |
| v15-gaze-drill · 转头观察时，保持原来的路线 | 2 / 2 / 4 | NSAA原页面本轮未取得完整正文；原citation向上坡移动不是当前可读第5条内容，拆成本站提前观察建议。 |
| v16-hip-change · 髋参与换刃：向板刃移动，不向板尾坐 | 1 / 2 / 4 | 保留适用范围；逐项证据、练习剂量与停止条件见账本对应 lessonId。 |
| v16-hip-drill · 髋部换侧练习：原地感知，滑行验证 | 1 / 2 / 4 | 保留适用范围；逐项证据、练习剂量与停止条件见账本对应 lessonId。 |
| v17-knee-change · 从膝的移动看踝膝髋怎样换刃 | 2 / 2 / 4 | 原execution不论所选策略一律写屈腿，改为按伸展/屈曲策略协调腿长，修正文内矛盾。 |
| v17-retract-drill · 回收式搓雪小回转：板从身下通过 | 2 / 3 / 4 | 保留适用范围；逐项证据、练习剂量与停止条件见账本对应 lessonId。 |
| s14-twist-drill · 前后脚踏动：练小幅先后调刃 | 1 / 2 / 4 | 保留适用范围；逐项证据、练习剂量与停止条件见账本对应 lessonId。 |

## 深度交互

这次资料工作可以减少错误外推，但不能替代雪上教学效果与动作画面的验证。教材中的级别考核、特定地形任务与本站先缓坡少量尝试的编排是不同层次，因此未用“43 课全部通过”总结。

仍保留两个明确限制：S18 原页全文未取得；S06 以实读旧版原始归档为证据，本轮当前在线字节不可核。下一步 030–059 阶段画面审阅单独记录，不能用这些来源卡或截图生成成功替代实际观看。
