# 逐结论来源账

更新日期：2026-10-16。当前覆盖118课、480张引用卡、2,599条结论和51个有效来源；完整数据见 [source-claim-audit.json](source-claim-audit.json)。来源目录共53项，未被现行结论使用的来源不计有效来源。

| 层级 | 当前数量 | 含义 |
| --- | ---: | --- |
| direct | 360 | 已读原文直接支持所列命题，范围不扩大为整课认证 |
| synthesis | 710 | 已读原理或明确观察用于本站情境的归纳 |
| suggestion | 1,460 | 本站步骤、练法、剂量、排错或作者动画编排 |
| unverified | 69 | 23项旧视频时刻未核验、46项真人精确标定未做 |

本轮以JSBA刻滑替代原CASI四级刻滑终点，改写六课CASI短弯技术，并退休课内训练记录系统。完整旧来源账、被替代的课程结论、协议和视频观察保存在 `rawLedgers` 与 `followupReviews.jsbaRebuild`，没有将旧CASI刻滑证据改名背书JSBA。原57条未知的历史事实仍可追溯；当前69条与历史数量不是同一分母。

本轮独立证据为 [JSBA逐字段审读](jsba-technical-source-review.md)、[CASI六课技术复核](casi-short-technical-review.md)、[衔接字段与路线复核](jsba-restructure-extra-source-review.md)、[真人实际观察](jsba-video-observation.md)和[作者动画规范](jsba-animation-spec.md)。2025新版完整教材及DVD尚未取得，公开勘误、官方规程、历史任务和个人方法分别注明，不能相互替代。

`lessons[].claims` 逐条保存路径、层级、具体来源、原文定位、独立审读依据及当前字段哈希。核心原理、步骤、引用、剂量和真人片段均绑定自身字段。改变正文必须先审读差异，再维护绑定，不能只刷新整课哈希。

`textReview` 只表示文字与引用已经审查。通用 `videoComparison` 与 `videoObservations` 关联逐课实际时刻，`sourceKind` 区分官方和个人方法；当前8条有限观察中5条为本轮新增，旧CASI刻滑复核课的观察已退休。相同视频在别课出现不会自动继承观察。`realFootageCalibration=not_performed` 与有限关键帧观察并存，不表示已经真人逐帧拟合。

运行 `npm run check:source-claims` 只读检查覆盖、引用可达、原证据对应、正文/来源/文档哈希以及视频时刻，不自动授予来源等级或教学通过。已删除协议的专用校验也已移除；证据层级字段 `assessment` 继续保留，它与退役训练记录协议无关。
