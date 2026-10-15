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

test('显式属于其他协议的记录不能重新标成当前协议，缺协议的旧草稿仍可读取',()=>{
  const foreign={id:'shared',protocolId:'carving',terrain:'另一专项的坡面',criteria:{balance:{status:'repeat',note:'另一专项的证据'}}};
  const result=normalize(foreign,protocol);
  assert.equal(result.protocolId,protocol.id);
  assert.equal(result.id,'');assert.equal(result.terrain,'');
  assert.equal(result.criteria.balance.status,'unseen');assert.equal(result.criteria.balance.note,'');
  assert.equal(foreign.protocolId,'carving','不改写另一协议原记录');
  assert.equal(normalize({...foreign,protocolId:undefined},protocol).terrain,foreign.terrain);
  assert.equal(normalize({...foreign,protocolId:protocol.id},protocol).criteria.balance.status,'repeat');
});

// Minimal form/DOM boundary double. It executes the real mount handlers and
// inspects generated HTML; it does not claim real-browser layout verification.
function mounted({draft,records=[],fieldHints,focusCriteriaIds,testProtocol=protocol}:{draft?:any;records?:any[];fieldHints?:Record<string,unknown>;focusCriteriaIds?:string[];testProtocol?:any}={}){
  const values=new Map<string,string>();
  let focused='';
  const form:any={elements:{namedItem:(name:string)=>values.has(name)?{focus(){focused=name;}}:null}};
  const status={textContent:''},newButton:any={},input={focus(){}},editor={open:false,scrollIntoView(){}};
  let html='',editButtons:any[]=[],toggleButton:any,saved:any,drafted:any;
  const decode=(value:string)=>value.replace(/&(amp|lt|gt|quot|#39);/g,(_,entity:string)=>({amp:'&',lt:'<',gt:'>',quot:'"','#39':"'"}[entity]!));
  const attr=(source:string,name:string)=>decode(source.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1]||'');
  const root:any={
    get innerHTML(){return html;},
    set innerHTML(value:string){
      html=value;
      values.clear();
      for(const match of value.matchAll(/<input\b([^>]*)>/g)) values.set(attr(match[1],'name'),attr(match[1],'value'));
      for(const match of value.matchAll(/<textarea\b([^>]*)>([\s\S]*?)<\/textarea>/g)) values.set(attr(match[1],'name'),decode(match[2]));
      for(const match of value.matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select>/g)){
        const options=[...match[2].matchAll(/<option\b([^>]*)>/g)];
        const selected=options.find(option=>/\bselected\b/.test(option[1]))||options[0];
        values.set(attr(match[1],'name'),attr(selected[1],'value'));
      }
      editButtons=[...value.matchAll(/data-assessment-edit="([^"]*)"/g)].map(m=>({dataset:{assessmentEdit:m[1]}}));
      toggleButton=value.includes('data-assessment-toggle')?{focus(){}}:null;
    },
    querySelector(selector:string){return selector==='form'?form:selector==='[data-assessment-status]'?status:selector==='[data-assessment-new]'?newButton:selector==='[data-assessment-toggle]'?toggleButton:selector==='.assessment-editor'?editor:selector==='input'?input:null;},
    querySelectorAll(selector:string){return selector==='[data-assessment-edit]'?editButtons:[];},
  };
  const context=vm.createContext({window:{confirm:()=>true},crypto:{randomUUID:()=> 'new-run'},FormData:class{get(key:string){return values.get(key)||null;}has(key:string){return values.has(key);}}});
  vm.runInContext(readFileSync(new URL('../assessment.js',import.meta.url),'utf8'),context);
  context.window.SnowAssessment.mount(root,{protocol:{...testProtocol,title:'测试协议',criteria:testProtocol.criteria.map((c:any)=>({...c,title:c.id})),fieldHints},records,draft,focusCriteriaIds,
    onDraft:(record:any)=>{drafted=record;},onSave:(next:any,record:any)=>{saved={next,record};},onLesson:()=>{}});
  return {root,values,form,status,edit:()=>editButtons[0].onclick(),toggle:()=>toggleButton.onclick(),saved:()=>saved,drafted:()=>drafted,focused:()=>focused};
}

