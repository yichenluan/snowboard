# 当前项目状态与新会话入口

更新日期：2026-10-15。全站动画迁移已完成并上线；后续按用户的新请求工作，不将旧研究规格中的“待实现”或历史发布阻塞当作当前待办。本文维护交付快照和证据索引，详细研究与已执行审阅保留在各专题文档。

## 已交付范围

| 项目 | 当前状态 |
| --- | --- |
| 内容 | 102课程、13模块，`contentRevision=13` |
| 动画替换 | 134/134引用：114雪上、20离雪；旧播放器引用0 |
| 装备图 | 另2项保留二维，已独立审阅 |
| 注册范围 | 35种被引用类型：32全量类型、3按变体接入类型；全部现有引用均支持，未引用的任意变体不因此获得支持 |
| 编排粒度 | 60个显式任务、92个展示配置；引用、类型、任务和配置不是同一计数 |
| 播放与观察 | 课内三维、同源骨架降级、阶段、正常/慢放、多视角、前脚方向；具体支持项随任务变化 |
| 数据兼容 | 稳定课程ID、schemaVersion=2、笔记、收藏、补充、回收站、能力进度/目标保留；旧记录与备份合并已审计 |
| 单文件 | 主站内联三维程序、样式与正文；独立 `/3d/` 原型及外部资料仍需联网 |

可复现数量见[动画清单](animation-inventory.md)和[JSON清单](animation-inventory.json)。`absorption`、`pedalling` 是无当前课程引用的旧预设，不计入已接入任务。保留 `animations.js` 来源代码不意味着现有课程仍使用旧动画。

## 已核验的功能发布基线

