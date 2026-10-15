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
function mounted({draft,records=[],fieldHints}:{draft?:any;records?:any[];fieldHints?:Record<string,unknown>}={}){
  const values=new Map<string,string>();
  const form:any={elements:{namedItem:()=>({focus(){}})}};
  const status={textContent:''},newButton:any={},input={focus(){}},editor={open:false,scrollIntoView(){}};
  let html='',editButtons:any[]=[],saved:any,drafted:any;
  const root:any={
    get innerHTML(){return html;},
    set innerHTML(value:string){html=value;editButtons=[...value.matchAll(/data-assessment-edit="([^"]*)"/g)].map(m=>({dataset:{assessmentEdit:m[1]}}));},
    querySelector(selector:string){return selector==='form'?form:selector==='[data-assessment-status]'?status:selector==='[data-assessment-new]'?newButton:selector==='.assessment-editor'?editor:input;},
    querySelectorAll(selector:string){return selector==='[data-assessment-edit]'?editButtons:[];},
  };
  const context=vm.createContext({window:{confirm:()=>true},crypto:{randomUUID:()=> 'new-run'},FormData:class{get(key:string){return values.get(key)||null;}}});
  vm.runInContext(readFileSync(new URL('../assessment.js',import.meta.url),'utf8'),context);
  context.window.SnowAssessment.mount(root,{protocol:{...protocol,title:'测试协议',criteria:protocol.criteria.map(c=>({...c,title:c.id})),fieldHints},records,draft,
    onDraft:(record:any)=>{drafted=record;},onSave:(next:any,record:any)=>{saved={next,record};},onLesson:()=>{}});
  return {root,values,form,status,edit:()=>editButtons[0].onclick(),saved:()=>saved,drafted:()=>drafted};
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
