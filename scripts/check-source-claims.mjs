#!/usr/bin/env node
// Read-only integrity check. A passing result is not a teaching or video certification.
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const levels = ['direct', 'synthesis', 'suggestion', 'unverified'];
const categories = ['text_source_access', 'legacy_video_timestamp', 'real_footage_calibration'];
const stable = value => Array.isArray(value) ? value.map(stable)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value;
export const sourceClaimHash = value => createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
const fileHash = value => createHash('sha256').update(value).digest('hex');
const same = (a, b) => JSON.stringify(stable(a)) === JSON.stringify(stable(b));
const valueAt = (object, path) => path.replace(/\[(\d+)\]/g, '.$1').split('.').reduce((value, key) => value?.[key], object);
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const videoSeconds = value => {
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : NaN;
  if (!nonempty(value) || !/^(?:\d+:){0,2}\d+(?:\.\d+)?$/.test(value)) return NaN;
  return value.split(':').reduce((seconds, part) => seconds * 60 + Number(part), 0);
};

/** Checks stored human decisions without creating evidence, updating hashes or changing files. */
export function validateSourceClaims(content, audit) {
  const errors = [];
  const check = (condition, message) => { if (!condition) errors.push(message); };
  check(audit.schemaVersion === 1, '来源账 schemaVersion 必须为 1');
  check(Number.isInteger(audit.scope?.expectedLessons) && audit.scope.expectedLessons > 0, '人工审查范围 expectedLessons 必须为正整数');
  const lessons = new Map((content.lessons || []).map(lesson => [lesson.id, lesson]));
  const reviews = new Map((audit.lessons || []).map(review => [review.lessonId, review]));
  check(lessons.size === content.lessons?.length, 'content 有重复 lesson ID');
  check(reviews.size === audit.lessons?.length, '来源账有重复 lesson ID');
  check(lessons.size === audit.scope?.expectedLessons && reviews.size === lessons.size, `来源账未完整覆盖当前 ${lessons.size} 课（声明 ${audit.scope?.expectedLessons} 课，记录 ${reviews.size} 课）`);
  const sources = new Map();
  for (const source of content.sources || []) {
    for (const id of [source.id, ...(source.aliases || [])]) {
      check(!sources.has(id), `重复来源 ID/alias：${id}`);
      sources.set(id, source);
    }
  }
  const canonical = id => sources.get(id)?.id;
  const snapshots = new Map((audit.sources || []).map(source => [source.sourceId, source]));
  check(snapshots.size === audit.sources?.length, '来源账有重复 source snapshot');
  for (const [id, snapshot] of snapshots) {
    check(sources.has(id), `来源快照 ID 不存在：${id}`);
    if (sources.has(id)) check(snapshot.sha256 === sourceClaimHash(sources.get(id)), `来源已变化，需重新审查：${id}`);
  }
  const objectRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const rawRecordPatterns = [
    /^rawLedgers\.short\.evidenceBook\.[A-Za-z0-9_-]+$/,
    /^rawLedgers\.short\.(?:lessons|claims)\[\d+\]$/,
    /^rawLedgers\.other\.lessons\[\d+\]\.claims\[\d+\]$/,
    /^rawLedgers\.duck\.lessons\[\d+\]\.records\[\d+\]$/,
    /^rawLedgers\.duck\.readingEvidence#[A-Za-z0-9_-]+$/,
  ];
  const evidenceRecord = reference => {
    if (typeof reference !== 'string') return undefined;
    const registered = Object.entries(audit.evidenceDocuments || {}).find(([key, entry]) => reference === entry.path || reference === `evidenceDocuments.${key}`);
    if (registered) {
      const entry = registered[1];
      return objectRecord(entry) && nonempty(entry.path) && /^[a-f0-9]{64}$/.test(entry.sha256) && nonempty(entry.scope) ? entry : undefined;
    }
    if (!rawRecordPatterns.some(pattern => pattern.test(reference))) return undefined;
    const [path, id] = reference.split('#');
    const value = valueAt(audit, path);
    const record = id && Array.isArray(value) ? value.find(entry => entry.id === id) : value;
    if (!objectRecord(record) || !Object.keys(record).length) return undefined;
    // Only actual source/claim/lesson reading records are allowed, never primitives or current normalized claims.
    return nonempty(record.source) || nonempty(record.sourceId) || nonempty(record.sourceLocator)
      || (nonempty(record.lessonId) && (record.claimAfter !== undefined || nonempty(record.title)))
      || (nonempty(record.path) && record.claim !== undefined && levels.includes(record.evidence) && Array.isArray(record.supports)) ? record : undefined;
  };
  const evidenceExists = reference => Boolean(evidenceRecord(reference));
  const evidenceSourceIds = reference => {
    const record = evidenceRecord(reference);
    if (!record) return [];
    // Extract only source IDs literally present in the reviewed record; never use a lesson's general bibliography as a substitute.
    return [record.source, record.sourceId, ...(record.sourceIds || []), ...(record.sourceLocator?.match(/(?<![A-Za-z0-9])(?:S\d+|A\d+|T\d+|D\d+)(?!\d)/g) || [])].filter(Boolean);
  };
  const observationIds = new Set();
  const videoObservations = new Map();
  for (const observation of audit.videoObservations || []) {
    check(nonempty(observation.id) && !observationIds.has(observation.id), `重复/无效视频观察 ID：${observation.id}`);
    observationIds.add(observation.id);
    check(lessons.has(observation.lessonId), `视频观察指向未知课程：${observation.lessonId}`);
    check(['official', 'personal'].includes(observation.sourceKind), `视频观察必须区分官方与个人来源：${observation.id}`);
    check(observation.status === 'limited_keyframes' && nonempty(observation.scope), `视频观察必须说明有限范围：${observation.id}`);
    check(Array.isArray(observation.observedTimes) && observation.observedTimes.length > 0 && observation.observedTimes.every(nonempty), `视频观察缺少实际时刻：${observation.id}`);
    check(evidenceExists(observation.evidenceRef) && evidenceSourceIds(observation.evidenceRef).includes(observation.sourceId), `视频观察缺少该来源的独立证据：${observation.id}`);
    check((lessons.get(observation.lessonId)?.citations || []).some(citation => citation.source === observation.sourceId), `视频观察来源在本课不可达：${observation.id}`);
    const values = videoObservations.get(observation.lessonId) || [];
    check(!values.some(value => value.sourceId === observation.sourceId), `同课同来源重复视频观察：${observation.id}`);
    values.push(observation);
    videoObservations.set(observation.lessonId, values);
  }
  const claimIds = new Set(), usedSources = new Set();
  const counts = Object.fromEntries(levels.map(level => [level, 0]));
  const unverifiedCategories = Object.fromEntries(categories.map(category => [category, 0]));
  let citationCount = 0;
  for (const [id, lesson] of lessons) {
    const review = reviews.get(id);
    check(Boolean(review), `缺少课程来源审查：${id}`);
    if (!review) continue;
    check(review.lessonSha256 === sourceClaimHash(lesson), `课程正文已变化，来源审计失效：${id}`);
    check(review.module === lesson.module, `课程模块不一致：${id}`);
    check(nonempty(lesson.drill?.dose) && lesson.drill.dose.includes('本站'), `缺少明确的本站建议练习量：${id}`);
    const citations = lesson.citations || [];
    citationCount += citations.length;
    const citationSources = new Set(citations.map(citation => canonical(citation.source)));
    for (const [index, citation] of citations.entries()) {
      check(sources.has(citation.source), `${id} citations[${index}] 来源不存在：${citation.source}`);
      check(nonempty(citation.locator) && nonempty(citation.claim), `${id} citations[${index}] 缺少具体定位/主张`);
      check(levels.includes(citation.evidence), `${id} citations[${index}] 证据层级无效`);
    }
    const paths = new Map();
    for (const claim of review.claims || []) {
      const label = `${id} ${claim.path}`;
      check(claim.lessonId === id && claim.id === `${id}::${claim.path}`, `claim ID/lessonId 不一致：${label}`);
      check(!claimIds.has(claim.id), `重复 claim ID：${claim.id}`);
      check(!paths.has(claim.path), `重复课程 claim 路径：${label}`);
      claimIds.add(claim.id);
      paths.set(claim.path, claim);
      check(levels.includes(claim.assessment), `证据层级无效：${label}`);
      if (levels.includes(claim.assessment)) counts[claim.assessment]++;
      check(nonempty(claim.boundary), `缺少证据边界：${label}`);
      check(Array.isArray(claim.provenance) && claim.provenance.length > 0 && claim.provenance.every(evidenceExists), `原始人工记录不可定位：${label}`);
      check(Array.isArray(claim.sources), `缺少显式 sources 数组：${label}`);
      if (['direct', 'synthesis'].includes(claim.assessment)) check(claim.sources?.length > 0, `事实/综合判断缺少依据：${label}`);
      for (const support of claim.sources || []) {
        check(sources.has(support.sourceId), `claim 引用未知 source：${label} ${support.sourceId}`);
        check(nonempty(support.locator), `claim 引用缺少定位：${label} ${support.sourceId}`);
        check(evidenceExists(support.evidenceRef), `claim 引用缺少可回溯人工证据：${label} ${support.sourceId}`);
        const sid = canonical(support.sourceId);
        check(evidenceSourceIds(support.evidenceRef).some(id => canonical(id) === sid), `来源 ID 未出现在所指人工证据中：${label} ${support.sourceId}`);
        if (sid) usedSources.add(sid);
        check(snapshots.has(sid), `claim 来源缺少快照：${label} ${support.sourceId}`);
      }
      if (claim.assessment === 'unverified') {
        check(categories.includes(claim.unverifiedCategory), `未核验项没有明确类别：${label}`);
        if (categories.includes(claim.unverifiedCategory)) unverifiedCategories[claim.unverifiedCategory]++;
      } else check(!claim.unverifiedCategory, `已归类结论仍带未核验类别：${label}`);
      if (claim.originalAssessment) {
        check(levels.includes(claim.originalAssessment) && evidenceExists(claim.followupEvidence), `改判缺少原等级或补核证据：${label}`);
      }
      check(Array.isArray(claim.bindings), `claim 缺少正文绑定：${label}`);
      if (claim.path !== 'animation-real-footage-alignment') check(claim.bindings?.length > 0, `文字结论没有正文绑定：${label}`);
      if (/^(?:citations|mechanics|execution)\[\d+\]$/.test(claim.path) || claim.path === 'drill.dose'
        || claim.path === 'videoStudy' || /^videoStudy\.segments\[\d+\]$/.test(claim.path)) {
        check(claim.bindings?.some(binding => binding.path === claim.path), `核心结论必须绑定自身字段：${label}`);
      }
      for (const binding of claim.bindings || []) {
        const current = valueAt(lesson, binding.path);
        check(current !== undefined, `正文绑定路径不存在：${id} ${binding.path}`);
        if (current !== undefined) check(binding.sha256 === sourceClaimHash(current), `结论对应正文已变化：${id} ${binding.path}`);
      }
    }
    for (const [index, citation] of citations.entries()) {
      const claim = paths.get(`citations[${index}]`);
      check(Boolean(claim), `citation 无逐条来源记录：${id} citations[${index}]`);
      if (claim) {
        check(same(claim.claim, citation.claim) && claim.assessment === citation.evidence, `citation 主张/证据等级与正文不一致：${claim.id}`);
        check(claim.sources.some(source => canonical(source.sourceId) === canonical(citation.source)), `citation 的来源未被该结论支持：${claim.id}`);
      }
    }
    for (const section of ['mechanics', 'execution']) {
      for (const [index, entry] of (lesson[section] || []).entries()) {
        const path = `${section}[${index}]`, claim = paths.get(path);
        check(Boolean(claim), `核心结论没有审查记录：${id} ${path}`);
        for (const sid of entry.sources || []) {
          check(sources.has(sid) && citationSources.has(canonical(sid)), `正文来源在本课 citation 不可达：${id} ${path} ${sid}`);
          check(claim?.sources?.some(source => canonical(source.sourceId) === canonical(sid)), `正文来源未被原结论账支持：${id} ${path} ${sid}`);
        }
      }
    }
    const dose = paths.get('drill.dose');
    check(Boolean(dose) && dose.assessment === 'suggestion' && dose.claim === lesson.drill?.dose, `练习量未以本站建议记录或与正文不一致：${id}`);
    const gaps = (review.claims || []).filter(claim => claim.unverifiedCategory === 'text_source_access').map(claim => claim.id);
    check(review.textReview?.status === (gaps.length ? 'reviewed_with_source_gap' : 'reviewed') && same(review.textReview?.gapClaimIds, gaps), `文字审查状态与实际来源缺口不一致：${id}`);
    check(review.realFootageCalibration === 'not_performed', `本轮来源账不能自动授予实拍标定：${id}`);
    const observations = videoObservations.get(id) || [];
    check(review.videoComparison?.status === (observations.length ? 'limited_keyframes' : 'not_reviewed')
      && same(review.videoComparison?.sourceIds, observations.map(observation => observation.sourceId))
      && same(review.videoComparison?.observationIds, observations.map(observation => observation.id)), `有限视频对照状态与逐课独立观察不一致：${id}`);
    if (lesson.videoStudy !== undefined) {
      const study = objectRecord(lesson.videoStudy) ? lesson.videoStudy : {};
      check(sources.has(study.source) && citationSources.has(canonical(study.source)), `真人学习来源在本课不可达：${id}`);
      check(nonempty(study.title) && nonempty(study.scope) && nonempty(study.practice)
        && nonempty(study.url) && study.url === sources.get(study.source)?.url, `真人学习缺少范围或原始来源链接不一致：${id}`);
      const studyClaim = paths.get('videoStudy');
      check(Boolean(studyClaim) && same(studyClaim.claim, study), `真人学习整段无对应人工审查：${id}`);
      check(studyClaim?.sources?.some(source => canonical(source.sourceId) === canonical(study.source)), `真人学习记录缺少对应视频来源：${id}`);
      check(Array.isArray(study?.segments) && study.segments.length > 0, `真人学习缺少片段：${id}`);
      for (const [index, value] of (Array.isArray(study?.segments) ? study.segments : []).entries()) {
        const segment = objectRecord(value) ? value : {};
        const path = `videoStudy.segments[${index}]`, claim = paths.get(path);
        check(Boolean(claim) && same(claim.claim, segment), `真人片段没有独立人工审查：${id} ${path}`);
        check(claim?.sources?.some(source => canonical(source.sourceId) === canonical(study.source)), `真人片段缺少对应视频来源：${id} ${path}`);
        check(['label', 'visible', 'meaning', 'limits'].every(key => nonempty(segment[key])), `真人片段缺少观察、应用或限制：${id} ${path}`);
        const start = videoSeconds(segment.start), end = videoSeconds(segment.end);
        const times = (Array.isArray(segment.observedTimes) ? segment.observedTimes : []).map(videoSeconds);
        check(Number.isFinite(start) && Number.isFinite(end) && end > start && times.length > 0
          && times.every(time => Number.isFinite(time) && time >= start - 0.001 && time <= end + 0.001), `真人片段时间或观察时刻无效：${id} ${path}`);
        const observed = observations.find(observation => canonical(observation.sourceId) === canonical(study.source));
        const evidenceTimes = (observed?.observedTimes || []).map(videoSeconds);
        check(Boolean(observed) && times.every(time => evidenceTimes.some(value => Math.abs(value - time) < 0.001)), `真人片段时刻缺少本课独立观察：${id} ${path}`);
      }
    }
  }
  for (const id of reviews.keys()) check(lessons.has(id), `来源账包含不存在的课程：${id}`);
  check(audit.scope?.claimCount === claimIds.size && same(audit.counts, counts), 'claim 数量/证据层级汇总不一致');
  check(audit.scope?.effectiveSourceCount === usedSources.size && snapshots.size === usedSources.size, '有效来源数量/快照覆盖不一致');
  check(audit.scope?.citationCount === citationCount, 'citation 数量汇总不一致');
  check(same(audit.unverifiedCategories, unverifiedCategories), '未核验类别汇总不一致');
  return { errors, summary: { lessons: lessons.size, sources: usedSources.size, citations: citationCount, claims: claimIds.size, counts, unverifiedCategories } };
}

async function main() {
  if (process.argv.length > 2) throw new Error('用法：node scripts/check-source-claims.mjs（只读检查，不自动更新审计）');
  const content = JSON.parse(await readFile(resolve(root, 'content.json'), 'utf8'));
  const audit = JSON.parse(await readFile(resolve(root, 'docs/source-claim-audit.json'), 'utf8'));
  const result = validateSourceClaims(content, audit);
  for (const evidence of Object.values(audit.evidenceDocuments || {})) {
    try {
      const current = await readFile(resolve(root, evidence.path));
      if (evidence.sha256 !== fileHash(current)) result.errors.push(`补核证据文档已变化，需重新核对：${evidence.path}`);
    } catch {
      result.errors.push(`补核证据文档不存在：${evidence.path}`);
    }
  }
  if (result.errors.length) {
    for (const message of result.errors) console.error(message);
    console.error(`来源审计检查失败：${result.errors.length} 项。不得仅重算哈希；先人工核对变化。`);
    process.exitCode = 1;
  } else {
    console.log(`来源审计结构与当前正文一致：${JSON.stringify(result.summary)}`);
    console.log('此结果仅确认人工记录未失效，不授予教学、动画连续周期或真人标定通过。');
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
