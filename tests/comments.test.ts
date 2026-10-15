import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const source=readFileSync(new URL('../comments.js',import.meta.url),'utf8');
const content=JSON.parse(readFileSync(new URL('../content.json',import.meta.url),'utf8'));

// A small DOM boundary double keeps these lifecycle/protocol checks independent
// of browser network access; the real third-party UI is checked in the browser.
class Element {
  children:Element[]=[];
  parent:Element|null=null;
  style:Record<string,string>={};
  attributes:Record<string,string>={};
  contentWindow={};
  className='';textContent='';href='';src='';hidden=false;
  onclick:(()=>void)|null=null;
  constructor(readonly tagName='div'){}
  append(...nodes:Element[]){for(const node of nodes){node.parent=this;this.children.push(node);}}
  replaceChildren(...nodes:Element[]){for(const child of this.children)child.parent=null;this.children=[];this.append(...nodes);}
  remove(){if(this.parent){this.parent.children=this.parent.children.filter(child=>child!==this);this.parent=null;}}
  setAttribute(name:string,value:string){this.attributes[name]=value;}
}

function browser({href='https://jinke.me/snowboard/#lesson=s-short',online=true,storageDisabled=false,lazy=false,savedSession=''}={}){
  const root=new Element(),location=new URL(href),navigator={onLine:online};
  const storage=new Map<string,string>([['snowboard-field-guide-BV161TT6gE7L-v1','{"user":{"bookmarks":["s-short"]}}']]);
  if(savedSession)storage.set('snowboard-utterances-session',savedSession);
  const listeners=new Map<string,Set<(event:unknown)=>void>>(),timers=new Map<number,()=>void>();
  let timerId=0;
  const observers:{disconnected:boolean;observe:(node:Element)=>void;disconnect:()=>void;trigger:()=>void}[]=[];
  const localStorage={
    getItem(key:string){if(storageDisabled)throw Error('Storage denied');return storage.get(key)??null;},
    setItem(key:string,value:string){if(storageDisabled)throw Error('Storage denied');storage.set(key,value);}
  };
  const window:{
    addEventListener:(type:string,callback:(event:unknown)=>void)=>void;
    removeEventListener:(type:string,callback:(event:unknown)=>void)=>void;
    IntersectionObserver?:unknown;
    SnowComments?:{mount:(root:Element,lesson:{lessonId:string;title:string})=>{destroy:()=>void}};
  }={
    addEventListener(type,callback){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type)!.add(callback);},
    removeEventListener(type,callback){listeners.get(type)?.delete(callback);}
  };
  if(lazy)window.IntersectionObserver=class {
    disconnected=false;
    constructor(readonly callback:(entries:{isIntersecting:boolean}[])=>void){observers.push(this);}
    observe(_node:Element){}
    disconnect(){this.disconnected=true;}
    trigger(){this.callback([{isIntersecting:true}]);}
  };
  const context=vm.createContext({
    window,location,navigator,localStorage,URL,URLSearchParams,TextEncoder,
    history:{state:{route:'preserved'},replaceState(state:unknown,_title:string,url:string){assert.deepEqual(state,{route:'preserved'});location.href=url;}},
    document:{createElement:(tag:string)=>new Element(tag)},
    setTimeout(callback:()=>void){timers.set(++timerId,callback);return timerId;},
    clearTimeout(id:number){timers.delete(id);}
  });
  vm.runInContext(source,context);
  return {
    root,location,navigator,storage,listeners,timers,observers,window,
    mount:(lessonId='s-short',title='搓雪小回转')=>window.SnowComments!.mount(root,{lessonId,title}),
    frame:()=>root.children.find(child=>child.tagName==='iframe')!,
    status:()=>root.children.find(child=>child.className==='comments-status')!,
    retry:()=>root.children.find(child=>child.className==='comments-actions')!.children[0],
    send:(event:unknown)=>{for(const callback of listeners.get('message')??[])callback(event);}
  };
}

test('each stable lesson ID maps to an independent issue and OAuth returns to its canonical course',()=>{
  const b=browser(),terms:string[]=[];
  const ids=[...content.lessons.map((lesson:{id:string})=>lesson.id),'s-short','s-short-next','s','s-end','雪上'];
  for(const lessonId of new Set<string>(ids)){
    const mounted=b.mount(lessonId),url=new URL(b.frame().src),term=url.searchParams.get('issue-term')!;
    assert.equal(url.origin,'https://utteranc.es');
    assert.equal(url.pathname,'/utterances.html');
    assert.equal(url.searchParams.get('repo'),'yichenluan/snowboard');
    assert.equal(url.searchParams.get('url'),'https://jinke.me/snowboard/#lesson='+encodeURIComponent(lessonId));
    assert.equal(url.searchParams.get('origin'),'https://jinke.me');
    assert.match(term,/^[a-z0-9]+$/);
    for(const previous of terms){assert.ok(!term.includes(previous));assert.ok(!previous.includes(term));}
    terms.push(term);
    mounted.destroy();
    const renamed=b.mount(lessonId,'改过标题的同一课程');
    assert.equal(new URL(b.frame().src).searchParams.get('issue-term'),term);
    renamed.destroy();
  }
});

