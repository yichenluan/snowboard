import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const context = vm.createContext({window:{}});
vm.runInContext(readFileSync(new URL('../assessment.js',import.meta.url),'utf8'),context);
const normalize = context.window.SnowAssessment.normalize;
const protocol = {id:'casi-l4-short',criteria:[{id:'balance'},{id:'flow'}]};

test('旧用户记录没有评估字段时全部保持未观察，不迁移为四级通过',()=>{
  const result=normalize(undefined,protocol);
  assert.equal(result.protocolId,protocol.id);
  assert.equal(result.id,'');
  assert.equal(result.criteria.balance.status,'unseen');
  assert.equal(result.criteria.flow.status,'unseen');
});

test('无效状态和非文本证据不能变成有效观察，既有合法证据保留',()=>{
  const raw={id:'run-1',terrain:'同一压雪坡',criteria:{balance:{status:'passed-level-4',note:42},flow:{status:'repeat',note:'第2趟入口至出口均可保持'}}};
  const result=normalize(raw,protocol);
  assert.equal(result.id,'run-1');
  assert.equal(result.terrain,raw.terrain);
  assert.equal(result.criteria.balance.status,'unseen');
  assert.equal(result.criteria.balance.note,'');
  assert.equal(result.criteria.flow.status,'repeat');
  assert.equal(result.criteria.flow.note,raw.criteria.flow.note);
  assert.equal(raw.criteria.balance.status,'passed-level-4','读取不改变原记录');
});

test('切换记录必须识别新草稿与已存记录的未保存编辑',()=>{
  const isDirty=context.window.SnowAssessment.isDirty;
  assert.equal(isDirty({date:'2026-10-15'},[],protocol),false);
  assert.equal(isDirty({date:'2026-10-15',terrain:'未提交的坡面记录'},[],protocol),true);
  const saved=normalize({id:'one',terrain:'已存坡面'},protocol);
  assert.equal(isDirty(saved,[saved],protocol),false);
  assert.equal(isDirty({...saved,snow:'未提交的雪况修改'},[saved],protocol),true);
  assert.equal(isDirty({...saved,criteria:{flow:{status:'unseen',note:'仍是需要保留的观察'}}},[saved],protocol),true);
});
