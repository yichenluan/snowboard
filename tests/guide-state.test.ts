import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const context = vm.createContext({ window: {}, URLSearchParams });
vm.runInContext(readFileSync(new URL('../guide-state.js', import.meta.url), 'utf8'), context);
const guide = context.window.SnowGuide;
const data = {
  lessons: [
    { id: 'front', module: 'edge' },
    { id: 'unrelated', module: 'other' },
    { id: 'back', module: 'edge' },
    { id: 'turn', module: 'turn' },
  ],
  navigationRoutes: [{ id: 'basics', lessons: ['front', 'back', 'turn'] }],
};

test('访问统计按公共语义页面归一，同课路线和私人搜索不拆分页面', () => {
  const publicData = {
    lessons: [{ id: 'front', title: '前刃', module: 'edge' }],
    modules: [{ id: 'edge', title: '两刃' }],
    navigationRoutes: [{ id: 'basics', title: '基础路线' }],
  };
  const a = guide.analyticsView(publicData, { page: 'overview', lesson: 'front', route: 'basics' });
  const b = guide.analyticsView(publicData, { page: 'overview', lesson: 'front', route: null, query: 'private search' });
  assert.equal(JSON.stringify(a), JSON.stringify(b));
  assert.equal(a.path, '/snowboard/lesson/front');
  assert.equal(guide.analyticsView(publicData, { page: 'overview', module: 'edge' }).path, '/snowboard/module/edge');
  assert.equal(guide.analyticsView(publicData, { page: 'curriculum', route: 'basics' }).path, '/snowboard/route/basics');
  assert.equal(guide.analyticsView(publicData, { page: 'curriculum', route: 'unknown private route' }).path, '/snowboard/routes');
  const note = guide.analyticsView(publicData, { page: 'additions', title: 'private note', query: 'private search' });
  assert.equal(note.title, '我的补充');
  assert.equal(JSON.stringify(note).includes('private'), false);
  assert.equal(guide.analyticsView(publicData, { page: 'overview', module: 'all' }).path, '/snowboard/');
});

test('路线中的下一课使用路线顺序，直接进入则使用模块顺序，不跟全局插入顺序跳转', () => {
  assert.equal(guide.lessonSequence(data, 'front', 'basics').next.id, 'back');
  assert.equal(guide.lessonSequence(data, 'back', 'basics').next.id, 'turn');
  assert.equal(guide.lessonSequence(data, 'front', null).next.id, 'back');
  assert.equal(guide.lessonSequence(data, 'back', null).next, null);
  assert.equal(guide.lessonSequence(data, 'unrelated', 'basics').route, null);
  assert.equal(guide.lessonSequence(data, 'missing', 'basics').next, null);
});

test('课程深链保留路线，旧课程链接不变且异常转义不会抛错', () => {
  const address = guide.lessonLocation('s20-rails', 'carving');
  assert.equal(guide.parseLocation(address).lesson, 's20-rails');
  assert.equal(guide.parseLocation(address).route, 'carving');
  assert.equal(guide.parseLocation('#lesson=s20-rails').route, null);
  assert.equal(guide.parseLocation('#route=carving').lesson, null);
  assert.doesNotThrow(() => guide.parseLocation('#lesson=%XX'));
});

test('只保存个人数据并读取旧快照，旧正文不能覆盖课程，停用字段原样保留', () => {
  const stored = {
    guide: { lessons: [{ id: 'obsolete' }], schemaVersion: 2 },
    baseRevision: 'old',
    user: {
      bookmarks: ['front'], additions: [{ id: 'note' }], trash: [{ id: 'recover' }],
      skillProgress: ['skill'], skillTarget: 'short',
      assessmentRecords: [{ id: 'run', protocolId: 'short', observation: '撤提示后仍能控速' }],
      assessmentDrafts: { short: { terrain: '缓坡', criteria: { balance: { status: 'repeat', note: '已有证据' } } } },
    },
  };
  const loaded = guide.readUser(stored);
  loaded.bookmarks.push('back');
  const next = guide.userSnapshot(loaded, 'current');
  assert.equal(next.baseRevision, 'current');
  assert.equal(next.guide, undefined);
  assert.equal(next.user.bookmarks[0], 'front');
  assert.equal(next.user.additions[0].id, 'note');
  assert.equal(next.user.trash[0].id, 'recover');
  assert.equal(next.user.assessmentRecords[0].observation, '撤提示后仍能控速');
  assert.equal(next.user.assessmentDrafts.short.criteria.balance.note, '已有证据');
  assert.equal(next.user.assessmentRecords, stored.user.assessmentRecords, '停用数据只作不解释的个人字段保留');
  assert.equal(next.user.assessmentDrafts, stored.user.assessmentDrafts);
  assert.equal(guide.readUser({}).assessmentRecords, undefined, '新用户不再初始化停用的记录结构');
  assert.equal(guide.readUser({}).assessmentDrafts, undefined);
  assert.equal(guide.readUser(stored.user).skillTarget, 'short');
  assert.equal(stored.guide.lessons[0].id, 'obsolete');
});

test('专项筛选不随显示标题改变，重复自检只显示一次且保留不同观察点', () => {
  assert.equal(guide.specialist({ levelKey: 'specialist', level: '进阶刻滑' }), true);
  assert.equal(guide.specialist({ levelKey: 'progression', level: '专项' }), false);
  const checks = guide.checks({ checks: ['窄痕', '能退出'], drill: { success: ['窄痕', '撤提示复现'] } });
  assert.equal(checks.join('|'), '窄痕|能退出|撤提示复现');
});
