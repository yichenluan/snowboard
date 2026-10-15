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
