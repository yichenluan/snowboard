# 通俗表达与独立问题修正：来源复核

日期：2026-10-15。审阅者：pilot_assessment。基线：`c8d4b36`。本记录只覆盖最终保留的内容变化；来源账从基线原账重新合并，不依赖已撤回的六课样板交付记录。

## 实际审查范围

- 对照基线逐字段读取保留差分，并单独核对六课撤回后的正文：练习卡全部移除，原有教学步骤、前置、自检和刻滑屈伸的训练流程恢复；现行保留改动主要是通俗表达、稳定分类、路线组织、重复自检去除、Pivot/S11更正及复盘说明。
- 本轮实际读取本地官方原始PDF：S16 Reference Guide p.43–44、47、49–54、58、60–61；S38 September 2025 Riding Guide p.6–8。原始文件位于工作区 `.research/level4/`。
- 本轮实际打开并读取S11现行官方网页的 Carving 与 Versatility Riding 小节。其他来源沿用原逐条人工记录，不声称本轮重新下载或重读。
- 没有新增视频观察、真人滑行测量、三维动作认证或雪上学习效果验证。原有限关键帧观察和 not_performed 边界保留。

## 直接口径修正

| sourceIds | 实际读取依据 | 本次修正与支持范围 |
| --- | --- | --- |
| S16 | [Reference Guide](https://members.casi-acms.com/documents/Ref_Guide.pdf)，p.47、60–61 | 枢转按CASI语境区分主动旋转输入、板轴相对行进方向的夹角，以及刻滑沿弧自然改变航向。不能只看到板头转向就判为主动枢转；不将人体自然转动一概判错。 |
| S11 | [Snowboard Level Three](https://www.nzsia.org/snowboard/snowboard-level-three-new/)，2026-10-15读取，Ride Module / Carving与Versatility Riding | Carving列控压、刃角与侧切、路线选择；Versatility明确包含屈曲和伸展两种换刃。因此撤销“当前网页未列明两种换刃”的旧否定；仍不能推导统一高低姿态。 |
| S38 | [Riding Module Guide](https://members.casi-acms.com/documents/Riding_LV4_EN.pdf)，September 2025，p.6–8 | 对照正式任务名与条件，确认标题通俗化不降低任务标准。小回转的advanced/expert速度、大弯的expert speed仍在正式条件处可查；7–15米和2–3米为走廊，不是弯半径。 |

以上为原始资料支持或结合原文的中文归纳，不是新测量。S11现行网页与2017旧手册继续分开，其他历史来源的版本和原文不改。

## 通俗表达与内容组织

- 日常标题中的“专家调压”改为“进阶刻滑／进阶小回转：屈伸与换刃时机”；正文按语境把组织、迁移、加载改为配合、用回自然滑行、换条件、承压或受力。Pressure没有被全面等同屈伸，正式英文任务名和原始来源名称保留。
- 身体方向、压力、板痕和路线相关措辞逐项对读：S16 p.43–44支持可动平衡，p.49–54支持调刃与屈伸作用随情境变化，p.58支持弧线与技能配合；这些不支持固定关节角、统一上下节奏或真实压力读数。
- `levelKey`为分类元数据，113课核对为基础47、进阶53、专项13；不新增资格结论。课程ID、协议ID、23个复盘课程引用均保持有效稳定身份。
- 六条navigationRoutes位于独立“进阶练习路线”页；首页保留原能力图与课程目录；原16个curriculum语义阶段保留原课程集合，新增由原标题生成的稳定ID。阶段文字通俗化不把旧审读状态转赠给不同路线。
- `s-carve-expert-pressure.mistakes[0]`的稳定ID由原错误标题派生，保持同一问题对象。新增ID不改变诊断证据等级。
- 101课删除与checks逐值相同的drill.success；原有不同标准继续保留。尤其刻滑屈伸课原checks四项与success两项均保留，不强行合并。对应被移除的31条现行来源记录完整归档到followupReviews.terminology.retiredDuplicateClaims，原始账不改。
- 复盘新增“本次不适用”，必须写原因且不计入已观察；“需发展”展示为“还需练习”。这是本站记录工具的规则，不能由CASI来源自动授予官方评分含义。原记录字段和布局保留，没有新增三项摘要或观察字段。
- 平板支撑执行文案删除与当前操作无关的病种免责声明，原起始量、呼吸和停止条件保持；来源卡的样本与剂量不外推边界保留，没有新增临床建议。
- 真人学习文案仅做通俗改写；观察窗口、时刻与原始独立记录不变，本轮没有新增实际看过的帧。

## 保留变化的逐课路径

下表列超出分类键和重复自检删除的课程变化。sourceIds为该字段旧来源链，不表示本轮重读全部来源；S11修正单独使用本次网页证据。完整差分的前后值指纹登记在followupReviews.terminology.reviewedFieldChanges。

| 课程ID | 保留并复核的字段 | sourceIds（沿用原链） |
| --- | --- | --- |
| `v-purpose` | `execution[2].title` | S03, S15 |
| `v-progression` | `execution[2].body` | S09, S11, S16 |
| `v-isolate-combine` | `mistakes[1].fix` | S03, S15, T01 |
| `v-toe-static-five` | `mistakes[1].cause` | S06, S16 |
| `v-toe-tongue` | `title` | 本站展示；原课来源范围未扩大 |
| `v-heel-pull` | `demo.title`、`execution[2].title`、`mechanics[2].body`、`title` | S16 |
| `v-heel-static-repetition` | `execution[2].title` | S06, S16 |
| `v-heel-counterbalance` | `execution[2].body` | S16 |
| `v-heel-height-progression` | `citations[2].claim`、`citations[2].locator` | S11 |
| `v-heel-incline-extension` | `mechanics[2].body` | S10, S16 |
| `v-toe-reach-snow` | `demo.focus` | 本站展示；原课来源范围未扩大 |
| `v-pressure-overview` | `execution[1].body` | S16 |
| `v-toe-front-participation` | `execution[0].body` | S16, S17 |
| `v11-flex` | `title` | 本站展示；原课来源范围未扩大 |
| `v11-extend` | `title` | 本站展示；原课来源范围未扩大 |
| `v11-lateral` | `execution[0].body`、`mistakes[0].cause` | S01, S16 |
| `v12-rhythm-why` | `mistakes[0].fix` | S06, S16 |
| `v-transition-map` | `title` | 本站展示；原课来源范围未扩大 |
| `v14-twist` | `execution[2].body` | S16 |
| `v15-incline-change` | `execution[0].body`、`mistakes[1].check` | S16, S17 |
| `s14-twist-drill` | `execution[3].observe` | S16 |
| `v-toe-closed-drill` | `execution[3].body` | S16 |
| `v19-switch` | `mechanics[1].title` | S16 |
| `v-toe-touch-criterion` | `mechanics[2].body`、`mechanics[2].title`、`mistakes[1].cause` | S15, S16, S38 |
| `v20-path` | `checks[2]`、`drill.progression[1]`、`drill.progression[2]`、`drill.steps[5]`、`execution[2].body`、`execution[5].body`、`execution[5].title`、`goal`、`mechanics[2].body`、`mechanics[2].title`、`mechanics[3].body`、`summary`、`title` | S10, S16, S19, S38, T02 |
| `s20-rails` | `demo.title`、`drill.progression[1]`、`title` | S16 |
| `s-short-integrated` | `drill.steps[4]`、`title` | A02, D01, S10, S16 |
| `s-short-diagnosis` | `drill.steps[2]` | D01, S10, S16 |
| `s-short-adapt` | `drill.progression[2]` | A02, S10, S16, S38 |
| `v22-strength` | `mechanics[1].title` | S16, S21, S22, S25, S27 |
| `v22-wall` | `execution[2].title` | S06, S24, S25 |
| `v22-plank` | `drill.dose`、`execution[0].body`、`mechanics[1].body` | S27, S34 |
| `v23-knees` | `mistakes[1].cause` | S16, S25, S29 |
| `v24-heel-pivot` | `demo.title` | 本站展示；原课来源范围未扩大 |
| `v-heel-two-run-claim` | `mechanics[1].title` | S16, S26 |
| `v21-method` | `execution[3].cue` | S26, T01 |
| `v3-index` | `execution[3].title` | S16, S26, T01, T02, T03 |
| `s-duck-low-linked` | `drill.progression[0]`、`drill.progression[1]`、`drill.progression[2]`、`drill.progression[3]`、`drill.steps[0]`、`mechanics[2].body` | D01, S10, S16, S19, S38 |
| `s-short-expert-map` | `checks[0]`、`drill.progression[0]`、`drill.progression[1]`、`drill.steps[3]`、`execution[2].body`、`goal`、`level`、`mechanics[0].body`、`mechanics[1].body`、`mechanics[1].title`、`mechanics[3].body`、`mechanics[3].title`、`mistakes[0].cause`、`summary`、`title` | S16, S38 |
| `s-short-expert-steering` | `demos[0].title`、`drill.progression[0]`、`drill.terrain`、`execution[2].title`、`goal`、`level`、`mechanics[0].body`、`mechanics[2].body`、`mechanics[2].title`、`mechanics[3].body`、`prerequisites[0]`、`summary`、`title` | S16, S38 |
| `s-short-expert-pressure` | `demos[0].focus`、`demos[0].title`、`drill.setup`、`drill.terrain`、`execution[0].observe`、`goal`、`level`、`mechanics[0].body`、`mechanics[1].body`、`mechanics[3].body`、`mechanics[3].title`、`prerequisites[0]`、`summary`、`title` | S16, S38 |
| `s-short-expert-flow` | `demos[0].focus`、`drill.progression[0]`、`drill.steps[3]`、`drill.terrain`、`level`、`prerequisites[0]`、`title` | S16, S38 |
| `s-short-expert-transfer` | `demos[0].focus`、`drill.steps[1]`、`drill.steps[2]`、`drill.stop[0]`、`execution[2].cue`、`level`、`mistakes[0].differentiate`、`prerequisites[1]`、`title` | S16, S38 |
| `s-short-expert-review` | `checks[0]`、`checks[2]`、`drill.progression[0]`、`execution[2].body`、`goal`、`level`、`mechanics[0].body`、`mechanics[1].body`、`prerequisites[0]`、`title` | S16, S38 |
| `s-carve-expert-arc` | `demos[0].focus`、`demos[0].title`、`drill.progression[0]`、`drill.progression[1]`、`drill.setup`、`execution[2].title`、`goal`、`level`、`mechanics[0].body`、`mechanics[1].body`、`mechanics[2].title`、`mistakes[0].fix`、`prerequisites[2]`、`summary`、`title` | S16, S38 |
| `s-carve-expert-pressure` | `assessmentCriteriaIds[0]`、`assessmentCriteriaIds[1]`、`assessmentCriteriaIds[2]`、`assessmentCriteriaIds[3]`、`assessmentCriteriaIds[4]`、`assessmentCriteriaIds[5]`、`assessmentCriteriaIds[6]`、`assessmentCriteriaIds[7]`、`assessmentCriteriaIds[8]`、`assessmentCriteriaIds[9]`、`assessmentCriteriaIds[10]`、`assessmentCriteriaIds[11]`、`drill.terrain`、`goal`、`level`、`mechanics[0].body`、`mechanics[0].title`、`mechanics[1].body`、`mechanics[2].body`、`mechanics[3].body`、`mistakes[0].error`、`mistakes[0].id`、`prerequisites[2]`、`title` | D01, S16, S38 |
| `s-carve-expert-variation` | `drill.dose`、`execution[2].body`、`level`、`mechanics[1].body`、`mechanics[2].body`、`mistakes[1].differentiate`、`mistakes[1].fix`、`prerequisites[0]`、`prerequisites[2]`、`summary`、`title` | D01, S16, S19, S38 |
| `s-carve-expert-review` | `checks[1]`、`drill.progression[0]`、`execution[2].body`、`execution[2].observe`、`execution[3].body`、`level`、`mechanics[0].body`、`mechanics[2].body`、`mechanics[2].title`、`mistakes[1].cause`、`prerequisites[0]`、`title`、`videoStudy.segments[0].limits`、`videoStudy.segments[0].visible`、`videoStudy.segments[1].visible` | S16, S38, S39, S40 |

## 审计边界与结构检查

- 基线2357条结论中，208条对应保留变化，追加本记录为补核依据；31条重复展示记录归档，没有新增结论或练习卡claims。
- 原57条未核验、rawLedgers、officialVideoObservations及未核验类别逐值保留；全部课程realFootageCalibration仍为not_performed。未由哈希变化增加教学、画面或真人通过状态。
- source-claims检查恢复既有字段契约，不保留练习卡要求。验证仍拒绝缺失绑定、结论自证、错误来源和伪造视频观察；复盘专项覆盖重点筛选、展开收起、隐藏数据持久化、不适用原因及协议隔离。
- 自动检查只确认人工记录与正文一致，不替代来源审读、三维画面和真实教学验证。