test('协议提示安全转义且默认通道没有小回转专用宽度，未知或非文字覆盖不进入HTML',()=>{
  const unsafe='"><img src=x onerror="alert(1)">&\'';
  const b=mounted({fieldHints:{corridor:unsafe,feedback:unsafe,snow:42,unknown:'SHOULD_NOT_RENDER'}});
  assert.equal((b.root.innerHTML.match(/placeholder="&quot;&gt;&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;&amp;&#39;"/g)||[]).length,2);
  assert.ok(!b.root.innerHTML.includes('<img'));
  assert.ok(!b.root.innerHTML.includes('SHOULD_NOT_RENDER'));
  assert.ok(b.root.innerHTML.includes('例如：平整压雪、局部硬雪、可见距离'));
  const baseline=mounted();assert.ok(!baseline.root.innerHTML.includes('2–3'));
  assert.ok(baseline.root.innerHTML.includes('目标条件以本次专项为准'));
  assert.match(mounted({fieldHints:{corridor:''}}).root.innerHTML,/name="corridor"[^>]*placeholder=""/);
});

test('不同协议同名ID的编辑与保存只命中当前协议，其他记录原样保留',()=>{
  const foreign={id:'collision',protocolId:'carving',terrain:'刻滑记录',criteria:{}};
  const own={id:'collision',protocolId:protocol.id,terrain:'小回转记录',criteria:{}};
  const edited=mounted({records:[foreign,own]});edited.edit();
  assert.equal(edited.drafted().terrain,own.terrain,'历史入口不能选中同ID的另一协议');
  const b=mounted({draft:own,records:[foreign,own]});b.values.set('terrain','仅改小回转');b.form.onsubmit({preventDefault(){}});
  assert.equal(b.saved().next.length,2);assert.equal(b.saved().next[0],foreign);
  assert.equal(b.saved().next[1].terrain,'仅改小回转');assert.equal(b.saved().next[1].protocolId,protocol.id);
  const newOwn=mounted({draft:own,records:[foreign]});newOwn.form.onsubmit({preventDefault(){}});
  assert.equal(newOwn.saved().next.length,2,'同ID只有其他协议时应追加当前记录，不覆盖其他协议');
  assert.equal(newOwn.saved().next[0],foreign);assert.equal(newOwn.saved().next[1].protocolId,protocol.id);
});

const fullProtocol={id:'casi-l4-short',criteria:Array.from({length:11},(_,i)=>({id:`c${i}`}))};
const focus=fullProtocol.criteria.slice(0,5).map(c=>c.id);
const submit=(b:ReturnType<typeof mounted>)=>b.form.onsubmit({preventDefault(){}});
const shownCriteria=(b:ReturnType<typeof mounted>)=>[...b.values.keys()].filter(key=>key.startsWith('status-'));

