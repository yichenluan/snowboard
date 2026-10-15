#!/usr/bin/env node
/**
 * Source inventory + explicit human review ledger. No browser is executed here.
 * node scripts/inventory-teaching.mjs [--check]
 * Edit teaching-audit-review.json, never the generated reports.
 * Source presence, structural checks, observed rendering and teaching verification
 * deliberately have different fields and denominators.
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
if (args.some(arg => arg !== '--check')) throw new Error('用法：node scripts/inventory-teaching.mjs [--check]');
const check = args.includes('--check');
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value;
const hash = value => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(stable(value))).digest('hex');
const read = name => readFile(resolve(root, name), 'utf8');
const names = ['content.json', 'app.js', 'progression.js', 'styles.css', 'progression.css', 'assessment.js', 'assessment.css', 'build.py', 'shell.html', 'comments.js', 'animations.js', 'lesson-player/registry.json', 'docs/teaching-audit-review.json',
  ...(await readdir(resolve(root, 'lesson-player'))).filter(name => /\.(ts|tsx|js|css)$/.test(name)).map(name => `lesson-player/${name}`),
  ...(await readdir(resolve(root, 'prototype'))).filter(name => /\.(ts|tsx|css)$/.test(name)).map(name => `prototype/${name}`)];
const input = Object.fromEntries(await Promise.all(names.map(async name => [name, await read(name)])));
const data = JSON.parse(input['content.json']);
const manual = JSON.parse(input['docs/teaching-audit-review.json']);
const registry = JSON.parse(input['lesson-player/registry.json']);
if (manual.schemaVersion !== 1 || !Array.isArray(manual.reviewedLessons) || !Array.isArray(manual.issues) || !Array.isArray(manual.observations)) throw new Error('人工审查文件格式无效');
const digests = Object.fromEntries(names.map(name => [name, hash(input[name])]));
const lessons = new Map(data.lessons.map(lesson => [lesson.id, lesson]));
const sourceMap = new Map(data.sources.flatMap(source => [source.id, ...(source.aliases || [])].map(id => [id, source])));
const humanReads = new Map(manual.reviewedLessons.map(review => [review.id, review]));
const entryReads = new Map((manual.reviewedEntries || []).map(review => [review.id, review]));
const sourceIds = lesson => [...new Set((lesson.citations || []).map(c => sourceMap.get(c.source)?.id || c.source))];
const ref = id => `https://jinke.me/snowboard/#lesson=${encodeURIComponent(id)}`;
const demos = lesson => lesson.demos?.length ? lesson.demos : lesson.demo ? [lesson.demo] : [];
const entries = [], errors = [], warnings = [];
const uiFiles = ['app.js', 'progression.js', 'styles.css', 'progression.css', 'assessment.js', 'assessment.css', 'build.py', 'shell.html'];
const animationFiles = names.filter(name => name.startsWith('lesson-player/') || name.startsWith('prototype/'));
const observedKeys = ['pageAccessible', 'animationRendered', 'teachingVerified'];
const observations = new Map();
for (const observation of manual.observations) {
  if (!observation.id || !observation.dimension || !observedKeys.includes(observation.dimension)) throw new Error('观察记录需要 id 和独立 dimension');
  const key = `${observation.id}:${observation.dimension}`;
  if (observations.has(key)) throw new Error(`重复观察记录：${key}`);
  observations.set(key, observation);
}
function observationFor(entry, dimension, applicable = true) {
  if (!applicable) return { status: 'not-applicable', evidence: [] };
  const record = observations.get(`${entry.id}:${dimension}`);
  if (!record) return { status: 'not-verified', evidence: [] };
  if (!['passed', 'failed', 'partial', 'blocked'].includes(record.status)) throw new Error(`观察状态无效：${entry.id} ${dimension}`);
  const evidence = Array.isArray(record.evidence) ? record.evidence.filter(Boolean) : [];
  if (!evidence.length) throw new Error(`观察必须提供实际证据：${entry.id} ${dimension}`);
  // Content or runtime changes invalidate an old pass automatically.
  if (record.fingerprint !== entry.fingerprint) return { ...record, status: 'stale', previousStatus: record.status, reason: '证据指纹与当前输入不一致，保留历史观察但不计当前通过。' };
  if (dimension === 'teachingVerified' && record.status === 'passed' && (!record.sourceChecks?.length || !record.scope)) throw new Error(`教学通过必须有逐结论来源复核和核验范围：${entry.id}`);
  return { ...record, evidence };
}
function add({ id, kind, title, location, goal, payload, files = [], lessonId, sources = [], details = {}, accessible = true, animated = false, reviewPart }) {
  const entry = { id, kind, title, location, page: lessonId ? ref(lessonId) : null, goal, lessonId: lessonId || null, contentFingerprint: hash(payload),
    fingerprint: hash({ payload, files: Object.fromEntries(files.map(file => [file, digests[file] || null])) }), sources, details };
  const lessonRead = lessonId && humanReads.get(lessonId);
  const readIsCurrent = lessonRead && lessonRead.fingerprint === hash(lessons.get(lessonId));
  const entryRead = entryReads.get(id);
  entry.review = lessonRead && reviewPart && lessonRead.parts.includes(reviewPart)
    ? { status: readIsCurrent ? 'text-reviewed' : 'needs-recheck', date: lessonRead.date, reviewer: lessonRead.reviewer || null, summary: lessonRead.summary, reviewedParts: [reviewPart], evidence: [`content.json#lesson=${lessonId}`, ...(lessonRead.evidence || [])] }
    : entryRead
      ? { status: entryRead.fingerprint === entry.contentFingerprint ? 'text-reviewed' : 'needs-recheck', date: entryRead.date, reviewer: entryRead.reviewer || null, summary: entryRead.summary, reviewedParts: entryRead.parts || ['text'], evidence: entryRead.evidence || [location] }
      : { status: 'not-reviewed', reviewedParts: [], evidence: [] };
  entry.states = {
    codePresent: { status: 'present', evidence: [location] },
    pageAccessible: observationFor(entry, 'pageAccessible', accessible),
    animationRendered: observationFor(entry, 'animationRendered', animated),
    teachingVerified: observationFor(entry, 'teachingVerified', !['source', 'feature'].includes(kind)),
  };
  entry.modification = { status: 'not-recorded', evidence: [] };
  if (manual.baseline?.entryPayloadHashes && ['lesson','drill','diagnosis','animation','illustration','skill','curriculum','term','source','module','assessment-protocol','assessment-criterion','video-study','video-segment'].includes(kind)) {
    const original=manual.baseline.entryPayloadHashes[id];
    entry.modification={status:original===entry.contentFingerprint?'unchanged':original?'modified':'added',evidence:[`审查起点 ${manual.baseline.commit}；按条目内容指纹比较，不表示教学通过。`],baselineFingerprint:original||null,currentFingerprint:entry.contentFingerprint};
  }
  entry.validation = { structural: 'checked', observations: observedKeys.filter(key => entry.states[key].status === 'passed') };
  entries.push(entry);
  return entry;
}

const pages = [
  ['overview', '内容总览', '课程导航、技术分类与学习入口', 'renderOverview', data.modules],
  ['curriculum', '进阶练习路线', '按能力选择前置、当前练习和下一步', 'renderCurriculum', data.curriculum],
  ['progression', '能力图与自查', '区分结果能力、必要前置、可选辅助与并行方向', 'SnowProgression', data.progressionMap],
  ['technical-map', '动作技术全景', '联系身体动作、板控关系与滑行结果', 'renderTechnicalMap', data.technicalMap],
  ['sources', '资料与阅读依据', '找到来源版本和适用范围', 'renderSources', data.sources],
  ['additions', '我的补充与回收站', '保存待验证的个人观察，不自动纳入教学推荐', 'renderAdditions', { localStorage: true, authority: 'unverified-personal-notes' }],
  ['glossary', '全站术语表', '统一定义、别名、适用站姿和易混概念', 'glossary', data.glossary || []],
  ['prototype', '独立三维原型', '对照搓雪小回转、急甩尾与侧滑接单弯', 'prototype/main.tsx', { modes: ['correct','error','drill'], route: '/3d/' }],
];
for (const [id, title, goal, renderer, payload] of pages) {
  const e = add({ id: `page:${id}`, kind: 'page', title, goal, location: id === 'prototype' ? 'prototype/main.tsx' : `app.js#${renderer}`, files: id === 'prototype' ? animationFiles : uiFiles, payload,
    animated: id === 'prototype', details: { navigation: ['overview','prototype'].includes(id) ? '直接入口' : '站内导航／关联入口；不把源码函数存在算作页面访问' } });
  if (id === 'glossary' && !data.glossary?.length) e.states.codePresent = { status: 'missing', evidence: ['content.json 中尚无 glossary 条目'] };
}
const features = [
  ['search','搜索与过滤','按课程正文、类型及可用别名定位学习内容','app.js#matches'],
  ['bookmarks','收藏','保存常用课程，保持稳定课程 ID','app.js#save'],
  ['progress','能力自查与目标','只有前置同时通过自查才计当前能力；阅读不等于掌握','progression.js#analyze'],
  ['personal-additions','个人补充和回收站','本机保存待核实反馈，可编辑和恢复','app.js#renderAdditions'],
  ['comments','课程公开讨论','以稳定课程 ID 关联 GitHub 公开评论','comments.js'],
  ['lesson-player','课内动作播放器','显示当前动作阶段、视角、慢放、观察辅助和降级','lesson-player/main.tsx'],
  ['assessment','雪上练习证据记录','保存跨课草稿、多趟条件与观察证据，不自动评分或授予能力','assessment.js'],
  ['video-study','真人示范分析卡','区分已观察画面、教学应用和不可推断范围，按时间返回官方原片','app.js#videoStudyMarkup'],
];
for (const [id,title,goal,location] of features) add({id:`feature:${id}`,kind:'feature',title,goal,location,payload:{id,title},files:id==='lesson-player'?animationFiles:['app.js','progression.js','comments.js',...(['assessment','video-study'].includes(id)?['assessment.js','assessment.css','build.py','shell.html']:[])],details:{verification:'功能执行及用户数据恢复必须单独实测。'}});
for (const [index,module] of data.modules.entries()) add({id:`module:${module.id}`,kind:'module',title:module.title,goal:module.intro,location:`content.json#/modules/${index}`,payload:module,files:uiFiles,details:{lessons:data.lessons.filter(l=>l.module===module.id).map(l=>l.id)}});

const registered = new Set([...registry.types, ...(registry.drylandTypes || [])]);
const legacySandbox={window:{}};
vm.runInNewContext(input['animations.js'],legacySandbox,{timeout:1000});
const legacyLibrary=legacySandbox.window.SnowDemo;
const allTypes=[...new Set([...(legacyLibrary?.types||[]),...registered,...Object.keys(registry.partialVariants||{})])];
const implemented = demo => registered.has(demo.type) && (!registry.requiredTasks?.[demo.type] || registry.requiredTasks[demo.type].includes(demo.task)) || Boolean(registry.partialVariants?.[demo.type]?.includes(demo.variant || ''));
const moduleFor = demo => registry.drylandTypes?.includes(demo.type) ? 'lesson-player/dryland.ts' :
  demo.type === 'expert-short-turns' ? 'lesson-player/expert-short-turns.ts' :
  demo.type === 'duck-carve' ? 'lesson-player/carving.ts' :
  demo.type === 'switch' ? 'lesson-player/switch.ts' : demo.type === 'twist' ? 'lesson-player/twist.ts' :
  demo.type.startsWith('short-turn') ? 'lesson-player/short-turns.ts' :
  ['hip-edge-change','knee-edge-change','retraction-turns'].includes(demo.type) ? 'lesson-player/coordination.ts' :
  ['rotation','counter-rotation','mixed-rotation','shoulder-coordination'].includes(demo.type) ? 'lesson-player/rotation.ts' :
  ['steering','garland','j-turn','gaze-control','rail-track'].includes(demo.type) ? 'lesson-player/turns.ts' :
  ['pressure-flex','pressure-extend','edge-change-down'].includes(demo.type) ? 'lesson-player/pressure-advanced.ts / lesson-player/pressure.ts' :
  demo.type === 'edge-change-up' ? 'lesson-player/pressure.ts' : 'lesson-player/motion.ts';
const lessonIds = new Set();
for (const [index,lesson] of data.lessons.entries()) {
  if (lessonIds.has(lesson.id)) errors.push(`重复课程 ID：${lesson.id}`);
  lessonIds.add(lesson.id);
  const location=`content.json#/lessons/${index}`, citations=sourceIds(lesson);
  const entry = add({id:`lesson:${lesson.id}`,kind:'lesson',title:lesson.title,goal:lesson.goal,location,payload:lesson,files:uiFiles,lessonId:lesson.id,sources:citations,reviewPart:'mechanics',details:{kind:lesson.kind,module:lesson.module,prerequisites:lesson.prerequisites,relatedLessons:lesson.relatedLessons||[],citations:lesson.citations||[],animationIds:demos(lesson).map((_,i)=>`animation:${lesson.id}/${i+1}`)}});
  const required = ['goal','prerequisites','mechanics','execution','checks','drill','citations'];
  entry.structuralFindings = required.filter(field => !lesson[field] || Array.isArray(lesson[field]) && !lesson[field].length).map(field=>`缺少 ${field}`);
  for (const link of lesson.relatedLessons || []) if (!lessons.has(link)) errors.push(`${lesson.id} 的 relatedLessons 引用不存在：${link}`);
  if(lesson.assessmentProtocol){
    const protocol=(data.assessmentProtocols||[]).find(p=>p.id===lesson.assessmentProtocol);
    if(!protocol)errors.push(`${lesson.id} 的评估协议不存在：${lesson.assessmentProtocol}`);
    for(const criterion of lesson.assessmentCriteriaIds||[])if(!protocol?.criteria?.some(c=>c.id===criterion))errors.push(`${lesson.id} 的评估维度不存在：${criterion}`);
  }
  for (const citation of lesson.citations || []) if (!sourceMap.has(citation.source) && !citation.url) errors.push(`${lesson.id} 引用来源不存在：${citation.source}`);
  for(const field of ['mechanics','execution'])for(const [i,item]of (lesson[field]||[]).entries())for(const source of item.sources||[]){
    if(!sourceMap.has(source))errors.push(`${lesson.id}.${field}[${i}] 的结论来源不存在：${source}`);
    if(!(lesson.citations||[]).some(c=>c.source===source))errors.push(`${lesson.id}.${field}[${i}] 的来源 ${source} 未列于本课 citations，页面按钮会被过滤`);
  }
  if (lesson.drill) {
    const drill = add({id:`drill:${lesson.id}`,kind:'drill',title:`${lesson.title} · 练习`,goal:lesson.goal,location:`${location}/drill`,payload:lesson.drill,files:uiFiles,lessonId:lesson.id,sources:citations,reviewPart:'drill',details:{...lesson.drill,doseBoundary:'原文中的数字或次数仅按其来源/教学建议解释；缺少 dose 字段不代表正文没有任何练习量。'}});
    drill.structuralFindings = ['terrain','setup','steps','success','stop','progression'].filter(field => !lesson.drill[field] || Array.isArray(lesson.drill[field]) && !lesson.drill[field].length).map(field=>`缺少 ${field}`);
  }
  for (const [i,mistake] of (lesson.mistakes || []).entries()) {
    // A label-derived key survives reordering. Rename explicitly with `id` when
    // changing the label must retain an existing observation record.
    const key=mistake.id || hash(mistake.error).slice(0,10);
    add({id:`mistake:${lesson.id}:${key}`,kind:'diagnosis',title:mistake.error,goal:`区分可能原因并复测：${mistake.check}`,location:`${location}/mistakes/${i}`,payload:mistake,files:uiFiles,lessonId:lesson.id,sources:citations,reviewPart:'mistakes',details:{...mistake,interpretation:'页面将 cause 明确展示为可能原因；不据单一现象作唯一诊断。'}});
    if (mistake.lesson && !lessons.has(mistake.lesson)) errors.push(`${lesson.id} 的纠错课程不存在：${mistake.lesson}`);
  }
  for (const [i,demo] of demos(lesson).entries()) {
    const e=add({id:`animation:${lesson.id}/${i+1}`,kind:'animation',title:demo.title||`${lesson.title} · ${demo.type}`,goal:demo.focus||lesson.animationGuide||lesson.goal,location:`${location}/${lesson.demos?.length?`demos/${i}`:'demo'}`,payload:{demo,lessonGoal:lesson.goal,citations:lesson.citations,execution:lesson.execution},files:animationFiles,lessonId:lesson.id,sources:citations,animated:true,details:{config:demo,renderer:implemented(demo)?'lesson-3d':'unsupported-or-legacy',dataSource:moduleFor(demo),sharedContract:'prototype/motion.ts / prototype/scene.tsx（离雪使用独立普通鞋模型）',spec:{technicalId:lesson.id,context:lesson.drill?.terrain||null,phases:demo.steps||[],phaseSource:moduleFor(demo),frontRearLegTasks:lesson.execution,boardPath:demo.path||demo.task||'由运行时任务生成；请沿 dataSource 追踪',edgePressure:'刃角为几何输出；压力仅在明确图例和简化条件下示意，无实测压力或肌肉模型',annotations:demo.focus||lesson.animationGuide||null,errorComparison:(lesson.mistakes||[]).filter(m=>m.demoKey).map(m=>({error:m.error,demoKey:m.demoKey})),simplification:'程序化运动学示意；配置存在、共享骨架和数值测试不构成逐配置教学校准',unverified:['当前引用的完整过渡和循环接缝','两种前脚方向及实体多视角','与来源条件对应的真实示范比对']}}});
    if (!implemented(demo)) errors.push(`${e.id} 未被当前三维注册门控支持`);
  }
  if (lesson.illustration) add({id:`illustration:${lesson.id}`,kind:'illustration',title:lesson.title,goal:lesson.goal,location:`${location}/illustration`,payload:lesson.illustration,files:['app.js'],lessonId:lesson.id,sources:citations,details:lesson.illustration});
  if(lesson.videoStudy){
    const study=lesson.videoStudy;
    add({id:`video-study:${lesson.id}`,kind:'video-study',title:study.title,goal:study.scope,location:`${location}/videoStudy`,payload:study,files:uiFiles,lessonId:lesson.id,sources:[study.source].filter(Boolean),reviewPart:'videoStudy',details:{...study,verification:'登记文字与实际观察报告的绑定；observedTimes字段存在不证明已经看过原片。'}});
    if(!sourceMap.has(study.source))errors.push(`${lesson.id}.videoStudy 来源不存在：${study.source}`);
    if(!/^https?:\/\//.test(study.url||''))errors.push(`${lesson.id}.videoStudy 缺少可打开的原片链接`);
    for(const [i,segment]of (study.segments||[]).entries()){
      const key=segment.id||`${segment.start}-${segment.end}`;
      add({id:`video-segment:${lesson.id}:${key}`,kind:'video-segment',title:segment.label,goal:segment.meaning,location:`${location}/videoStudy/segments/${i}`,payload:{source:study.source,url:study.url,...segment},files:uiFiles,lessonId:lesson.id,sources:[study.source].filter(Boolean),reviewPart:'videoStudy',details:{...segment,realFootageCalibration:'not-performed-unless-separately-evidenced'}});
      if(!Number.isFinite(segment.start)||!Number.isFinite(segment.end)||segment.start<0||segment.end<=segment.start)errors.push(`${lesson.id}.videoStudy.segments[${i}] 时间范围无效`);
      for(const t of segment.observedTimes||[])if(!Number.isFinite(Number(t))||Number(t)<segment.start||Number(t)>segment.end)errors.push(`${lesson.id}.videoStudy.segments[${i}] 观察时间超出范围：${t}`);
      for(const field of ['label','visible','meaning','limits'])if(!segment[field])errors.push(`${lesson.id}.videoStudy.segments[${i}] 缺少 ${field}`);
    }
  }
}
for(const [index,protocol] of (data.assessmentProtocols||[]).entries()){
  const lessonUses=data.lessons.filter(l=>l.assessmentProtocol===protocol.id),sources=[...new Set(lessonUses.flatMap(sourceIds))];
  add({id:`assessment-protocol:${protocol.id}`,kind:'assessment-protocol',title:protocol.title,goal:protocol.intro,location:`content.json#/assessmentProtocols/${index}`,payload:protocol,files:uiFiles,sources,details:{...protocol,lessons:lessonUses.map(l=>l.id),boundary:'本站观察组织，不是官方评分网格；代码存在、保存成功、个人选择可重复均不构成认证。'}});
  if(!protocol.id||!Array.isArray(protocol.criteria)||!protocol.criteria.length)errors.push(`评估协议 ${protocol.id||index} 缺少稳定ID或维度`);
  for(const [i,criterion]of (protocol.criteria||[]).entries()){
    add({id:`assessment-criterion:${protocol.id}:${criterion.id}`,kind:'assessment-criterion',title:criterion.title,goal:criterion.observe||criterion.description,location:`content.json#/assessmentProtocols/${index}/criteria/${i}`,payload:{protocolId:protocol.id,...criterion},files:uiFiles,sources,lessonId:criterion.lessonId,details:{...criterion,protocolId:protocol.id,renderedIn:lessonUses.map(l=>l.id)}});
    if(!criterion.id||!criterion.title||!(criterion.observe||criterion.description))errors.push(`评估协议 ${protocol.id} 的第${i+1}项缺少ID/标题/观察方法`);
    if(criterion.lessonId&&!lessons.has(criterion.lessonId))errors.push(`评估维度 ${protocol.id}/${criterion.id} 的课程不存在：${criterion.lessonId}`);
  }
}
for (const [index,stage] of (data.curriculum || []).entries()) {
  add({id:`curriculum:${stage.id||hash(stage.title).slice(0,10)}`,kind:'curriculum',title:stage.title,goal:stage.goal,location:`content.json#/curriculum/${index}`,payload:stage,files:uiFiles,details:stage});
  for (const id of stage.lessons||[]) if(!lessons.has(id))errors.push(`路线课程不存在：${id}`);
}
for (const [index,node] of (data.progressionMap?.nodes || []).entries()) {
  add({id:`skill:${node.id}`,kind:'skill',title:node.title,goal:node.focus,location:`content.json#/progressionMap/nodes/${index}`,payload:node,files:uiFiles,details:node});
  for (const id of node.lessons||[]) if(!lessons.has(id))errors.push(`能力 ${node.id} 的课程不存在：${id}`);
}
const progressionSandbox={window:{}};
vm.runInNewContext(input['progression.js'],progressionSandbox,{timeout:1000});
if(!progressionSandbox.window.SnowProgression?.validate(data.progressionMap))errors.push('能力图结构、ID、引用或 DAG 校验未通过');
for (const [index,term] of (data.glossary || []).entries()) {
  add({id:`term:${term.id||hash(term.name||term.title).slice(0,10)}`,kind:'term',title:term.name||term.zh||term.title||term.id,goal:term.definition||term.meaning||'统一术语并说明易混概念与适用情境',location:`content.json#/glossary/${index}`,payload:term,files:uiFiles,sources:term.sources||[],details:term});
  for(const id of term.lessons||[])if(!lessons.has(id))errors.push(`术语 ${term.id} 的课程不存在：${id}`);
  for(const field of ['id','name','definition','context','confusion'])if(!term[field])errors.push(`术语 ${term.id||index} 缺少 ${field}`);
}
for (const [index,source] of data.sources.entries()) add({id:`source:${source.id}`,kind:'source',title:source.title,goal:source.summary,location:`content.json#/sources/${index}`,payload:source,files:['app.js'],details:{...source,usage:data.lessons.filter(l=>sourceIds(l).includes(source.id)).map(l=>l.id),verification:'登记引用存在和用途；未自动联网重读、未把链接可达当成结论成立。'}});
const animationEntries=entries.filter(entry=>entry.kind==='animation');
for(const type of allTypes){
  const refs=animationEntries.filter(entry=>entry.details.config.type===type);
  add({id:`animation-type:${type}`,kind:'animation-type',title:legacyLibrary?.presets?.[type]?.title||type,goal:refs.length?'列明该类型被哪些课程和任务引用；不把类型注册作为逐配置审查通过':'旧预设来源登记；当前没有课程引用，不计页面已展示',location:'lesson-player/registry.json / animations.js',payload:{type,requiredTasks:registry.requiredTasks?.[type],partialVariants:registry.partialVariants?.[type],references:refs.map(e=>e.id)},files:animationFiles,accessible:false,details:{references:refs.map(e=>e.id),currentRegistered:registered.has(type)||Object.hasOwn(registry.partialVariants||{},type),unreferenced:!refs.length}});
}
for(const task of [...new Set(animationEntries.map(entry=>entry.details.config.task).filter(Boolean))]){
  const refs=animationEntries.filter(entry=>entry.details.config.task===task);
  add({id:`animation-task:${task}`,kind:'animation-task',title:task,goal:[...new Set(refs.map(e=>e.goal))].join('；'),location:[...new Set(refs.map(e=>e.details.dataSource))].join(' / '),payload:{task,references:refs.map(e=>e.id),configurations:refs.map(e=>e.details.config)},files:animationFiles,accessible:false,sources:[...new Set(refs.flatMap(e=>e.sources))],details:{references:refs.map(e=>e.id),scope:'任务仅作去重索引；逐引用显示目标、配置、画面和教学证据见 animation 条目。'}});
}
for(const [mode,title,goal]of [['correct','连续搓雪小回转参考','观察圆弧、可控滑移和两向转换'],['error','急甩尾反例','分辨弯尾集中横刹与整弯控速'],['drill','侧滑接单弯','观察同刃侧滑、旧刃释放与单弯接续']]){
  const entry=add({id:`prototype:${mode}`,kind:'prototype-animation',title,goal,location:`prototype/main.tsx?mode=${mode}`,payload:{mode},files:animationFiles,animated:true,sources:['S16','A02','A03'],details:{route:`https://jinke.me/snowboard/3d/?mode=${mode}`,source:'prototype/motion.ts / prototype/lesson.ts / prototype/scene.tsx',scope:'独立原型实际观察单独登记，不从课内同源模型继承通过。'}});
  entry.page=entry.details.route;
}

const ids=new Set();
for (const entry of entries) { if(ids.has(entry.id))errors.push(`重复清单 ID：${entry.id}`);ids.add(entry.id); }
for (const record of manual.observations) if(!ids.has(record.id))errors.push(`观察记录 ID 不存在：${record.id}`);
for (const record of (manual.reviewedEntries || [])) if(!ids.has(record.id))errors.push(`正文审读记录 ID 不存在：${record.id}`);
function resolved(issue) {
  const rule=issue.resolution;
  if(!rule)return false;
  if(rule.kind==='lesson-present')return lessons.has(rule.lessonId);
  if(rule.kind==='glossary-present')return Boolean(data.glossary?.length);
  if(rule.kind==='text-absent')return rule.lessonIds.every(id=>lessons.has(id)&&rule.texts.every(text=>!JSON.stringify(lessons.get(id)).includes(text)));
  return false;
}
const issues=manual.issues.map(issue=>({...issue,modification:resolved(issue)?'implemented-awaiting-verification':issue.modification}));
for (const entry of entries) {
  entry.issues=issues.filter(issue=>issue.entryIds.includes(entry.id));
  entry.severity=entry.issues.some(i=>i.severity==='P0')?'P0':entry.issues.some(i=>i.severity==='P1')?'P1':entry.issues.some(i=>i.severity==='P2')?'P2':null;
  entry.problem=entry.issues.map(i=>i.problem);
  entry.problemEvidence=entry.issues.flatMap(i=>i.evidence);
  entry.proposal=entry.issues.map(i=>i.proposal);
  if(entry.issues.length)entry.modification={...entry.modification,issueStatuses:entry.issues.map(i=>`${i.id}: ${i.modification}`)};
  if(entry.structuralFindings?.length)warnings.push(`${entry.id}：${entry.structuralFindings.join('、')}`);
}
const kinds=[...new Set(entries.map(e=>e.kind))];
const dimensions=items=>Object.fromEntries(observedKeys.map(key=>[key,{applicable:items.filter(e=>e.states[key].status!=='not-applicable').length,...Object.fromEntries(['passed','partial','failed','blocked','stale','not-verified','not-applicable'].map(status=>[status,items.filter(e=>e.states[key].status===status).length]))}]));
const aggregate=items=>({discovered:items.length,sourcePresent:items.filter(e=>e.states.codePresent.status==='present').length,textReviewed:items.filter(e=>e.review.status==='text-reviewed').length,reviewStale:items.filter(e=>e.review.status==='needs-recheck').length,modified:items.filter(e=>['modified','added'].includes(e.modification.status)).length,pageAccessible:items.filter(e=>e.states.pageAccessible.status==='passed').length,animationRendered:items.filter(e=>e.states.animationRendered.status==='passed').length,teachingVerified:items.filter(e=>e.states.teachingVerified.status==='passed').length,dimensions:dimensions(items)});
const revalidation=entries.flatMap(entry=>observedKeys.filter(d=>entry.states[d].status==='stale').map(dimension=>({id:entry.id,kind:entry.kind,dimension,previousStatus:entry.states[dimension].previousStatus,previousScope:entry.states[dimension].scope||null,evidence:entry.states[dimension].evidence,reason:entry.states[dimension].reason})));
const report={schemaVersion:1,auditDate:manual.auditDate,scope:manual.scope||'全站登记与本轮证据账本；机器结构检查、全文审读、来源核验和实际渲染观察分别报告。',inputs:digests,counts:aggregate(entries),byKind:Object.fromEntries(kinds.map(kind=>[kind,aggregate(entries.filter(e=>e.kind===kind))])),evidenceSummary:manual.evidenceSummary||{},revalidation,issues,structural:{status:errors.length?'failed':'passed',errors,warnings,limits:'仅检查登记、字段、引用、注册门控和能力图；不判断技术正确、页面可见或动画渲染。'},entries};
const md=v=>String(v??'—').replace(/\|/g,'\\|').replace(/\r?\n/g,' ');
const table=(headers,rows)=>[`| ${headers.join(' | ')} |`,`| ${headers.map(()=>'---').join(' | ')} |`,...rows.map(row=>`| ${row.map(md).join(' | ')} |`)].join('\n');
const status={present:'存在',missing:'缺失','not-verified':'未核验','not-applicable':'不适用',passed:'通过',failed:'失败',partial:'部分',blocked:'阻塞',stale:'证据已过期','text-reviewed':'全文已读','not-reviewed':'未审读','needs-recheck':'内容已变待复查'};
const lines=['# 全站教学审查登记','',
  '由 `node scripts/inventory-teaching.mjs` 生成；`--check` 检查同步。人工审查维护在 [teaching-audit-review.json](teaching-audit-review.json)，完整动作规格、字段位置和证据见 [JSON 清单](teaching-audit.json)。',
  '',`审查日期：${manual.auditDate}。登记包含页面、模块、每课正文、每课练习、每项错误诊断、每个动画引用、装备图、路线、能力节点、术语、来源、训练记录协议及维度、真人分析卡及片段。相同动作被不同课程引用时分别登记。`,
  '', '**口径：**“全文已读”只表明相应文字有有效人工审读记录；可能是本轮全文阅读，也可能保留历史全文并复读本轮差分，具体范围以记录为准。“教学已核验”必须另有逐结论来源检查与明确范围。代码存在、页面访问、动画渲染、教学核验互不继承，历史迁移/发布记录不会自动填成通过。修改统计按审查起点的条目内容指纹比较（含新增），不是 Git 行数；页面和功能代码变更须另记，不扩大到全部课程。',
  '', '## 覆盖率与证据边界','',table(['条目类型','已登记','代码存在','正文已读','内容已变待复查','有修改登记','页面实际可访问','动画实际渲染','教学已核验'],kinds.map(kind=>{const c=report.byKind[kind];return[kind,c.discovered,c.sourcePresent,c.textReviewed,c.reviewStale,c.modified,c.pageAccessible,c.animationRendered,c.teachingVerified];})),
  '',table(['独立观察维度','适用分母','通过','部分','失败','阻塞','历史证据过期','未核验'],observedKeys.map(key=>{const c=report.counts.dimensions[key];return[key,c.applicable,c.passed,c.partial,c.failed,c.blocked,c.stale,c['not-verified']];})),
  '',`共享源码或条目改变后，${revalidation.length} 条历史观察当前标为 stale，原证据和范围仍保留在 JSON 的 revalidation；这不是本轮发现${revalidation.length}个教学错误，也不是重新观察通过。当前范围记录见人工账 evidenceSummary。`,
  '',`机器结构检查：${report.structural.status}；${errors.length} 项错误、${warnings.length} 项提醒。通过只说明引用、必要字段、注册门控与能力图结构自洽。`,
  '', '## 问题与处理','',table(['问题 ID','严重度','现有问题','问题证据','修改方案','关联来源','修改状态','验证结果'],issues.map(i=>[i.id,i.severity,i.problem,i.evidence.join('；'),i.proposal,i.sources.join('、'),i.modification,i.validation])),
  '', '## 更新和回填方法','',
  '1. 新增或修改课程、术语、路线、动画后重新生成；稳定课程 ID 是关联主键。错误项优先提供显式 id，没有时用标题内容生成键；改名会出现新键。动画编号延续现有清单的 lessonId/序号，调整顺序或配置后指纹会使旧证据失效。',
  '2. 课程全文审读写 reviewedLessons，含明确 parts、reviewer、evidence 与当时课程 fingerprint；术语等独立条目的文字审读写 reviewedEntries，fingerprint 取条目的 contentFingerprint。内容改变自动标为待复查。审读不会把动画或来源标为已核验。',
  '3. 实际观察写 observations：id、dimension（pageAccessible / animationRendered / teachingVerified）、当前条目的 fingerprint、status（passed / partial / failed / blocked）、date、scope、非空 evidence。教学 passed 额外需要 sourceChecks。每个维度每条目一条当前记录；旧记录可在其 evidence 中引用独立历史文件。',
  '4. 页面访问须逐入口记录；一个共享播放器成功不能批量标记其他引用。证据应说明版本、课程/模式、前脚、进度、视角和实际看到的现象。引用 .validation 本地文件时需说明未公开；持久结论应同时存于公开审查记录。',
  '5. 机器不会推导修改已完成后的教学通过；有新来源、动作、交互或数据修改时重新核验相关范围。未核验项保留可见，不用通过率倒逼虚报。',
  '', '## 逐项审查表','',
];
for(const kind of kinds){lines.push(`### ${kind}`,'',table(['条目 ID / 位置','学习目标','现有问题 / 严重度','问题证据','修改方案','来源','修改状态','验证结果'],entries.filter(e=>e.kind===kind).map(e=>[
  `\`${e.id}\` · ${e.page?`[课程](${e.page}) · `:''}\`${e.location}\``,e.goal,e.issues.length?e.issues.map(i=>`${i.severity} ${i.id}: ${i.problem}`).join('；'):'未登记确定问题；未核验不等于已通过',e.problemEvidence.join('；')||'—',e.proposal.join('；')||'按本条目未核验状态继续审查',e.sources.map(s=>typeof s==='string'?s:JSON.stringify(s)).join('、'),e.modification.status,
  `正文：${status[e.review.status]}；代码：${status[e.states.codePresent.status]}；页面：${status[e.states.pageAccessible.status]}；渲染：${status[e.states.animationRendered.status]}；教学：${status[e.states.teachingVerified.status]}`])), '');}
if(errors.length||warnings.length)lines.push('## 结构检查详细结果','',...errors.map(e=>`- 错误：${e}`),...warnings.map(e=>`- 提醒：${e}`),'');
const outputs={'docs/teaching-audit.json':JSON.stringify(report,null,2)+'\n','docs/teaching-audit.md':lines.join('\n').trimEnd()+'\n'};
let stale=false;
for(const [name,output]of Object.entries(outputs)){if(check){let existing='';try{existing=await read(name);}catch{}if(existing!==output){stale=true;console.error(`清单未同步：${name}`);}}else await writeFile(resolve(root,name),output);}
console.log(JSON.stringify({counts:report.counts,byKind:report.byKind,structural:report.structural.status,errors,warnings,stale},null,2));
if(errors.length||stale)process.exitCode=1;