- 功能实现收尾提交：`5617a6b`；随后文档修订纳入交付基线 `42f2b47d57a26af8824079b974c3dbc36ca1d657`。
- [Actions 38675176314](https://github.com/yichenluan/snowboard-guide/actions/runs/38675176314) 的build和deploy成功，部署完成于2026-10-15 11:14:43（Asia/Shanghai）。此前凭据失效已解除。
- 主站HTML与本地验收构建逐字节相同：2,037,129 bytes；SHA-256为 `28fa2506e633306c7df28aa0e75d4c6109fc254918465d65284abfb95952295a`。
- 本节记录功能验收基线，不把后续纯文档提交伪装成再次动作验收。仓库最新提交用 `git log -1` 核对，最新部署用 [Pages工作流](https://github.com/yichenluan/snowboard-guide/actions/workflows/pages.yml) 核对。

入口：[主站](https://jinke.me/) · [小回转综合课](https://jinke.me/#lesson=s-short-integrated) · [扭板](https://jinke.me/#lesson=v14-twist) · [反脚](https://jinke.me/#lesson=v19-switch) · [独立原型84%](https://jinke.me/3d/?mode=correct&t=0.84)。

## 2026-10-15 自定义域名迁移

按用户新请求，将正式入口改为 `https://jinke.me/`，仍使用原仓库和 GitHub Actions / Pages 托管。Pages 的自定义域名已配置，阿里云根域四条 A 记录及 `www` CNAME 已写入；具体记录和 HTTPS 检查见[部署说明](../DEPLOYMENT.md)。当前入口、生成清单及离线教材的线上原型回退链接同步更新，课程 ID、个人数据键、内容版本和动作模型未改变。

本次本地检查：85/85测试、类型检查、两项 Vite 构建、单文件构建及清单同步均通过。新 HTML 为2,037,101 bytes；这次域名改动不构成新的动作教学验收，上节旧功能基线的字节数与 hash 保留其历史含义。线上发布以本次提交对应的 Pages 工作流和实际 DNS / HTTPS 检查为准。

个人数据按浏览器 origin 隔离。换域前使用旧页面“备份数据”，换域后通过新页面“导入补充”恢复；不能把旧地址的重定向等同于笔记、收藏和进度自动迁移。个人备份不放入公开仓库。

## 验证范围与未完成边界

已完成的检查：

- 85/85自动测试、TypeScript检查、原型及课内两项Vite构建、Python单文件构建、清单同步、JavaScript语法和差异检查。
- 十批逐引用入口与任务审阅，包括关键阶段、前后刃与适用的两种前脚方向、实体及透视、多视角、正常播放与慢放；执行范围见[播放器审阅](lesson-player-review.md)，不是每个引用每一帧每个视角都逐帧标定。
- 按批窄屏与真实禁WebGL检查；旧记录/备份合并、内联资源及实际下载HTML内容检查。最终导出保留正文和个人数据，未完成文件直接重开与断网运行测试。
- 独立覆盖审计核对134引用映射与来源；实际内联runtime的全部引用可接入，并对每引用5个进度点采样，共670帧无异常。这只证明采样范围内可运行。
- 发布后抽查扭板、反脚、小回转、普通鞋深蹲、屈曲压力课正常播放与阶段，以及独立原型84%实体。两次离课画布由1降为0，抽查页面未捕获控制台error。线上文件一致性将本地验收版本与发布版本对应起来。

尚未完成或未建模：连续教练实拍/动作捕捉逐帧标定、实体手机完整手势与多设备全覆盖、全表面精细穿插检查、导出HTML的file直接重开/断网实测；真实板雪动力学、材料响应、足底压力和肌肉激活不在模型中。它们是明确的证据边界，不是声称已通过的事项，也不自动构成新会话的实施任务。

## 迁移批次与资料索引

所有下列批次均已纳入上述发布基线。历史检查数量只对应当批实现，不能取代最终85项检查。

| 批次 | 实现提交 | 引用数 | 任务与资料 |
| --- | --- | --- | --- |
| 基础姿态 | `e63952f` | 28 | [基础研究](lesson-foundations-research.md) |
| 转向与滑移 | `a0ce65d` | 16 | [转向研究](lesson-turning-research.md) |
| 压力与伸展转换 | `f21ce09` | 9 | [压力规格](lesson-pressure-migration-spec.md) |
| 普通鞋站立训练 | `8b86000` | 12 | [离雪研究](lesson-dryland-research.md) |
| 高级压力与转换 | `524bcaa` | 6 | [高级研究](lesson-advanced-research.md) |
| 髋膝与连续回收 | `ce4144b` | 6 | [协调研究](lesson-coordination-research.md) |
| 离雪分腿/卧跪 | `28441cb` | 8 | [离雪研究](lesson-dryland-research.md) |
| 肩臂与旋转 | `779e08a` | 12 | [旋转规格](lesson-rotation-migration-spec.md)；另[2装备图审阅](lesson-equipment-review.md) |
| 搓雪小回转 | `594d427` | 34 | [小回转规格](lesson-short-turns-migration-spec.md) |
| 反脚与扭板 | `5617a6b` | 3 | [反脚与扭板研究](lesson-switch-twist-research.md) |

共用原型依据见[教学研究](teaching-research.md)、[原型审阅](prototype-review.md)和[原型说明](../prototype/README.md)。参数必须区分资料直接支持、推导、作者编排和未知；测试自洽不能代替教学审阅。

## 新会话如何接续

1. 若在完整项目工作区，先读根目录的 `AGENTS.md` → `Agent.md` → `HANDOFF.md`。实际Git根是 `snowboard-guide/`；只拿到仓库时从本文与[README](../README.md)进入。
2. 按用户当前任务核对 `git status --short --branch`、`git fetch origin` 和本地/远端差异，保留已有修改。认证状态按实际结果判断，不照抄历史失败记录。
3. 修改课程先定位 `content.json` 的稳定ID、`lesson-player/registry.json` 的task/变体门控，再读对应动作模块、研究与审阅记录。雪上共用约束在 `prototype/motion.ts`/`scene.tsx`；普通鞋模型在 `lesson-player/dryland.ts`/`dryland-scene.tsx`。
4. 反脚用独立行进前端，保留原脚/固定器/鼻尾身份。扭板通过可选 `segmentRolls` 表达连续局部板面，靴和截面共用局部框架；默认任务仍用刚体板。不要把离雪任务、反脚或扭板退化成原型镜像。
5. Node固定为 `>=22.12.0 <23`，使用锁依赖。完整构建顺序及发布检查见[DEPLOYMENT](../DEPLOYMENT.md)；必须先 `npm run build:lessons`，再 `python3 build.py`。生成HTML和 `3d/` 不手改、不提交。
6. 修改动作时重新做受影响任务的连续阶段与实体审阅；只改文档时核对事实、路径、链接和清单，不重复声称完成新一轮画面验收。

当前没有剩余的全站迁移或凭据修复任务。后续可以按用户选择补实拍标定、真实设备/离线验证，或修正具体教学问题；不从历史文档自行恢复已完成的大任务。