test('只填本课5项时，另6项的已有状态和证据仍随草稿与记录保存',()=>{
  const draft={id:'run-11',protocolId:fullProtocol.id,change:'旧的单项调整',criteria:Object.fromEntries(fullProtocol.criteria.map(c=>[c.id,{status:'repeat',note:`已记录 ${c.id}`}]))};
  const b=mounted({testProtocol:fullProtocol,focusCriteriaIds:focus,draft,records:[draft]});
  assert.equal(shownCriteria(b).length,5);
  assert.match(b.root.innerHTML,/本课重点 · 5 项/);
  for(const id of focus){b.values.set(`status-${id}`,'develop');b.values.set(`note-${id}`,`本课更新 ${id}`);}
  b.values.set('change','只调整屈伸时机，保留弯形');
  b.form.oninput();
  for(const c of fullProtocol.criteria.slice(5)){
    assert.equal(b.drafted().criteria[c.id].status,'repeat');
    assert.equal(b.drafted().criteria[c.id].note,`已记录 ${c.id}`);
  }
  submit(b);
  assert.equal(b.saved().next.length,1);
  assert.equal(b.saved().record.change,'只调整屈伸时机，保留弯形');
  for(const id of focus) assert.equal(b.saved().record.criteria[id].note,`本课更新 ${id}`);
  for(const c of fullProtocol.criteria.slice(5)) assert.equal(b.saved().record.criteria[c.id].note,`已记录 ${c.id}`);
  assert.equal(draft.criteria.c0.note,'已记录 c0','编辑不原地改写原记录');
});

test('展开和收起完整表保留两侧编辑；换课继续同一协议草稿时不丢隐藏项',()=>{
  const b=mounted({testProtocol:fullProtocol,focusCriteriaIds:focus});
  b.values.set('note-c0','只在第一弯看清');
  b.toggle();
  assert.equal(shownCriteria(b).length,11);
  assert.equal(b.values.get('note-c0'),'只在第一弯看清');
  b.values.set('status-c10','not_applicable');
  b.values.set('note-c10','这趟没有做低姿态变化');
  b.toggle();
  assert.equal(shownCriteria(b).length,5);
  assert.equal(b.drafted().criteria.c10.status,'not_applicable');
  const next=mounted({testProtocol:fullProtocol,focusCriteriaIds:['c10'],draft:b.drafted()});
  assert.equal(next.values.get('note-c10'),'这趟没有做低姿态变化');
  next.values.set('note-c10','只滑了正常高度，未做低姿态任务');
  submit(next);
  assert.equal(next.saved().record.criteria.c0.note,'只在第一弯看清');
  assert.equal(next.saved().record.criteria.c10.note,'只滑了正常高度，未做低姿态任务');
});

test('完整复核课与缺省/无效重点均显示全表，不显示多余展开按钮',()=>{
  for(const ids of [undefined,[],['missing'],fullProtocol.criteria.map(c=>c.id)]){
    const b=mounted({testProtocol:fullProtocol,focusCriteriaIds:ids});
    assert.equal(shownCriteria(b).length,11);
    assert.ok(!b.root.innerHTML.includes('data-assessment-toggle'));
  }
});

test('本次不适用须有原因，持久化后独立统计，不冒充已观察或已通过',()=>{
  const b=mounted();
  b.values.set('status-balance','not_applicable');
  submit(b);
  assert.equal(b.saved(),undefined);
  assert.match(b.status.textContent,/本次不适用的原因/);
  assert.equal(b.focused(),'note-balance');
  b.values.set('note-balance','本次没做这个任务');
  b.values.set('status-flow','repeat');
  b.values.set('note-flow','同条件两趟均保持出口');
  submit(b);
  const persisted=normalize(JSON.parse(JSON.stringify(b.saved().record)),protocol);
  assert.equal(persisted.criteria.balance.status,'not_applicable');
  assert.equal(persisted.criteria.balance.note,'本次没做这个任务');
  const restored=mounted({records:[persisted],draft:persisted});
  assert.match(restored.root.innerHTML,/已观察 1 \/ 2 项 · 本次不适用 1 项/);
});

test('隐藏项的缺失证据会展开到对应项目，不会使错误提示指向不存在的表单',()=>{
  const b=mounted({testProtocol:fullProtocol,focusCriteriaIds:focus,draft:{criteria:{c10:{status:'not_applicable',note:''}}}});
  submit(b);
  assert.equal(b.saved(),undefined);
  assert.equal(shownCriteria(b).length,11);
  assert.equal(b.focused(),'note-c10');
  assert.match(b.status.textContent,/c10.*本次不适用的原因/);
});
