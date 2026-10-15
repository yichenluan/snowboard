import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

type JsonRecord = Record<string, any>;
const { validateSourceClaims, sourceClaimHash } = await import(
  new URL('../scripts/check-source-claims.mjs', import.meta.url).href
) as {
  validateSourceClaims: (content: JsonRecord, audit: JsonRecord) => { errors: string[] };
  sourceClaimHash: (value: unknown) => string;
};

// Every change below is an in-memory negative fixture, never a saved human review.
function fixture() {
  const content = JSON.parse(readFileSync(new URL('../content.json', import.meta.url), 'utf8'));
  const audit = JSON.parse(readFileSync(new URL('../docs/source-claim-audit.json', import.meta.url), 'utf8'));
  return { content, audit, errors: () => validateSourceClaims(content, audit).errors };
}

test('当前正文与逐结论来源账保持一致', () => {
  assert.deepEqual(fixture().errors(), []);
});

test('来源证据拒绝基础类型和当前结论自证', () => {
  const primitive = fixture();
  primitive.audit.lessons[0].claims[0].provenance = ['schemaVersion'];
  assert.ok(primitive.errors().some(error => error.includes('原始人工记录不可定位')));

  const self = fixture();
  self.audit.lessons[0].claims[0].sources[0].evidenceRef = 'lessons[0].claims[0].sources[0]';
  assert.ok(self.errors().some(error => error.includes('claim 引用缺少可回溯人工证据')));
});

test('核心结论不能以标题的正确哈希替代自身字段绑定', () => {
  for (const path of ['citations[0]', 'mechanics[0]', 'execution[0]', 'drill.dose']) {
    const f = fixture();
    const review = f.audit.lessons[0];
    const lesson = f.content.lessons.find((entry: JsonRecord) => entry.id === review.lessonId);
    const claim = review.claims.find((entry: JsonRecord) => entry.path === path);
    assert.ok(lesson && claim, `缺少测试所需字段：${path}`);
    claim.bindings = [{ path: 'title', sha256: sourceClaimHash(lesson.title) }];
    assert.ok(f.errors().some(error => error === `核心结论必须绑定自身字段：${review.lessonId} ${path}`));
  }
});

test('引用官方视频不继承其他课程的关键帧观察状态', () => {
  const f = fixture();
  const observed = f.content.lessons.find((lesson: JsonRecord) => lesson.citations.some((citation: JsonRecord) => citation.source === 'S35'));
  assert.ok(observed);
  const sourceIndex = observed.citations.findIndex((citation: JsonRecord) => citation.source === 'S35');
  const observedReview = f.audit.lessons.find((review: JsonRecord) => review.lessonId === observed.id);
  const sourceClaim = observedReview.claims.find((claim: JsonRecord) => claim.path === `citations[${sourceIndex}]`);
  assert.ok(sourceClaim);

  const target = f.content.lessons.find((lesson: JsonRecord) => lesson.id === 'v-purpose');
  const review = f.audit.lessons.find((entry: JsonRecord) => entry.lessonId === target.id);
  assert.equal(review.officialVideoComparison.status, 'not_reviewed');
  const index = target.citations.length;
  const citation = structuredClone(observed.citations[sourceIndex]);
  target.citations.push(citation);
  const path = `citations[${index}]`;
  review.claims.push({
    ...structuredClone(sourceClaim),
    id: `${target.id}::${path}`,
    lessonId: target.id,
    path,
    bindings: [{ path, sha256: sourceClaimHash(citation) }],
  });
  review.lessonSha256 = sourceClaimHash(target);
  f.audit.scope.claimCount++;
  f.audit.scope.citationCount++;
  f.audit.counts[sourceClaim.assessment]++;

  // The existing source reading can support a citation without observing this lesson's animation.
  assert.deepEqual(f.errors(), []);
  review.officialVideoComparison = { status: 'limited_keyframes', sourceIds: ['S35'], observationIds: [] };
  assert.ok(f.errors().some(error => error === `有限视频对照状态与逐课独立观察不一致：${target.id}`));
});

