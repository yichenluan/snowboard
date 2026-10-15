# 逐结论来源审计的读取与维护

公开记录在 [source-claim-audit.json](source-claim-audit.json)。当前覆盖 109 课、423 张引用卡、2,149 条按课程与字段定位的结论记录，使用 38 个来源，另有 1 份独立审查的顶层训练记录协议。结论数包含各课对同一原则的使用，不表示 2,149 个独立研究或实验。

三份原人工账完整保存在 `rawLedgers`，包括原文定位、阅读方法、适用边界、修改前内容和未核验记录。统一的 `lessons[].claims` 提供 `lessonId`、`path`、`assessment`、`sources` 与指回原账的 `provenance`。基础课旧账的 98 组原引用映射展开为最终 252 张引用卡；只按已读证据册的精确内容匹配，未按“同课有这个来源”自动填入支持。最后 24 课、51 字段的[编辑复核](source-editorial-followup.md)保存于 `followupReviews.editorial`，对应结论的 `editorialFollowup` 逐条关联补丁序号；原始三账保持不变。

Expert Short Radius 扩展增加六课，并审读三课的路线衔接。其[逐项人工复核](level4-source-claim-review.md)、[官方标准原文记录](level4-short-official-standards.md)和[真人有限画面记录](level4-short-video-observation.md)登记于 `evidenceDocuments`；正文变化摘要与旧结论保存在 `followupReviews.level4`。这次没有重写旧原账，也没有因来源增加而升级旧未核验项。

`direct` 只表示所列有限命题被原文或实际观察直接支持；`synthesis` 是情境归纳或待检验的原因解释；`suggestion` 是本站练习、操作、剂量或验收设计；`unverified` 保留具体缺口。练习量全部标为本站建议，没有转写成教材规定或统一处方。

审查状态分开记录：

- `textReview`：文字与来源关系已审查；有原文缺口时记 `reviewed_with_source_gap`，不因动画尚未实拍标定而把全部文字留在 partial。
- `officialVideoComparison`：三条课程获得 `limited_keyframes`，通过 `observationIds` 关联独立的 `officialVideoObservations`。原两条核心课对应[官方实拍关键帧记录](official-video-comparison.md)；新专家复核课对应[四级视频的两个窗口、15 帧](level4-short-video-observation.md)。引用同一视频不会自动获得对照状态；这项不覆盖整片、其他课或全部动画参数。
- `realFootageCalibration`：本轮全部为 `not_performed`。不把真人关键帧对照等同于逐帧几何、受力或人体参数标定。

最终文字原文获取缺口为 0。基础课原 NSAA 获取失败的两张引用卡，经 [安全规范补核](source-safety-followup.md) 改用实际可读的 CWSAA 第 4 条；统一记录保留 `originalAssessment: unverified` 和补核文档，原账未覆盖。`v20-traffic` 原先只读到 NSAA 官方域搜索规则段，也改用实际读取的 CWSAA 第 1–4 条，并保留方法澄清。S18 只留历史，不计当前有效来源。剩余 57 条未核验记录分为 24 条旧本地视频时间线、33 条逐课动画与实拍标定；它们与文字审查完成分别计数。其余课程未增加相同的未核验占位条目，但仍由逐课 `realFootageCalibration` 明确说明未作标定。

当前分层合计为 `direct` 349、`synthesis` 618、`suggestion` 1,125、`unverified` 57。十一项观察维度组成的训练记录协议整体属于本站建议，独立保存对象哈希、来源定位与人工文档；它不包含在上述课程结论计数中。

运行 `npm run check:source-claims` 检查覆盖、引用可达、原证据对应、剂量、重复结论、正文和来源哈希，以及补核文档哈希。原证据必须是合法原始账记录或已登记文档，不能指回当前结论自证；引用、原理、步骤和剂量必须绑定自身字段。`videoStudy` 整体与每个片段必须各自绑定，实际观察时刻还须对应本课同来源的独立观察记录。顶层 `assessmentProtocols` 另作整体绑定，并核对课程引用的观察维度。CI 在构建发布文件前执行同一检查。脚本通过只表示人工记录与当前内容一致，不是教学认证。

修改课程后须先复核变化涉及的结论，再更新其正文绑定、课程哈希和补核记录。原证据路径失效、来源ID不再对应或补核文档内容变化也会使检查失败；原人工记录的语义真伪仍需人工复核，不由脚本判定。检查器没有更新或自动通过模式；只重算课程哈希仍不能消除具体字段绑定失效。远端网页的新变化不会由本地哈希自动发现，下一次来源审查仍需实际读取并记录版本。
