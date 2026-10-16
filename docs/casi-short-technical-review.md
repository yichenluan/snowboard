# CASI 四级搓雪小回转六课：技术手册改写与字段来源评审

日期：2026-10-16。审读对象为工作区私存的六课完整补丁，并已整合到 `content.json`；不改变其既有动画几何。课程稳定 ID、所属模块、levelKey、全部既有 demos 配置及 review 课的完整 videoStudy 对象保留。

## 实际读取范围

1. 完整读取仓库中六课现行的 prerequisites、mechanics、execution、checks、drill、mistakes、citations、relatedLessons 与动画/真人字段。
2. 完整读取工作区 `.research/level4/CASI-Riding_LV4_EN.txt` 的印刷/PDF p.3、5、6、8。p.6 包括三核心、四高级、Creation of Variation 与 Expert Short Radius 原文；p.8 包括用量、持续时间与整体动作序列的变化。p.3/5 仅核对反馈、完整资格与任务制度边界，不把考试过程移植为课程训练流程。
3. 用本地 `.research/level4/reference-current.pdf`（CASI Reference Guide，192 页）逐页提取并实际读取 p.43、44、45、47、48、49、50、51、52、53、54、55、56、58、59 的完整文本。依次支持可动平衡、下肢转向、立刃、屈伸与控压、动作时序、转弯阶段、四高级及上下身配合。这里只读技术正文，未对插图做新的角度测量或模型标定。
4. 读取当前 `lesson-player/expert-short-turns.ts` 的任务与时序代码，核对 steering / pressure 既有映射；其他 demos 与原对象逐字段相等检查，不据此新增动画教学通过。
5. 本轮没有重新观看官方视频，也没有重读 S40/S41 网页；其现有可核查来源和既往边界保留，不刷新为本轮的新观察。S39 的 videoStudy 连同实际时刻、visible、meaning、limits 和 practice 均与当前对象完全一致。

## 官方直接要求与本站编排分开

S38 p.6 的直接要求保留：2–3 米走廊；advanced/expert speeds；expert groomed terrain；控压管理 snowboard rebound and reaction；整段保持 Core & Advanced competencies；以 turn shape and steering 控速；专家级雪板表现。走廊不是单弯半径，不添加统一 km/h、坡角、指定弯数或固定屈伸动作。

S16 p.58 的四高级含义保留：Strength & Flow 要强而可动；Arc to Arc 包含落线前抓雪与换刃时经过中立关系；Loading & Deflection 管理加载和释放的方向及结果；Steering Versatility 允许组合 pivot、edge、pressure 形成多种滑移/刻滑板表现。因此本手册用可控搓雪作为主要训练方式，但不把它说成官方排斥一切刻滑的原文规则。

S38 p.8 支持改变技能用量及持续时间、整体动作序列不大幅改换。具体一次只改一项、几弯一组、先回宽再重建短弯、排错次序和动作提示均为本站技术编排。六课现有 suggestion 引用移除“本机记录”文字，明确该边界，未增加来源 ID 或扩写官方考核项目。

## 逐课字段评审