test('真人学习整体与片段均必须绑定自己的正文', () => {
  for (const path of ['videoStudy', 'videoStudy.segments[0]']) {
    const f = fixture();
    const lesson = f.content.lessons.find((entry: JsonRecord) => entry.videoStudy);
    assert.ok(lesson, '缺少已人工观察的真人学习课');
    const review = f.audit.lessons.find((entry: JsonRecord) => entry.lessonId === lesson.id);
    const claim = review.claims.find((entry: JsonRecord) => entry.path === path);
    assert.ok(claim);
    claim.bindings = [{path:'title',sha256:sourceClaimHash(lesson.title)}];
    assert.ok(f.errors().some(error => error === `核心结论必须绑定自身字段：${lesson.id} ${path}`));
  }
});

test('真人片段不能用整段审查替代独立记录', () => {
  const f = fixture();
  const lesson = f.content.lessons.find((entry: JsonRecord) => entry.videoStudy);
  const review = f.audit.lessons.find((entry: JsonRecord) => entry.lessonId === lesson.id);
  const index = review.claims.findIndex((claim: JsonRecord) => claim.path === 'videoStudy.segments[0]');
  assert.ok(index >= 0);
  const [removed] = review.claims.splice(index, 1);
  f.audit.scope.claimCount--;
  f.audit.counts[removed.assessment]--;
  assert.ok(f.errors().some(error => error === `真人片段没有独立人工审查：${lesson.id} videoStudy.segments[0]`));
});

test('只更新片段文字和哈希不能制造新的实际观察时刻', () => {
  const f = fixture();
  const lesson = f.content.lessons.find((entry: JsonRecord) => entry.videoStudy);
  const review = f.audit.lessons.find((entry: JsonRecord) => entry.lessonId === lesson.id);
  const segment = lesson.videoStudy.segments[0];
  // This time is within the window but is absent from the independent 15-frame observation.
  segment.observedTimes = [String(segment.start + 0.01)];
  for (const [path, value] of [['videoStudy', lesson.videoStudy], ['videoStudy.segments[0]', segment]] as const) {
    const claim = review.claims.find((entry: JsonRecord) => entry.path === path);
    claim.claim = structuredClone(value);
    claim.bindings = [{path,sha256:sourceClaimHash(value)}];
  }
  review.lessonSha256 = sourceClaimHash(lesson);
  assert.ok(f.errors().some(error => error === `真人片段时刻缺少本课独立观察：${lesson.id} videoStudy.segments[0]`));
});

test('顶层验收协议独立绑定正文和人工证据', () => {
  const changed = fixture();
  const protocol = changed.content.assessmentProtocols[0];
  assert.ok(protocol);
  protocol.criteria[0].observe += ' 未经复核的新条件';
  assert.ok(changed.errors().some(error => error === `验收协议已变化或绑定错误：${protocol.id}`));

  const misbound = fixture();
  misbound.audit.assessmentProtocols[0].path = 'lessons[0]';
  assert.ok(misbound.errors().some(error => error.includes('验收协议已变化或绑定错误')));

  const noEvidence = fixture();
  noEvidence.audit.assessmentProtocols[0].provenance = ['schemaVersion'];
  assert.ok(noEvidence.errors().some(error => error.includes('验收协议缺少独立人工证据')));

  const selfSource = fixture();
  selfSource.audit.assessmentProtocols[0].sources[0].evidenceRef = 'assessmentProtocols[0]';
  assert.ok(selfSource.errors().some(error => error.includes('验收协议来源证据不可追溯')));
});

test('课程不能引用不存在的验收维度', () => {
  const f = fixture();
  const lesson = f.content.lessons.find((entry: JsonRecord) => entry.assessmentProtocol);
  lesson.assessmentCriteriaIds.push('unreviewed-invented-criterion');
  assert.ok(f.errors().some(error => error === `课程引用不存在的观察维度：${lesson.id}`));
});
