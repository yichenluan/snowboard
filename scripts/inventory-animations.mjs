#!/usr/bin/env node
/**
 * Inventory the checked-in guide, without a browser or third-party dependencies.
 * Run: node scripts/inventory-animations.mjs [--check]
 * --check compares committed reports and exits non-zero for stale files/errors.
 * This is a coverage/configuration audit, never a teaching-correctness verdict.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
if (process.argv.slice(2).some(arg => arg !== '--check')) throw new Error('用法：node scripts/inventory-animations.mjs [--check]');
const inputNames = ['content.json', 'animations.js', 'app.js'];
const inputs = Object.fromEntries(await Promise.all(inputNames.map(async name => [name, await readFile(resolve(root, name), 'utf8')])));
const data = JSON.parse(inputs['content.json']);
// SnowDemo only registers presets at evaluation time. No DOM, I/O, timers or
// renderer are supplied: a future module with initialization side effects fails.
const sandbox = { window: {} };
vm.runInNewContext(inputs['animations.js'], sandbox, { filename: 'animations.js', timeout: 1000 });
const library = sandbox.window.SnowDemo;
if (!library?.presets || !Array.isArray(library.types)) throw new Error('SnowDemo 导出格式已改变，请复核盘点脚本');
const issues = [];
const issue = (level, code, detail) => issues.push({ level, code, detail });
const unique = values => [...new Set(values)];
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k => [k, stable(value[k])])) : value;
const key = demo => [demo.type, demo.variant, demo.transition].filter(Boolean).join(':');
// These counts preserve the application's keys. They deliberately do NOT claim
// semantic deduplication: e.g. steering:... can still have different turnShape.
const configKey = demo => JSON.stringify(stable(Object.fromEntries(Object.entries(demo).filter(([k]) => !['title', 'focus', 'steps', 'autoplay', 'duration'].includes(k)))));
const getDemos = lesson => Array.isArray(lesson.demos) && lesson.demos.length ? lesson.demos : lesson.demo ? [lesson.demo] : [];
const sourceMap = new Map();
for (const source of data.sources) {
  for (const id of [source.id, ...(source.aliases || [])]) {
    if (sourceMap.has(id)) issue('error', 'duplicate-source', `资料 ID 或别名重复：${id}`);
    sourceMap.set(id, source);
  }
}
const resolveCitations = lesson => (lesson.citations || []).map(c => {
  const source = sourceMap.get(c.source);
  if (!source && !c.url) issue('error', 'missing-source', `${lesson.id}：${c.source}`);
  return { ...c, canonicalSource: source?.id || c.source, title: source?.title || c.source, url: source?.url || c.url || null };
});
const modelFor = type => {
  const preset = library.presets[type];
  if (!preset) return 'unknown';
  if (library.shortVariants[type]) return 'snow-short-procedural';
  if (preset.dry) return ['squat', 'calf', 'wall', 'shoulder'].includes(preset.dry) ? 'dry-standing-ik' : 'dry-planar';
  return 'snow-keyframes-ik';
};
const modelNames = {
  'snow-keyframes-ik': '雪上关键帧 + 双腿 IK',
  'snow-short-procedural': '小回转共享时序/轨迹 + 双腿 IK',
  'dry-standing-ik': '离雪站立关节模型',
  'dry-planar': '离雪侧面专用模型',
  unknown: '未归类',
};
const destinationFor = demo => {
  if (library.presets[demo.type]?.dry) return 'D6：保留离雪独立动作；逐项审阅后决定 2D / 3D';
  if (demo.pressureDiagram || demo.variant === 'phase-study') return 'D4：保留二维阶段图；人体部分另行审阅';
  if (library.shortVariants[demo.type]) return 'D5：原型验收后按变体接入共享 3D；当前冻结';
  if (['center-low', 'center-high', 'fore-aft'].includes(demo.type)) return 'D1：中立、屈伸和前后平衡 3D；当前保留旧版';
  if (['toe-edge', 'heel-edge', 'inclination'].includes(demo.type)) return 'D2：两刃非对称姿态/成角 3D；等待原型复核';
  if (['pressure-flex', 'pressure-extend', 'absorption', 'edge-change-up', 'edge-change-down', 'hip-edge-change', 'knee-edge-change', 'retraction-turns'].includes(demo.type)) return 'D4：屈伸/换刃 3D + 必要二维时间图；等待原型复核';
  return 'D3：转向/滑移/旋转 3D + 同源俯视；当前保留旧版';
};
const prototypeMatch = inputs['app.js'].match(/const prototypeModes\s*=\s*(\{[^;]+\});/);
if (!prototypeMatch) throw new Error('未找到 app.js prototypeModes，请复核 3D 入口提取方式');
const prototypeModes = vm.runInNewContext(`(${prototypeMatch[1]})`, {}, { timeout: 1000 });
const lessons = [];
const references = [];
const illustrations = [];
const lessonIds = new Set();
const moduleIds = new Set(data.modules.map(m => m.id));
const acceptedFields = new Set(['type', 'variant', 'view', 'jointLabels', 'title', 'focus', 'steps', 'autoplay', 'duration', 'edgeSide', 'trackDiagnostics', 'path', 'pressureDiagram', 'transitionReference', 'skid', 'transition', 'turnShape', 'keyframes', 'stance', 'loop']);
for (const [lessonIndex, lesson] of data.lessons.entries()) {
  if (lessonIds.has(lesson.id)) issue('error', 'duplicate-lesson', lesson.id);
  lessonIds.add(lesson.id);
  if (!moduleIds.has(lesson.module)) issue('error', 'unknown-module', `${lesson.id}：${lesson.module}`);
  if (lesson.demo && lesson.demos?.length) issue('warning', 'shadowed-demo', `${lesson.id} 同时有 demo 与 demos；app.js 只显示 demos`);
  const demos = getDemos(lesson), citations = resolveCitations(lesson);
  const entry = `https://yichenluan.github.io/snowboard-guide/#lesson=${encodeURIComponent(lesson.id)}`;
  const lessonRecord = { id: lesson.id, title: lesson.title, module: lesson.module, goal: lesson.goal, entry, citations, prototypeMode: prototypeModes[lesson.id] || null, references: [], illustration: lesson.illustration || null };
  for (const [index, demo] of demos.entries()) {
    const locator = `lessons[${lessonIndex}].${lesson.demos?.length ? `demos[${index}]` : 'demo'}`;
    if (!library.types.includes(demo.type)) issue('error', 'unknown-type', `${lesson.id} ${locator}：${demo.type}`);
    if (demo.path && !library.paths.includes(demo.path)) issue('error', 'unknown-path', `${lesson.id}：${demo.path}`);
    if (library.shortVariants[demo.type] && demo.variant && !library.shortVariants[demo.type].includes(demo.variant)) issue('error', 'unknown-short-variant', `${lesson.id}：${key(demo)}`);
    if (demo.transition && !['extend', 'flex', 'retract'].includes(demo.transition)) issue('error', 'unknown-transition', `${lesson.id}：${demo.transition}`);
    for (const field of Object.keys(demo)) if (!acceptedFields.has(field)) issue('warning', 'new-config-field', `${lesson.id}：${field}，请复核去重与迁移影响`);
    for (const step of demo.steps || []) if (step.at != null && (!Number.isFinite(step.at) || step.at < 0 || step.at > 1)) issue('error', 'invalid-phase', `${lesson.id}：${JSON.stringify(step)}`);
    const ref = { id: `${lesson.id}/${index + 1}`, lesson: lesson.id, index, locator, entry, key: key(demo), model: modelFor(demo.type), config: demo, destination: destinationFor(demo), status: 'legacy-retained-unreviewed' };
    references.push(ref); lessonRecord.references.push(ref.id);
  }
  if (lesson.illustration) {
    if (!['binding-stance', 'boot-clearance'].includes(lesson.illustration.type)) issue('error', 'unknown-illustration', `${lesson.id}：${lesson.illustration.type}`);
    illustrations.push({ lesson: lesson.id, entry, ...lesson.illustration, destination: 'D7：保留二维装备几何交互；按厂家依据独立验收', status: 'retained-2d-unreviewed' });
  }
  for (const mistake of lesson.mistakes || []) {
    if (!mistake.demoKey) continue;
    const matching = demos.filter(demo => key(demo) === mistake.demoKey);
    if (!matching.length) issue('error', 'broken-demo-key', `${lesson.id}：${mistake.demoKey}`);
    if (matching.length > 1) issue('warning', 'ambiguous-demo-key', `${lesson.id}：${mistake.demoKey} 匹配 ${matching.length} 项；按钮只打开第一项`);
  }
  lessons.push(lessonRecord);
}
for (const [id, mode] of Object.entries(prototypeModes)) {
  if (!lessonIds.has(id) || !['correct', 'error', 'drill'].includes(mode)) issue('error', 'broken-prototype-entry', `${id}：${mode}`);
}
const types = library.types.map(type => {
  const refs = references.filter(ref => ref.config.type === type);
  const aliases = library.types.filter(other => other !== type && library.presets[other].keyframes === library.presets[type].keyframes);
  return { type, title: library.presets[type].title, model: modelFor(type), references: refs.map(r => r.id), usedKeys: unique(refs.map(r => r.key)), declaredShortVariants: library.shortVariants[type] || [], sharedKeyframesWith: aliases, destination: destinationFor({ type }) };
});
const variants = unique(references.map(r => r.key)).map(variantKey => {
  const refs = references.filter(r => r.key === variantKey);
  const configurations = unique(refs.map(r => configKey(r.config))).map(JSON.parse);
  return { key: variantKey, references: refs.map(r => r.id), configurations, destination: refs[0].destination };
});
const unusedTypes = types.filter(t => !t.references.length).map(t => t.type);
for (const type of unusedTypes) issue('info', 'unused-preset', `${type} 已注册但没有课程引用；保留，不能视作已完成迁移`);
for (const type of types) {
  const unusedVariants = type.declaredShortVariants.filter(v => !references.some(r => r.config.type === type.type && r.config.variant === v));
  if (unusedVariants.length) issue('info', 'unused-short-variant', `${type.type}：${unusedVariants.join('、')}`);
}
const counts = {
  lessons: lessons.length, modules: data.modules.length,
  lessonsWithDemos: lessons.filter(l => l.references.length).length,
  lessonsWithIllustrations: illustrations.length,
  lessonsWithoutVisuals: lessons.filter(l => !l.references.length && !l.illustration).length,
  legacyDemoReferences: references.length, illustrationReferences: illustrations.length,
  siteDisplayedDemonstrations: references.length + illustrations.length,
  registeredTypes: types.length, referencedTypes: types.filter(t => t.references.length).length,
  applicationVariantKeys: variants.length,
  presentationConfigurations: unique(references.map(r => configKey(r.config))).length,
  declaredShortVariants: Object.values(library.shortVariants).reduce((n, v) => n + v.length, 0),
  prototypeModes: unique(Object.values(prototypeModes)).length,
  prototypeLessonEntries: Object.keys(prototypeModes).length,
  replacedLegacyReferences: 0,
};
const modules = data.modules.map(module => {
  const ls = lessons.filter(l => l.module === module.id), ids = new Set(ls.map(l => l.id));
  return { id: module.id, title: module.title, lessons: ls.length, demoReferences: references.filter(r => ids.has(r.lesson)).length, illustrationReferences: illustrations.filter(i => ids.has(i.lesson)).length, withoutVisuals: ls.filter(l => !l.references.length && !l.illustration).length };
});
const report = {
  schemaVersion: 1,
  inputs: Object.fromEntries(inputNames.map(name => [name, createHash('sha256').update(inputs[name]).digest('hex')])),
  scope: '静态源码覆盖盘点；课程资料为现有声明，未在此脚本重新核验；不证明教学正确或生物力学正确',
  counts, modules, types, variants, references, illustrations, lessons, issues,
  prototype: { entries: prototypeModes, homeEntry: 'https://yichenluan.github.io/snowboard-guide/3d/', status: 'review-in-progress', replacementCompleted: false },
};

const md = value => String(value ?? '—').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
const table = (headers, rows) => [`| ${headers.join(' | ')} |`, `| ${headers.map(() => '---').join(' | ')} |`, ...rows.map(row => `| ${row.map(md).join(' | ')} |`)].join('\n');
const sourceLabels = lesson => unique(lesson.citations.map(c => c.canonicalSource)).map(id => `[${id}](#source-${id.toLowerCase()})`).join('、');
const courseLink = lesson => `[${lesson.id}](${lesson.entry})`;
const lines = [
  '# 全站动画与交互示意清单',
  '',
  '由 `node scripts/inventory-animations.mjs` 生成。不要直接编辑此文件；迁移分类与人工验收说明维护在脚本，课程用途、配置和资料维护在原有源码。`node scripts/inventory-animations.mjs --check` 可检查清单是否与源码同步。完整配置、逐课资料定位和 claim 见 [JSON 清单](animation-inventory.json)。',
  '',
  '**当前不批量迁移。** 搓雪小回转原型的后刃姿态、雪靴活动与两向换刃逻辑仍是教学审阅重点。旧示意继续保留；新增 3D 入口不等于旧示意已替换。此清单核验覆盖与引用，不把源码参数、自动测试或已有资料链接当作动作正确的证明。',
  '',
  '## 数量与口径',
  '',
  table(['项目', '数量', '含义'], [
    ['课程 / 模块', `${counts.lessons} / ${counts.modules}`, '稳定课程 ID 与导航单元；不等于独立动画'],
    ['含旧动画的课程', counts.lessonsWithDemos, '按 app.js：非空 demos 优先，否则 demo'],
    ['旧动画引用', counts.legacyDemoReferences, '每个课程内每个可选示意各计 1 次，可重复引用同一模型'],
    ['装备交互图', counts.illustrationReferences, 'app.js 的 binding-stance 与 boot-clearance；非 SnowDemo 动画'],
    ['主站显示的示意总数', counts.siteDisplayedDemonstrations, '旧动画引用 + 装备图；不额外把 3D 链接计入'],
    ['无动作/装备图课程', counts.lessonsWithoutVisuals, '原理与方法仍有正文，不应为凑全 3D 强制补动画'],
    ['已注册 / 有引用的类型', `${counts.registeredTypes} / ${counts.referencedTypes}`, 'SnowDemo.types；类型不是互不共享的独立实现'],
    ['应用变体键', counts.applicationVariantKeys, 'type:variant:transition；与错误卡 demoKey 的匹配口径一致'],
    ['展示配置组合', counts.presentationConfigurations, '去掉 title/focus/steps/autoplay/duration 后按字段去重；仍含视角/图层，不等于独立动作'],
    ['小回转声明变体', counts.declaredShortVariants, '3 个类型共享 shortState，另可选 extend/flex/retract；未取笛卡尔积虚增工作量'],
    ['3D 模式 / 课程入口', `${counts.prototypeModes} / ${counts.prototypeLessonEntries}`, '另有首页入口；三种模式共享 motion.ts 状态与 scene.tsx 场景'],
    ['已替换旧引用', counts.replacedLegacyReferences, '当前 3D 是并行原型，旧课程内动画全部仍在'],
  ]),
  '',
  '## 当前实现的共享关系与迁移去向',
  '',
  '独立教学任务必须按用途验收，不能用“类型数”或“变体数”直接报工期。机械去重只帮助定位共享风险；同一动作在不同课程的文案、阶段提示与前提仍须逐条保留。当前识别出以下 4 条动作生成/绘制路径，压力图和装备图另列：',
  '',
  table(['模型', '注册类型 / 引用数', '实现与复用边界'], [
    ...Object.entries(modelNames).filter(([id]) => id !== 'unknown').map(([id, label]) => [label, `${types.filter(t => t.model === id).length} / ${references.filter(r => r.model === id).length}`, id === 'snow-short-procedural' ? 'shortRaw / shortState → skeleton；16 个小回转变体共用，必须逐变体审阅' : id === 'snow-keyframes-ik' ? 'sample / skeleton / sceneBody；sceneTrack 另行画俯视关节，迁移后应改为同一世界坐标状态' : id === 'dry-standing-ik' ? 'skeleton + sceneBody；深蹲/提踵/扶墙/绕肩不得直接套雪靴动作约束' : 'sceneDry；平板/小腿/髋/腘绳肌是独立地面任务']),
    ['压力阶段图', references.filter(r => r.config.pressureDiagram).length, 'scenePressure 叠加于屈伸示意；保留 2D 时间图，不能解释成实测压力'],
    ['装备交互', illustrations.length, 'app.js mountIllustration；保留 2D 几何表达与型号限制'],
  ]),
  '',
  '`pedalling` 与 `twist` 引用同一组 keyframes / steps；只是换了标题，不是第二套独立动作。其他类型之间可能表达同一能力，但本盘点不凭名称强行合并。',
  '',
  '建议分批去向：D1 中立/屈伸/前后平衡；D2 两刃非对称站姿和成角；D3 转向/滑移/旋转；D4 压力与换刃；D5 连弯及各纠错变体；D6 离雪专项；D7 装备与概念图。该顺序是依赖分组；当前只盘点，原型关键问题解决前不批量迁移。',
  '',
  '## 入口、发布与离线约束',
  '',
  '- 课程入口：`/#lesson=<稳定 ID>`；同课多示意由 `data-demo` 按索引切换，`showDemo` 先 destroy 再 mount，当前只挂载 1 个旧动画。下方逐项 ID 的 `/N` 表示同课第 N 个按钮，并非额外 URL 路由。',
  '- 纠错按钮按 `type:variant:transition` 匹配；`path`、`turnShape`、`edgeSide` 等不在键中。后续迁移应保留所有实际配置，不能只按 demoKey 合并。',
  '- `build.py` 把 content.json、animations.js、app.js、progression.js 和样式内联到两个相同的 HTML；课程 ID、笔记、收藏、skillProgress / skillTarget、导入导出与保存网页都应保留。',
  '- 原有 SVG 与装备图可单文件离线使用。3D 原型是单独联网页面，`file:` 导出的课程入口指向线上。未来替换前必须明确：单文件保留等价 2D 降级，还是提供含 3D 资源的离线包；不能让保存网页静默缺内容。',
  '- 首页技术全景、能力 DAG 与 shell.html 的装饰人物没有动作时间线，不计入上述动作/装备示意数量；它们的入口和能力前置关系仍属于回归范围。',
  '',
  table(['3D 来源课程', '模式', '当前状态'], Object.entries(prototypeModes).map(([id, mode]) => [`[${id}](https://yichenluan.github.io/snowboard-guide/#lesson=${id})`, `[${mode}](https://yichenluan.github.io/snowboard-guide/3d/?mode=${mode})`, '并行原型 / 教学复核中；旧示意仍保留'])),
  '',
  '## 异常和需人工审阅的差异',
  '',
  table(['级别', '类型', '详情'], issues.map(i => [i.level, i.code, i.detail])),
  '',
  '- **共享姿态风险：** 旧小回转 `shortState` 默认使用 `hipY = edge × .64`、`shoulderY = edge × .35`，两刃为同号系数镜像；这不是可靠的前后刃非对称姿态依据，不直接拷入新原型或其他课。',
  '- **多视图不是同一关节数据：** `sceneBody` 使用 IK，`sceneTrack` 按比例独立构造膝/髋/肩。旧视图看似一致也不能证明解剖关系一致；迁移时从同一个动作状态投影。',
  '- **课程标题/范围与共享动画不总相同：** `s22-warmup` 的“小幅屈伸”和 `v22-squat` 使用同一默认深蹲 keyframes；`v23-knees` 的穿靴/扣板目标却引用离雪深蹲；`v-toe-static-five` 的静态目标默认路径为 single-arc。它们是待审阅的表达差异，不在本轮擅自重写。',
  '- **诊断不是病因证明：** 多个 diagnosis 课程复用正确动作；小回转 error 3D 模式目前只覆盖急甩尾横刹，不能据此宣称覆盖旧排错课全部反例。',
  '- **资料粒度：** 现有 citations 挂在课程上；动画注释还有通用资料，但没有每个关节参数/时间点的实拍标定。下表来源是现有声明的索引，不表示已重新读取或认可所有姿态。',
  '',
  '## 迁移验收卡（每个教学任务与变体分别填写）',
  '',
  '每项记录四类状态：证据待核/已核，动作关系待审/已审，画面可读性待看/已看，交互待测/已测。只有四项完成且没有阻断缺陷才可替换；自动测试只覆盖其中可计算的几何/状态约束。',
  '',
  '1. **证据与任务：** 写清学习者前提、地形/速度/装备范围、目标板表现；记录机构一手资料页码/章节及实际视频时间点，分别列出直接支持、推导与未知。资料只支持定性关系时不编造关节角、肌肉用力或压力百分比。',
  '2. **两刃与两向过渡：** 每种前脚方向检查后刃保持、后→前释放/放平/新刃建立、前刃保持、前→后全过程；分别检验踝相对靴底、靴筒、高背接触、膝朝脚向、髋空间、躯干相对骨盆关系。不能把雪板整体滚转算成靴内踝活动，也不能只取峰值一帧。',
  '3. **板表现与时序：** 板轴、实际移动方向、工作刃、滑移、路线与阶段文案同步；侧滑先解除会造成抓刃的关系再换侧；腿长变化不等于压力大小。动作提示、身体位移箭头、外力箭头分别标清。',
  '4. **多视角审阅：** 实体和骨架并看；沿板宽、沿板长、斜前/斜后、俯视检查暂停关键帧及完整慢放。检查穿插、固定脚位、骨段长度、循环/100% 末态、模式同进度切换，保留可追溯截图/录像与具体缺陷记录。',
  '5. **错误对照边界：** 每个反例只故意改变要观察的变量；不能为突出错误制造不可达关节。旧变体全部有去向；尚未实现者继续保留并标识，不能用一个 error 模式吞掉全部反例。',
  '6. **交互、离线与数据：** 旋转/缩放、预设复位、播放后保留观察角、拖进度、速度、模式、regular/goofy、触控滚动/旋转、键盘与窄屏、WebGL 不可用的正文降级；进出课释放画布；旧备份导入及保存 HTML 重开后仍保留个人数据。',
  '7. **替换与发布：** 按本清单的引用 ID 对勾，说明旧用途与新入口映射；小批量独立提交且可 revert；对应提交 Pages 部署成功后在线复看。报告实际看过的模式/阶段和未解决项，不把测试数量当教学准确率。',
  '',
  '## 模块覆盖',
  '',
  table(['模块', '课程', '旧动画引用', '装备图', '无图课程'], modules.map(m => [m.title, m.lessons, m.demoReferences, m.illustrationReferences, m.withoutVisuals])),
  '',
  '## 注册动画类型（包含未引用预设）',
  '',
  table(['类型', '预设教学用途', '共享模型', '引用 / 键数', '去向'], types.map(t => [`\`${t.type}\`${t.sharedKeyframesWith.length ? `（同帧：${t.sharedKeyframesWith.join('、')}）` : ''}`, t.title, modelNames[t.model], `${t.references.length} / ${t.usedKeys.length}`, t.destination])),
  '',
  '## 变体键与全部实际配置',
  '',
  '每一行按应用实际键分组。配置组合保留 view、jointLabels 等展示字段，便于审查同键不同表现；它们不是多套独立动作。每个引用的完整 steps 与配置在 JSON 中保留。',
  '',
  table(['变体键', '引用 ID', '不同配置数', '去向'], variants.map(v => [`\`${v.key}\``, v.references.join('、'), v.configurations.length, v.destination])),
  '',
  '## 逐课用途、资料与替换入口',
  '',
  '所有现有旧动画均为“保留 / 未完成本轮教学验收”。未配动画的课保留正文；不视作漏迁。课程链接打开后，按清单 `/N` 查看第 N 个示意。课程级原始 locator / claim 完整写入 JSON。',
  '',
  table(['课程入口', '教学用途（原 goal）', '全部示意键（按按钮次序）', '现有资料'], lessons.map(l => [courseLink(l), `${l.title}：${l.goal}`, l.references.length ? l.references.map(id => { const r = references.find(r => r.id === id); return `${r.index + 1}. \`${r.key}\``; }).join('<br>') : l.illustration ? `交互：\`${l.illustration.type}\` → D7` : '正文保留，无动作图', sourceLabels(l)])),
  '',
  '## 现有资料索引',
  '',
  '以下读取自 content.json；日期、版本、定位属于原资料记录，本次盘点不重新验证外部页面。每课具体依据及引用范围见 JSON 的 lessons[].citations。',
  '',
  ...data.sources.map(s => `<a id="source-${s.id.toLowerCase()}"></a>\n\n- **${s.id}** [${s.title}](${s.url})（${s.org}）。${s.locator || s.summary}${s.aliases?.length ? `；兼容别名：${s.aliases.join('、')}` : ''}\n`),
  '',
  '## 输入指纹',
  '',
  table(['文件', 'SHA-256'], Object.entries(report.inputs)),
  '',
];
const outputs = { 'docs/animation-inventory.json': `${JSON.stringify(report, null, 2)}\n`, 'docs/animation-inventory.md': `${lines.join('\n')}\n` };
if (!check) await mkdir(resolve(root, 'docs'), { recursive: true });
let stale = false;
for (const [name, text] of Object.entries(outputs)) {
  if (check) {
    const previous = await readFile(resolve(root, name), 'utf8').catch(() => null);
    if (previous !== text) { console.error(`清单过期：${name}`); stale = true; }
  } else await writeFile(resolve(root, name), text);
}
const errors = issues.filter(i => i.level === 'error');
console.log(JSON.stringify({ mode: check ? 'check' : 'write', counts, issues: issues.map(i => ({ level: i.level, code: i.code, detail: i.detail })), stale }, null, 2));
if (stale || errors.length) process.exitCode = 1;
