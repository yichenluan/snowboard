import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const context = vm.createContext({window:{}});
vm.runInContext(readFileSync(new URL('../progression.js',import.meta.url),'utf8'),context);
const {lessonContext,analyze} = context.window.SnowProgression;

test('多归属课程不把自身建立的能力列为课程前置，能力图依赖仍有效',()=>{
  const node = (id:string,requires:string[],lessons:string[]) => ({id,title:id,requires,lessons});
  const map = {nodes:[
    node('foundation',[],['foundation-lesson']),
    node('reference',['foundation'],['shared-lesson']),
    node('arc',['reference'],['shared-lesson']),
    node('continuation',['arc'],['next-lesson']),
  ],targets:[]};
  const original = structuredClone(map);
  const html = lessonContext(map,{id:'shared-lesson',module:'carving'},['foundation']);
  const before = html.match(/<small>先掌握的基础<\/small>(.*?)<\/div><\/div>/)?.[1];
  assert.ok(before,'外部前置仍展示');
  assert.match(before,/data-show-skill="foundation"/);
  assert.doesNotMatch(before,/data-show-skill="(?:reference|arc)"/);
  assert.match(html,/data-show-skill="reference"/,'保留本课直接归属能力入口');
  assert.match(html,/data-show-skill="arc"/);
  assert.match(html,/data-show-skill="continuation"/,'保留后续能力入口');
  assert.deepEqual(map,original,'展示不修改能力图');
  assert.equal(analyze(map,['foundation']).status.get('arc'),'locked','未完成 reference 时 arc 仍受原前置约束');
  assert.equal(analyze(map,['foundation','reference']).status.get('arc'),'ready');
});
