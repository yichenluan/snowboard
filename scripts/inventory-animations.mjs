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
const inputNames = ['content.json', 'animations.js', 'app.js', 'lesson-player/registry.json'];
const inputs = Object.fromEntries(await Promise.all(inputNames.map(async name => [name, await readFile(resolve(root, name), 'utf8')])));
const data = JSON.parse(inputs['content.json']);
const registry = JSON.parse(inputs['lesson-player/registry.json']);
if(registry.version!==1 || !Array.isArray(registry.types) || registry.types.some(t=>typeof t!=='string') || new Set(registry.types).size!==registry.types.length) throw new Error('课程三维注册清单格式无效');
const partialVariants=registry.partialVariants||{};
if(Object.values(partialVariants).some(v=>!Array.isArray(v)||v.some(item=>typeof item!=='string')))throw new Error('部分迁移变体格式无效');
const drylandTypes=registry.drylandTypes||[];
if(!Array.isArray(drylandTypes)||drylandTypes.some(t=>typeof t!=='string'))throw new Error('离雪迁移类型格式无效');
const fullyImplementedTypes=new Set([...registry.types,...drylandTypes]);
const implementedTypes = new Set([...fullyImplementedTypes,...Object.keys(partialVariants)]);
const requiredTasks=registry.requiredTasks||{};
if(Object.values(requiredTasks).some(v=>!Array.isArray(v)||v.some(item=>typeof item!=='string')))throw new Error('任务门控格式无效');
const implemented=demo=>(fullyImplementedTypes.has(demo.type)&&(!requiredTasks[demo.type]||requiredTasks[demo.type].includes(demo.task)))||Boolean(partialVariants[demo.type]?.includes(demo.variant||''));
// SnowDemo only registers presets at evaluation time. No DOM, I/O, timers or
// renderer are supplied: a future module with initialization side effects fails.
const sandbox = { window: {} };
vm.runInNewContext(inputs['animations.js'], sandbox, { filename: 'animations.js', timeout: 1000 });
const library = sandbox.window.SnowDemo;
if (!library?.presets || !Array.isArray(library.types)) throw new Error('SnowDemo 导出格式已改变，请复核盘点脚本');
const issues = [];
const issue = (level, code, detail) => issues.push({ level, code, detail });
const allTypes = [...new Set([...library.types, ...implementedTypes])];
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
  if (!preset) return implementedTypes.has(type) ? 'native-3d' : 'unknown';
  if (library.shortVariants[type]) return 'snow-short-procedural';
  if (preset.dry) return ['squat', 'calf', 'wall', 'shoulder'].includes(preset.dry) ? 'dry-standing-ik' : 'dry-planar';
  return 'snow-keyframes-ik';
};
const modelNames = {
  'snow-keyframes-ik': '雪上关键帧 + 双腿 IK',
  'snow-short-procedural': '小回转共享时序/轨迹 + 双腿 IK',
  'dry-standing-ik': '离雪站立关节模型',
  'dry-planar': '离雪侧面专用模型',
  'native-3d': '原生三维独立任务（无旧预设）',
  unknown: '未归类',
};
const destinationFor = demo => {
  if(drylandTypes.includes(demo.type))return 'D6：独立普通鞋课内 3D；接触、骨架与实体同源，逐任务验收见 lesson-player-review.md';
  if(implemented(demo)) return `${['center-low','center-high','fore-aft'].includes(demo.type)?'D1':['toe-edge','heel-edge','inclination'].includes(demo.type)?'D2':['pressure-flex','pressure-extend','edge-change-up','edge-change-down','hip-edge-change','knee-edge-change','retraction-turns'].includes(demo.type)?'D4':'D3'}：已接入课内 3D；画面审阅与证据边界见 lesson-player-review.md`;
  if(partialVariants[demo.type]&&!demo.variant)return `D4：仅${partialVariants[demo.type].join('、')}已接入；其他任务仍待独立迁移`;
  if (library.presets[demo.type]?.dry) return 'D6：保留离雪独立动作；逐项审阅后决定 2D / 3D';
  if (demo.pressureDiagram || demo.variant === 'phase-study') return 'D4：保留二维阶段图；人体部分另行审阅';
  if (library.shortVariants[demo.type]) return 'D5：按变体独立审阅后接入共享 3D；待迁移';
  if (['center-low', 'center-high', 'fore-aft'].includes(demo.type)) return 'D1：中立、屈伸和前后平衡 3D；当前保留旧版';
  if (['toe-edge', 'heel-edge', 'inclination'].includes(demo.type)) return 'D2：两刃非对称姿态/成角 3D；等待原型复核';
  if (['pressure-flex', 'pressure-extend', 'absorption', 'edge-change-up', 'edge-change-down', 'hip-edge-change', 'knee-edge-change', 'retraction-turns'].includes(demo.type)) return 'D4：屈伸/换刃 3D + 必要二维时间图；待独立迁移';
  return 'D3：转向/滑移/旋转 3D + 同源俯视；当前保留旧版';
};
const prototypeMatch = inputs['app.js'].match(/const prototypeModes\s*=\s*(\{[^;]+\});/);
if (!prototypeMatch) throw new Error('未找到 app.js prototypeModes，请复核 3D 入口提取方式');
const prototypeModes = vm.runInNewContext(`(${prototypeMatch[1]})`, {}, { timeout: 1000 });
const lessons = [];
const references = [];
const illustrations = [];
// Explicitly reviewed entries; new equipment illustrations remain unreviewed.
const reviewedIllustrations = new Set(["v23-angles:binding-stance", "s23-boot-centering:boot-clearance"]);
const lessonIds = new Set();
const moduleIds = new Set(data.modules.map(m => m.id));
const acceptedFields = new Set(['type', 'variant', 'view', 'jointLabels', 'title', 'focus', 'steps', 'autoplay', 'duration', 'edgeSide', 'trackDiagnostics', 'path', 'pressureDiagram', 'legLengthDiagram', 'transitionReference', 'skid', 'transition', 'turnShape', 'keyframes', 'stance', 'loop', 'task', 'fromEdge', 'timing', 'side', 'rotationComparison', 'twistTiming', 'posture']);
for (const [lessonIndex, lesson] of data.lessons.entries()) {
  if (lessonIds.has(lesson.id)) issue('error', 'duplicate-lesson', lesson.id);
  lessonIds.add(lesson.id);
  if (!moduleIds.has(lesson.module)) issue('error', 'unknown-module', `${lesson.id}：${lesson.module}`);
  if (lesson.demo && lesson.demos?.length) issue('warning', 'shadowed-demo', `${lesson.id} 同时有 demo 与 demos；app.js 只显示 demos`);
  const demos = getDemos(lesson), citations = resolveCitations(lesson);
  const entry = `https://jinke.me/snowboard/#lesson=${encodeURIComponent(lesson.id)}`;
  const lessonRecord = { id: lesson.id, title: lesson.title, module: lesson.module, goal: lesson.goal, entry, citations, prototypeMode: prototypeModes[lesson.id] || null, references: [], illustration: lesson.illustration || null };
  for (const [index, demo] of demos.entries()) {
    const locator = `lessons[${lessonIndex}].${lesson.demos?.length ? `demos[${index}]` : 'demo'}`;
    if (!allTypes.includes(demo.type)) issue('error', 'unknown-type', `${lesson.id} ${locator}：${demo.type}`);
    if(requiredTasks[demo.type]&&!requiredTasks[demo.type].includes(demo.task))issue('error','missing-task',`${lesson.id}：${demo.type}需要明确受支持的task`);
    if (demo.path && !library.paths.includes(demo.path)) issue('error', 'unknown-path', `${lesson.id}：${demo.path}`);
    if (library.shortVariants[demo.type] && demo.variant && !library.shortVariants[demo.type].includes(demo.variant)) issue('error', 'unknown-short-variant', `${lesson.id}：${key(demo)}`);
    if (demo.transition && !['extend', 'flex', 'retract'].includes(demo.transition)) issue('error', 'unknown-transition', `${lesson.id}：${demo.transition}`);
    for (const field of Object.keys(demo)) if (!acceptedFields.has(field)) issue('warning', 'new-config-field', `${lesson.id}：${field}，请复核去重与迁移影响`);
    for (const step of demo.steps || []) if (step.at != null && (!Number.isFinite(step.at) || step.at < 0 || step.at > 1)) issue('error', 'invalid-phase', `${lesson.id}：${JSON.stringify(step)}`);
    const ref = { id: `${lesson.id}/${index + 1}`, lesson: lesson.id, index, locator, entry, key: key(demo), model: modelFor(demo.type), config: demo, destination: destinationFor(demo), renderer: implemented(demo)?'lesson-3d':'legacy-svg', status: implemented(demo)?'implemented-review-in-progress':'legacy-retained-unreviewed' };
    references.push(ref); lessonRecord.references.push(ref.id);
  }
  if (lesson.illustration) {
    if (!['binding-stance', 'boot-clearance'].includes(lesson.illustration.type)) issue('error', 'unknown-illustration', `${lesson.id}：${lesson.illustration.type}`);
    illustrations.push({ lesson: lesson.id, entry, ...lesson.illustration, destination: 'D7：保留二维装备几何交互；来源与实际验收见 lesson-equipment-review.md', status: reviewedIllustrations.has(`${lesson.id}:${lesson.illustration.type}`) ? 'retained-2d-reviewed' : 'retained-2d-unreviewed' });
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
const types = allTypes.map(type => {
  const refs = references.filter(ref => ref.config.type === type);
  const aliases = library.types.filter(other => other !== type && library.presets[type] && library.presets[other].keyframes === library.presets[type].keyframes);
  const connected = refs.filter(ref => ref.renderer === 'lesson-3d').length;
  const destination = refs.length
    ? `${connected}/${refs.length} 个当前课程引用已接入课内 3D；${partialVariants[type] ? `仅支持列明变体 ${partialVariants[type].join('、')}，未引用的其他变体不在接入范围` : '实际支持范围仍按 task／变体门控'}；逐引用去向见下表`
    : '旧预设保留作来源盘点；当前没有课程引用，不计入已接入引用';
  return { type, title: library.presets[type]?.title ?? type, model: modelFor(type), references: refs.map(r => r.id), usedKeys: unique(refs.map(r => r.key)), declaredShortVariants: library.shortVariants[type] || [], sharedKeyframesWith: aliases, destination };
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
  reviewedIllustrations: illustrations.filter(i=>i.status==='retained-2d-reviewed').length,
  registeredTypes: types.length, referencedTypes: types.filter(t => t.references.length).length,
  applicationVariantKeys: variants.length,
  presentationConfigurations: unique(references.map(r => configKey(r.config))).length,
  declaredShortVariants: Object.values(library.shortVariants).reduce((n, v) => n + v.length, 0),
  prototypeModes: unique(Object.values(prototypeModes)).length,
  prototypeLessonEntries: Object.keys(prototypeModes).length,
  implemented3DTypes: implementedTypes.size,
  fullyImplemented3DTypes:fullyImplementedTypes.size,
  partiallyImplemented3DTypes:Object.keys(partialVariants).length,
  implemented3DReferences: references.filter(r=>r.renderer==='lesson-3d').length,
  remainingLegacyReferences: references.filter(r=>r.renderer==='legacy-svg').length,
  replacedLegacyReferences: references.filter(r=>r.renderer==='lesson-3d').length,
};
const modules = data.modules.map(module => {
  const ls = lessons.filter(l => l.module === module.id), ids = new Set(ls.map(l => l.id));
  return { id: module.id, title: module.title, lessons: ls.length, demoReferences: references.filter(r => ids.has(r.lesson)).length, illustrationReferences: illustrations.filter(i => ids.has(i.lesson)).length, withoutVisuals: ls.filter(l => !l.references.length && !l.illustration).length };
});
const report = {
  schemaVersion: 1,
  inputs: Object.fromEntries(inputNames.map(name => [name, createHash('sha256').update(inputs[name]).digest('hex')])),
  scope: '静态源码覆盖盘点：model、共享关键帧与预设名称描述 animations.js 的旧实现来源，renderer 和注册表计数描述当前课程接入；legacyDemoReferences 是迁移范围总数，不是当前旧播放器数量。课程资料未在此脚本重新核验；接入数量不证明教学正确、生物力学正确或发布完成',
  counts, modules, types, variants, references, illustrations, lessons, issues,
  prototype: { entries: prototypeModes, homeEntry: null, scope: '独立原型保留对应课程入口，首页不再单独展示；本对象不表示课内引用接入状态，后者见 counts 与 references', status: 'review-in-progress', replacementCompleted: false },
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
  `**当前课程动画接入：${counts.implemented3DReferences}/${counts.legacyDemoReferences}。** ${counts.remainingLegacyReferences ? `仍有 ${counts.remainingLegacyReferences} 个引用使用旧播放器。` : '当前引用均由课内三维播放器接管，旧播放器引用为 0。'}另有 ${counts.illustrationReferences} 项装备交互保留二维。下文的旧模型与共享关键帧是来源盘点，不代表当前渲染。接入数量不代表教学认证或发布完成；实际观察与边界见 [课程播放器审阅](lesson-player-review.md)。`,
  '',
  '## 数量与口径',
  '',
  table(['项目', '数量', '含义'], [
    ['课程 / 模块', `${counts.lessons} / ${counts.modules}`, '稳定课程 ID 与导航单元；不等于独立动画'],
    ['含动画的课程', counts.lessonsWithDemos, '按 app.js：非空 demos 优先，否则 demo'],
    ['迁移范围内的动画引用', counts.legacyDemoReferences, '每个课程内每个可选示意各计 1 次，可重复引用同一模型'],
    ['装备交互图', counts.illustrationReferences, 'app.js 的 binding-stance 与 boot-clearance；非 SnowDemo 动画'],
    ['已独立审阅的装备图', counts.reviewedIllustrations, '保留二维；来源、几何与实际交互范围见 lesson-equipment-review.md'],
    ['主站显示的示意总数', counts.siteDisplayedDemonstrations, '课程动画引用 + 装备图；不额外把独立 3D 链接计入'],
    ['无动作/装备图课程', counts.lessonsWithoutVisuals, '原理与方法仍有正文，不应为凑全 3D 强制补动画'],
    ['注册 / 当前有引用的类型', `${counts.registeredTypes} / ${counts.referencedTypes}`, '按旧预设与课内注册表并集盘点；不等于当前三维模块数'],
    ['应用变体键', counts.applicationVariantKeys, 'type:variant:transition；与错误卡 demoKey 的匹配口径一致'],
    ['展示配置组合', counts.presentationConfigurations, '去掉 title/focus/steps/autoplay/duration 后按字段去重；仍含视角/图层，不等于独立动作'],
    ['旧小回转声明变体', counts.declaredShortVariants, 'animations.js 中 3 个类型共享 shortState；当前实现按独立任务和过渡方式接入，不以旧声明推定支持组合'],
    ['3D 模式 / 课程入口', `${counts.prototypeModes} / ${counts.prototypeLessonEntries}`, '首页已移除独立入口；三种模式共享 motion.ts 状态与 scene.tsx 场景'],
    ['课内三维类型 / 引用', `${counts.implemented3DTypes} / ${counts.implemented3DReferences}`, '按注册表已切换默认渲染；不代表教学认证'],
    ['类型注册 / 变体白名单接入类型', `${counts.fullyImplemented3DTypes} / ${counts.partiallyImplemented3DTypes}`, `${counts.partiallyImplemented3DTypes} 个 partial 类型仅支持列明变体；${counts.remainingLegacyReferences ? '当前引用是否已接入按逐项配置统计' : '其当前课程引用均已接入，未引用的其他变体不支持'}；类型注册也仍受 task 门控`],
    ['当前使用旧播放器的引用', counts.remainingLegacyReferences, '按逐引用 renderer 统计；保留旧源码不等于仍有旧播放器引用'],
  ]),
  '',
  '## 旧实现来源的共享关系与当前接入',
  '',
  '以下 4 条路径由 animations.js 旧生成器提取，用于追溯迁移来源；不是当前课内三维的实现架构。引用数表示这些旧预设在课程配置中的对应数量。当前接入以 renderer／task 和逐引用去向为准，同一动作在不同课程的文案、阶段提示与前提仍须逐条核对。',
  '',
  table(['旧来源模型／辅助图', '旧注册类型 / 当前引用数', '旧来源与当前实现的边界'], [
    ...Object.entries(modelNames).filter(([id]) => id !== 'unknown').map(([id, label]) => [label, `${types.filter(t => t.model === id).length} / ${references.filter(r => r.model === id).length}`, id === 'snow-short-procedural' ? '旧 shortRaw / shortState → skeleton；当前小回转由独立任务编排，不能用旧共享关系推定动作相同' : id === 'snow-keyframes-ik' ? '旧 sample / skeleton / sceneBody 与另画的 sceneTrack；当前三维与平面骨架从同一动作状态投影' : id === 'dry-standing-ik' ? '旧 skeleton + sceneBody；当前离雪任务使用独立普通鞋模型和任务接触约束' : '旧 sceneDry；当前平板、小腿、髋和腘绳肌任务各自保留地面任务语义']),
    ['压力阶段图', references.filter(r => r.config.pressureDiagram).length, '旧来源为 scenePressure；当前保留必要二维时间图，不能解释成实测压力'],
    ['装备交互', illustrations.length, 'app.js mountIllustration；保留 2D 几何表达与型号限制'],
  ]),
  '',
  '旧 animations.js 的 `pedalling` 与 `twist` 共享 keyframes / steps。当前 `pedalling` 没有课程引用，`twist` 的两个引用使用局部板面扭转任务，不能再把旧共享关键帧当作当前实现。其他类型也不凭名称强行合并。',
  '',
  '分批去向：D1 中立/屈伸/前后平衡；D2 两刃非对称站姿和成角；D3 转向/滑移/旋转；D4 压力与换刃；D5 连弯及各纠错变体；D6 离雪专项；D7 装备与概念图。共用装备和骨长约束，姿态、时序、路线与末态按任务独立审阅。',
  '',
  '## 入口、发布与离线约束',
  '',
  '- 课程入口：`/#lesson=<稳定 ID>`；同课多示意由 `data-demo` 按索引切换，`showDemo` 先 destroy 再 mount，每次只挂载当前选中的播放器。下方逐项 ID 的 `/N` 表示同课第 N 个按钮，并非额外 URL 路由。',
  '- 纠错按钮按 `type:variant:transition` 匹配；`path`、`turnShape`、`edgeSide` 等不在键中。必须保留所有实际配置，不能只按 demoKey 合并。',
  '- `build.py` 把 content.json、animations.js、app.js、progression.js 和样式内联到两个相同的 HTML；保留稳定课程 ID、GitHub 公开评论以及本机收藏、个人补充、skillProgress / skillTarget。页面已移除备份、保存网页和导入入口。',
  '- 课内三维 IIFE、样式与课程数据直接内联进单文件，无运行时外部模型、字体或 CDN；无 WebGL 时显示同源可播放骨架。独立 `/3d/` 原型及外部资料仍需联网。单文件重开验证与浏览器限制见审阅记录。',
  '- 首页技术全景、能力 DAG 与 shell.html 的装饰人物没有动作时间线，不计入上述动作/装备示意数量；它们的入口和能力前置关系仍属于回归范围。',
  '',
  table(['独立 3D 原型的来源课程', '原型模式', '与课内入口的关系'], Object.entries(prototypeModes).map(([id, mode]) => [`[${id}](https://jinke.me/snowboard/#lesson=${id})`, `[${mode}](https://jinke.me/snowboard/3d/?mode=${mode})`, '并行研究原型；不替代当前课内独立任务，也不额外计入引用覆盖'])),
  '',
  '## 异常和需人工审阅的差异',
  '',
  table(['级别', '类型', '详情'], issues.map(i => [i.level, i.code, i.detail])),
  '',
  '- **共享姿态风险：** 旧小回转 `shortState` 默认使用 `hipY = edge × .64`、`shoulderY = edge × .35`，两刃为同号系数镜像；这不是可靠的前后刃非对称姿态依据，不直接拷入新原型或其他课。',
  '- **旧多视图风险：** 旧 `sceneBody` 使用 IK，`sceneTrack` 按比例另构膝/髋/肩；旧视图看似一致不能证明解剖关系一致。当前课内三维与平面骨架使用同一动作状态，具体画面审阅另记。',
  '- **旧任务复用风险：** 旧生成器曾将热身屈伸、深蹲、穿靴扣板准备及静态调刃套入共享预设。当前课程配置已按任务区分；旧预设名称与关键帧只作来源索引，不能替代当前正文和 task 的对应检查。',
  '- **诊断不是病因证明：** 独立 `/3d/` 原型的 error 模式只覆盖其自身反例；课内小回转排错有独立任务，不能用一个原型模式推定全部反例已审阅，也不能把姿态对照当成真实病因证明。',
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
  '5. **错误对照边界：** 每个反例只故意改变要观察的变量；不能为突出错误制造不可达关节。按当前引用逐项保留任务语义；未引用、未支持的预设不算已接入，不能用一个 error 模式吞掉全部反例。',
  '6. **交互、离线与数据：** 旋转/缩放、预设复位、播放后保留观察角、拖进度、速度、模式、regular/goofy、触控滚动/旋转、键盘与窄屏、WebGL 不可用的正文降级；进出课释放画布；刷新及发布更新后仍可读取同一浏览器中的收藏、学习进度和个人补充。',
  '7. **替换与发布：** 按本清单的引用 ID 对勾，说明旧用途与新入口映射；小批量独立提交且可 revert；对应提交 Pages 部署成功后在线复看。报告实际看过的模式/阶段和未解决项，不把测试数量当教学准确率。',
  '',
  '## 模块覆盖',
  '',
  table(['模块', '课程', '当前动画引用', '装备图', '无图课程'], modules.map(m => [m.title, m.lessons, m.demoReferences, m.illustrationReferences, m.withoutVisuals])),
  '',
  '## 旧注册类型来源与当前引用接入（包含未引用预设）',
  '',
  table(['类型', '旧预设名称', '旧共享模型', '当前引用 / 键数', '当前接入'], types.map(t => [`\`${t.type}\`${t.sharedKeyframesWith.length ? `（旧同帧：${t.sharedKeyframesWith.join('、')}）` : ''}`, t.title, modelNames[t.model], `${t.references.length} / ${t.usedKeys.length}`, t.destination])),
  '',
  '## 变体键与全部实际配置',
  '',
  '每一行按应用实际键分组。配置组合保留 view、jointLabels 等展示字段，便于审查同键不同表现；它们不是多套独立动作。每个引用的完整 steps 与配置在 JSON 中保留。',
  '',
  table(['变体键', '引用 ID', '不同配置数', '去向'], variants.map(v => [`\`${v.key}\``, v.references.join('、'), v.configurations.length, v.destination])),
  '',
  '## 逐课用途、资料与替换入口',
  '',
  `每个引用的 renderer/status 保存在 JSON：lesson-3d 表示默认播放器已接入；legacy-svg 表示仍使用旧播放器，当前数量为 ${counts.remainingLegacyReferences}。status 不自动追踪人工审阅或线上发布，不能代替教学验收。未配动画的课保留正文，不视作漏迁。课程链接打开后，按清单 /N 查看第 N 个示意。`,
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