test('only finite resize messages from the current Utterances frame may change its height',()=>{
  const b=browser(),mounted=b.mount(),frame=b.frame();
  const valid={origin:'https://utteranc.es',source:frame.contentWindow,data:{type:'resize',height:412.3}};
  for(const event of [
    {...valid,origin:'https://attacker.example'},
    {...valid,source:{}},
    ...[0,-1,NaN,Infinity,'412',1000001].map(height=>({...valid,data:{type:'resize',height}})),
    {...valid,data:{type:'other',height:500}}
  ])b.send(event);
  assert.equal(frame.style.height,'320px');
  assert.equal(b.status().hidden,false);
  b.send(valid);
  assert.equal(frame.style.height,'413px');
  assert.equal(b.status().hidden,true);
  assert.equal(b.timers.size,0);
  mounted.destroy();
});

test('course switching and retry remove old frames, resize listeners and pending timers',()=>{
  const b=browser();
  for(let i=0;i<20;i++){
    const mounted=b.mount('lesson-'+i),previous=b.frame();
    assert.equal(b.listeners.get('message')!.size,1);
    assert.equal(b.timers.size,1);
    for(const callback of [...b.timers.values()])callback();
    assert.match(b.status().textContent,/仍在加载/);
    assert.equal(b.frame(),previous,'a slow response must not be treated as failure');
    b.retry().onclick!();
    assert.notEqual(b.frame(),previous);
    b.send({origin:'https://utteranc.es',source:previous.contentWindow,data:{type:'resize',height:900}});
    assert.equal(b.frame().style.height,'320px');
    assert.equal(b.listeners.get('message')!.size,1);
    assert.equal(b.timers.size,1);
    mounted.destroy();mounted.destroy();
    assert.equal(b.root.children.length,0);
    assert.equal(b.listeners.get('message')!.size,0);
    assert.equal(b.timers.size,0);
  }
});

test('lazy loading starts near the comments and a destroyed observer cannot load a departed course',()=>{
  const b=browser({lazy:true}),first=b.mount();
  assert.equal(b.frame(),undefined);
  assert.equal(b.timers.size,0);
  first.destroy();
  assert.equal(b.observers[0].disconnected,true);
  b.observers[0].trigger();
  assert.equal(b.frame(),undefined);
  const second=b.mount('next');
  b.observers[1].trigger();
  const frame=b.frame();
  assert.ok(frame);
  assert.equal(b.observers[1].disconnected,true);
  b.observers[1].trigger();
  assert.equal(b.frame(),frame,'a queued observer callback must not reset a loaded comment draft');
  second.destroy();
});

test('saved files and offline pages do not request comments; retry recovers after reconnection',()=>{
  const file=browser({href:'file:///tmp/snowboard-guide.html#lesson=s-short'}),saved=file.mount();
  assert.equal(file.frame(),undefined);
  assert.match(file.status().textContent,/离线网页/);
  const onlineLink=file.root.children[1].children[1];
  assert.equal(onlineLink.href,'https://jinke.me/snowboard/#lesson=s-short');
  assert.equal(onlineLink.hidden,false);
  saved.destroy();
  const b=browser({online:false}),mounted=b.mount();
  assert.equal(b.frame(),undefined);
  assert.equal(b.timers.size,0);
  assert.equal(b.retry().hidden,false);
  b.navigator.onLine=true;
  b.retry().onclick!();
  assert.ok(b.frame());
  mounted.destroy();
});

test('OAuth callback is consumed at startup, preserves the course and stays separate from user records',()=>{
  const b=browser({href:'https://jinke.me/snowboard/?keep=1&utterances=test-session#lesson=s-short'});
  assert.equal(b.location.href,'https://jinke.me/snowboard/?keep=1#lesson=s-short');
  assert.equal(b.storage.get('snowboard-utterances-session'),'test-session');
  assert.equal(b.storage.get('snowboard-field-guide-BV161TT6gE7L-v1'),'{"user":{"bookmarks":["s-short"]}}');
  assert.deepEqual(Object.keys(b.window.SnowComments!),['mount'],'the public API must not expose session state');
  const first=b.mount();
  assert.equal(new URL(b.frame().src).searchParams.get('session'),'test-session');
  first.destroy();
  const second=b.mount('next');
  assert.equal(new URL(b.frame().src).searchParams.get('session'),'test-session');
  second.destroy();
  const reload=browser({savedSession:'test-session'}),mounted=reload.mount();
  assert.equal(new URL(reload.frame().src).searchParams.get('session'),'test-session');
  mounted.destroy();
});

test('OAuth callback remains usable in memory when the browser denies persistent storage',()=>{
  const b=browser({storageDisabled:true,href:'https://jinke.me/snowboard/?utterances=memory-session#lesson=s-short'});
  assert.equal(b.location.search,'');
  const mounted=b.mount();
  assert.equal(new URL(b.frame().src).searchParams.get('session'),'memory-session');
  mounted.destroy();
});
