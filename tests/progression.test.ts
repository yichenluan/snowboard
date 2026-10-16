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

test('主目标入口使用数据中的名称与说明，辅助目标仍留在选择器中',()=>{
  const context = vm.createContext({window:{},requestAnimationFrame:()=>1,cancelAnimationFrame:()=>{}});
  vm.runInContext(readFileSync(new URL('../progression.js',import.meta.url),'utf8'),context);
  const node={id:'foundation',title:'基础',stage:'entry',requires:[],supports:[],gate:[],lessons:[]};
  const map={intro:'说明',stages:[{id:'entry',title:'入口'}],nodes:[node],sources:[],targets:[
    {id:'carving',title:'JSBA 刻滑 <目标>',summary:'主线说明 & 观察',nodeIds:['foundation'],primary:true},
    {id:'switch',title:'辅助反脚',nodeIds:['foundation']},
    {id:'short',title:'CASI 四级搓雪小回转',summary:'另一主线',nodeIds:['foundation'],primary:true},
  ]};
  const elements=new Map<string,any>();
  const root={innerHTML:'',querySelector:(selector:string)=>{
    if(selector==='.skill-graph'||selector==='.skill-edges')return null;
    if(!elements.has(selector))elements.set(selector,{});
    return elements.get(selector);
  },querySelectorAll:()=>[]};
  context.window.SnowProgression.mount(root,{map,lessons:[],progress:[],target:'carving'});
  const goals=[...root.innerHTML.matchAll(/data-skill-goal="([^"]*)"/g)].map(match=>match[1]);
  assert.deepEqual(goals,['carving','short']);
  assert.match(root.innerHTML,/JSBA 刻滑 &lt;目标&gt;/);
  assert.match(root.innerHTML,/主线说明 &amp; 观察/);
  assert.match(root.innerHTML,/<option value="switch">辅助反脚<\/option>/);
  assert.doesNotMatch(root.innerHTML,/基础刻滑 → 进阶大弯|整段复盘/);
});

test('刻滑主线同时包含两类转换、纯刻短弯与低姿态，正常控制先于低位应用',()=>{
  const data=JSON.parse(readFileSync(new URL('../content.json',import.meta.url),'utf8'));
  const map=data.progressionMap;
  assert.equal(context.window.SnowProgression.validate(map),true,'真实能力图必须是可解析的 DAG');
  const carving=analyze(map,[],'carving'),short=analyze(map,[],'short');
  const end=carving.byId.get('expert-carve-review');
  const path=carving.ancestors([end.id]);
  for(const id of ['adjustable-carved-turns','jsba-basic-carves','jsba-dynamic-carves','jsba-short-carves','duck-height-control','duck-low-linked-carves']){
    assert.ok(path.has(id),`刻滑完整应用不能漏掉 ${id}`);
    assert.ok(carving.targetPath.has(id),`刻滑目标应突出 ${id}`);
  }
  assert.ok(carving.ancestors(['duck-height-control']).has('adjustable-carved-turns'),'正常高度刻滑应先于低位准备');
  assert.ok(!carving.ancestors(['jsba-dynamic-carves']).has('jsba-basic-carves'),'两类转换可从可靠刻滑并列发展');
  assert.ok(!short.targetPath.has('isolated-carved-arcs'),'搓雪短弯不能被刻滑前置锁住');
  assert.ok(!short.ancestors(['expert-short-pressure']).has('retraction-short-turns'),'CASI 短弯不强制回收策略');
  const normalMarked=[...carving.targetPath].filter((id:string)=>!id.includes('duck')&&id!=='expert-carve-variation'&&id!==end.id);
  assert.notEqual(analyze(map,normalMarked,'carving').status.get(end.id),'complete','未通过低位能力不能直接计入主线完整应用');
  assert.doesNotMatch(JSON.stringify(map.nodes.filter((node:any)=>node.lane==='carving')),/7–15米|低位选修|保存.*记录/);
});