| 课程与字段 | 技术改写内容 | 支持定位与证据层级 |
| --- | --- | --- |
| map summary / goal / prerequisites | 入口改为实际的双向控速、释放和回宽能力；目标改为理解短弯技术构成 | S38 p.6 任务目标；S16 p.43–45、47–56 的技能；进入顺序为本站建议 |
| map mechanics[0] | 正确保留任务的地形、速度、走廊与板控要求 | S38 p.6，直接支持 |
| map mechanics[1] | 解释搓雪的板轴/移动方向夹角、短弯仍需连续改向与出口，区分本站路线与官方多种板表现 | S16 p.47、58–59；结合 S38 p.6 作情境归纳 |
| map mechanics[2] | 下肢带动整板转向、肩髋配合，不固定前脚踢尾或锁腰髋 | S16 p.48、59；具体错误后果为教学归纳，不指定个体关节角 |
| map mechanics[3] | 旧刃释放、身体跨侧、新弧建立和完成出口相互重叠，非四段停顿 | S16 p.55–56、58；短弯动作应用为情境归纳 |
| map mechanics[4] | 弯中承压与转换屈伸目的区分；收伸开始和收住不能由高度代替压力 | S16 p.49、51–54；S38 p.6 的响应管理 |
| map mechanics[5] | 三核心四高级转成可观察的整段板控关系 | S38 p.6、S16 p.58；中文任务解释为归纳 |
| map execution / checks / drill / mistakes | 全部改为释放、双腿引导、新弧、出口、回宽及问题分流；移除填表、基线证据和外部反馈提交作为课内步骤 | 原理来自以上来源；具体动作安排、组数、失败分流为本站建议 |
| steering prerequisites / mechanics[1–2] / execution[1] | 去记录前置；增加低刃角时更易转向、双腿持续带板、肩抢转和固定前脚踢尾的区别 | S16 p.47–50、55–56、58–59；S38 p.6；组合为情境归纳 |
| steering drill setup / steps / success | 直接以弯宽、出口和主动恢复作练习条件，不用“有记录”代替能力 | S38 p.6/8 为目标边界；练法为本站建议 |
| pressure prerequisites / mechanics[1–2] / execution[0–1] | 去记录前置；解释承压时肌肉维持支撑但关节仍可动；明确站起/下沉启动和收住的不同；把熟悉的伸展与屈曲过渡分别说明 | S16 p.49、51–54、56；S38 p.6。两类示例不写成唯一时序，不输出压力值或肌肉配比 |
| pressure drill setup | 保持既有路线/入口，仅改一个屈伸时机；两向分别尝试 | 技能时序来自 S16 p.55；具体对照与剂量为本站建议 |
| flow mechanics[0] / execution[0–1,3] | 区分强而可动与僵锁；明确入段、短弯、主动回宽；比较最早退化的出口、释放或余量 | S16 p.43–45、49、55–56、58–59；S38 p.6/8。延长组长及诊断顺序为本站建议 |
| flow drill | 原有完整滑段动作保留；录像降为可选定位辅助，删除为录完而强撑及证据状态组织 | 全程要求由 S38 p.6 支持；剂量及恢复安排为本站建议 |
| transfer execution / checks / drill | 从“填单变量与记录状态”改为：新弧抓雪突然、出口过直、弯中跳动各对应一个可逆调整；在较宽弯有效后缩窄 | S38 p.6/8；S16 p.48–56、58–59。按现象调整的方向是待实际验证的教学假设，不给特定雪况固定角度或固定动作量 |
| review title / kind / summary / goal / prerequisites | 改成完整滑段常见错误诊断课，保留稳定课程 ID；不再以状态表或提交材料为目标 | 本站课程组织，不声称官方独立诊断任务 |
| review mechanics[0–3] | 先看最早雪板结果；区分转向不足、释放失配、屈伸时机与上下身僵锁 | S16 p.43–56、58–59；诊断关系明确使用“可能”，不是来源对个人原因的确定诊断 |
| review mechanics[4] | 只总结现有 S39 两个有限窗口可见的连续关系，保留不能测量的范围 | 沿用已有 S39 引用和 videoStudy，未声称本轮重看或扩大观察 |
| review mechanics[5] | 日常练法与专家终点分开，保留官方任务条件 | S38 p.6，直接要求；现场合格判断由原反馈建议支持 |
| review execution / checks / drill | 路线→两次换刃→响应前的屈伸→接回整段→必要时具体反馈；没有填表、十一项状态或保存几趟的要求 | 技术观察依据 S16；完整任务依据 S38；现任 L4 反馈依据已有 S38 p.3/S40。排错顺序和剂量为本站建议 |
| review mistakes | 六类具体问题：前直后刹、低位仍卡旧刃、释放后上抛、上身僵锁、单向突扫尾、后半段加速扩宽；每类均有区别原因的方法及对应练法 | S16 技能框架与 S38 板控要求下的情境诊断；不把单一症状推成唯一原因，不添加装备或临床因果结论 |
| 六课 citations suggestion | 删除退役记录系统的建议语言，改为技术安排/剂量边界 | 仍为原有 evidence=suggestion；无新来源、无提高证据等级 |

## 保留与检查

- 六课完整对象均包含 goal、prerequisites、mechanics、execution、checks、drill、mistakes、citations、relatedLessons；技术信息没有以培训流程或免责声明替代。
- steering / pressure / flow / transfer 的全部既有 demos 对象逐字段核对相等；六课来源 ID 集合不变，suggestion 引用的记录系统文字已更新。map 和 review 原无 demos，仍不虚构新动作。
- review 的全部 videoStudy 对象完全相等；没有把历史有限关键帧证据升级为完整观察、真人标定或雪上验证。
- 每项 mechanics / execution.sources 均可在本课 citations 找到；全部来源 ID、相关课和诊断课链接可解析。
- 无 assessmentProtocol / assessmentCriteriaIds 字段；没有“本课记录、十一项表、协议、复盘表、保存几趟记录”作为正文教学依赖。
- 新标签的诊断会新增对应的逐结论账条目；根代理合并后需按新字段内容重新归属来源，不能只刷新旧整课哈希。旧视频观察不变，动作示范配置不变。
- 本任务不重跑几何测试或声称动画重新通过；最终来源账、全站库存、构建和页面检查由根代理在集成后执行。

## 整合后根代理补核

根代理完整复读六课最终对象。`s-short-expert-flow.execution[2].body` 将“撑到录完”改成“撑到失控”，仍为主动恢复建议；`s-short-expert-review.videoStudy.practice` 改为正常速度理解完整弧、按两次换刃观察与选一项练习，去除记录流程措辞。历史 observedTimes、visible、meaning、limits 未改，不新增本轮真人观察状态；对应来源仍为 S39 的历史独立记录。其余合并技术正文与上述逐字段评审一致。
