import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../analytics.js', import.meta.url), 'utf8');
const websiteId = 'd51cd751-851a-4e2f-a668-3780ca6593a2';
type Payload = { url:string; title:string; referrer:string; name?:string; data?:{seconds:number}; id?:string };

function browser({ href = 'https://jinke.me/snowboard/', referrer = '', configured = true,
  doNotTrack = '0', globalPrivacyControl = false, visibility = 'visible', scriptUrl = 'https://cloud.umami.is/script.js' } = {}) {
  let now = 0, timerId = 0;
  const location = new URL(href), calls:Payload[] = [];
  const timers = new Map<number, { callback:()=>void; delay:number; interval:boolean }>();
  const windowListeners = new Map<string, Set<()=>void>>(), documentListeners = new Map<string, Set<()=>void>>();
  const add = (listeners:Map<string, Set<()=>void>>, type:string, callback:()=>void) => {
    if (!listeners.has(type)) listeners.set(type, new Set());
    listeners.get(type)!.add(callback);
  };
  class Script {
    attributes:Record<string,string> = {};
    async = false; src = ''; referrerPolicy = ''; removed = false;
    onload:(()=>void)|null = null;
    onerror:(()=>void)|null = null;
    setAttribute(key:string, value:string) { this.attributes[key] = value; }
    remove() { this.removed = true; }
  }
  const scripts:Script[] = [];
  const document = {
    referrer, title:'Default title with private state', visibilityState:visibility,
    head:{append(script:Script) { scripts.push(script); }},
    createElement(tag:string) { assert.equal(tag, 'script'); return new Script(); },
    addEventListener(type:string, callback:()=>void) { add(documentListeners, type, callback); },
    removeEventListener(type:string, callback:()=>void) { documentListeners.get(type)?.delete(callback); },
  };
  const navigator = { doNotTrack, globalPrivacyControl };
  const window:{
    SNOW_ANALYTICS_CONFIG?:{websiteId:string; scriptUrl:string};
    SnowAnalytics?:{view:(descriptor:{path:string; title:string})=>void};
    umami?:{track:(callback:(props:Payload)=>Payload)=>unknown};
    addEventListener:(type:string, callback:()=>void)=>void;
    removeEventListener:(type:string, callback:()=>void)=>void;
  } = {
    ...(configured ? {SNOW_ANALYTICS_CONFIG:{websiteId, scriptUrl}} : {}),
    addEventListener(type, callback) { add(windowListeners, type, callback); },
    removeEventListener(type, callback) { windowListeners.get(type)?.delete(callback); },
  };
  const context = vm.createContext({ window, location, navigator, document, URL, URLSearchParams, Promise,
    performance:{now:()=>now},
    setInterval(callback:()=>void, delay:number) { timers.set(++timerId, {callback, delay, interval:true}); return timerId; },
    setTimeout(callback:()=>void, delay:number) { timers.set(++timerId, {callback, delay, interval:false}); return timerId; },
    clearInterval(id:number) { timers.delete(id); }, clearTimeout(id:number) { timers.delete(id); },
    get localStorage() { throw Error('Personal storage must not be read'); },
  });
  vm.runInContext(source, context);
  return {
    scripts, calls, timers, window, navigator, document, windowListeners, documentListeners,
    view:(path='/snowboard/', title='首页') => window.SnowAnalytics!.view({path,title}),
    advance:(milliseconds:number) => { now += milliseconds; },
    load(result?:()=>unknown) {
      window.umami = { track(callback) {
        const payload = callback({url:location.href,title:document.title,referrer:document.referrer,id:'unexpected-default-id'});
        calls.push(JSON.parse(JSON.stringify(payload)));
        return result?.();
      } };
      scripts[0].onload!();
    },
    hide() { document.visibilityState = 'hidden'; for (const callback of documentListeners.get('visibilitychange') || []) callback(); },
    show() { document.visibilityState = 'visible'; for (const callback of documentListeners.get('visibilitychange') || []) callback(); },
    fire(type:string) { for (const callback of windowListeners.get(type) || []) callback(); },
    heartbeat() { for (const timer of [...timers.values()]) if (timer.interval) timer.callback(); },
    fail() { scripts[0].onerror!(); },
    timeout() { for (const timer of [...timers.values()]) if (!timer.interval) timer.callback(); },
    repeatSource() { vm.runInContext(source, context); },
  };
}

test('unconfigured, non-production and privacy opt-out visits make no requests or timers', () => {
  for (const options of [
    {configured:false}, {href:'file:///tmp/snowboard-guide.html'},
    {href:'http://jinke.me/snowboard/'}, {href:'https://jinke.me:8443/snowboard/'},
    {href:'https://jinke.me/'}, {href:'https://jinke.me/snowboard-other/'},
    {href:'https://localhost/snowboard/'}, {href:'https://mirror.example/snowboard/'},
    {doNotTrack:'1'}, {globalPrivacyControl:true}, {scriptUrl:'javascript:alert(1)'},
    {scriptUrl:'https://user:password@cloud.umami.is/script.js'},
  ]) {
    const b = browser(options);
    b.view(); b.advance(90000); b.hide(); b.fire('pagehide');
    assert.equal(b.scripts.length, 0, JSON.stringify(options));
    assert.equal(b.timers.size, 0, JSON.stringify(options));
    assert.equal(b.calls.length, 0);
  }
});

test('only canonical paths are accepted and the tracker is lazy, asynchronous and manual', () => {
  const b = browser();
  assert.equal(b.scripts.length, 0);
  for (const path of ['/blog/', '/snowboard', '/snowboard/../secret', '/snowboard//secret',
    '/snowboard/lesson/x?utterances=private', '/snowboard/#lesson=x', '/snowboard/%2e%2e/']) b.view(path);
  assert.equal(b.scripts.length, 0);
  b.view('/snowboard/lesson/s-short');
  const script = b.scripts[0];
  assert.equal(script.async, true);
  assert.equal(script.src, 'https://cloud.umami.is/script.js');
  assert.equal(script.referrerPolicy, 'no-referrer');
  assert.equal(script.attributes['data-auto-track'], 'false');
  assert.equal(script.attributes['data-auto-pageview'], 'false');
  assert.equal(script.attributes['data-exclude-search'], 'true');
  assert.equal(script.attributes['data-exclude-hash'], 'true');
  assert.equal(script.attributes['data-website-id'], websiteId);
  b.repeatSource();
  b.view('/snowboard/lesson/s-short');
  assert.equal(b.scripts.length, 1);
  b.load();
  assert.equal(b.calls.length, 1);
  assert.equal(b.timers.size, 1, 'only the visible-time heartbeat remains after loading');
});

test('OAuth, unknown query and hash never escape; allowed UTM and external origin are bounded', () => {
  const utm = new URLSearchParams({utterances:'private-session',q:'private-search',utm_source:'newsletter',
    utm_medium:'email',utm_campaign:'winter',utm_content:'intro',utm_term:'a'.repeat(150)});
  const b = browser({href:'https://jinke.me/snowboard/?'+utm+'#lesson=private-hash',
    referrer:'https://search.example/private/path?token=private-referrer#private-anchor'});
  b.view('/snowboard/lesson/s-short', '公开课程'); b.load();
  const payload = b.calls[0], url = new URL(payload.url, 'https://jinke.me');
  assert.equal(url.pathname, '/snowboard/lesson/s-short');
  assert.equal(url.searchParams.size, 5);
  assert.equal(url.searchParams.get('utm_source'), 'newsletter');
  assert.equal(url.searchParams.get('utm_term')!.length, 100);
  assert.equal(payload.referrer, 'https://search.example');
  assert.equal(payload.title, '公开课程');
  assert.equal(payload.id, undefined);
  assert.doesNotMatch(JSON.stringify(b.calls), /private|unexpected-default-id/);
  for (const referrer of ['https://jinke.me/blog/?secret=x', 'javascript:secret', 'invalid']) {
    const direct = browser({referrer}); direct.view(); direct.load();
    assert.equal(direct.calls[0].referrer, '');
  }
});

test('repeated rendering does not duplicate pageviews or reset the visible-time clock', () => {
  const b = browser(); b.view(); b.load();
  b.advance(1250); b.view(); b.advance(1750); b.view();
  b.view('/snowboard/lesson/a', 'A课');
  assert.deepEqual(b.calls, [
    {url:'/snowboard/',title:'首页',referrer:''},
    {url:'/snowboard/',title:'首页',referrer:'',name:'page_visible',data:{seconds:3}},
    {url:'/snowboard/lesson/a',title:'A课',referrer:'/snowboard/'},
  ]);
});

test('queued dwell and PV keep the old view URL, title and referrer after quick navigation', () => {
  const b = browser({referrer:'https://search.example/?private=1'});
  b.view('/snowboard/lesson/a', 'A课'); b.advance(2000);
  b.view('/snowboard/lesson/b', 'B课'); b.advance(3000);
  b.view('/snowboard/lesson/c', 'C课'); b.load();
  assert.deepEqual(b.calls, [
    {url:'/snowboard/lesson/a',title:'A课',referrer:'https://search.example'},
    {url:'/snowboard/lesson/a',title:'A课',referrer:'https://search.example',name:'page_visible',data:{seconds:2}},
    {url:'/snowboard/lesson/b',title:'B课',referrer:'/snowboard/lesson/a'},
    {url:'/snowboard/lesson/b',title:'B课',referrer:'/snowboard/lesson/a',name:'page_visible',data:{seconds:3}},
    {url:'/snowboard/lesson/c',title:'C课',referrer:'/snowboard/lesson/b'},
  ]);
});

test('hidden, pagehide and restore do not double count or include background time', () => {
  const b = browser(); b.view(); b.load(); b.advance(2500); b.hide();
  b.fire('pagehide'); b.advance(120000); b.heartbeat(); b.fire('pagehide');
  assert.deepEqual(b.calls.filter(call=>call.name).map(call=>call.data!.seconds), [2.5]);
  b.show(); b.advance(2000); b.heartbeat();
  assert.equal(b.calls.length, 2, 'visibility alone does not resume a page in bfcache');
  b.fire('pageshow'); b.advance(3500); b.hide(); b.fire('pagehide');
  assert.deepEqual(b.calls.filter(call=>call.name).map(call=>call.data!.seconds), [2.5, 3.5]);
  assert.equal(b.calls.filter(call=>!call.name).length, 1);
});

test('ordinary visibility changes and the minute heartbeat send only new visible increments', () => {
  const b = browser({visibility:'hidden'}); b.view(); b.load();
  b.advance(60000); b.heartbeat();
  assert.equal(b.calls.length, 1);
  b.show(); b.advance(60000); b.heartbeat(); b.advance(15000); b.heartbeat();
  b.advance(5000); b.hide(); b.advance(90000); b.heartbeat(); b.hide();
  assert.deepEqual(b.calls.filter(call=>call.name).map(call=>call.data!.seconds), [60, 15, 5]);
  assert.ok([...b.timers.values()].some(timer=>timer.interval && timer.delay===60000));
  b.show(); b.advance(4000); b.fire('pagehide'); b.hide();
  assert.deepEqual(b.calls.filter(call=>call.name).map(call=>call.data!.seconds), [60, 15, 5, 4]);
});

test('loading has a bounded queue and failure or timeout permanently releases tracking work', () => {
  const queued = browser();
  for (let i=0; i<100; i++) queued.view('/snowboard/lesson/l'+i);
  queued.load();
  assert.equal(queued.calls.length, 32);
  assert.equal(queued.calls[31].url, '/snowboard/lesson/l99');
  for (const failure of ['fail','timeout'] as const) {
    const b = browser(); b.view(); b.advance(2000); b.view('/snowboard/lesson/a');
    b[failure](); b.view('/snowboard/lesson/b'); b.advance(90000); b.heartbeat();
    assert.equal(b.calls.length, 0);
    assert.equal(b.scripts.length, 1);
    assert.equal(b.scripts[0].removed, true);
    assert.equal(b.scripts[0].onload, null);
    assert.equal(b.timers.size, 0);
    assert.ok([...b.windowListeners.values(), ...b.documentListeners.values()].every(listeners=>listeners.size===0));
  }
});

test('synchronous and asynchronous tracker failures do not escape or interrupt later views', async () => {
  for (const result of [()=>{throw Error('blocked');}, ()=>Promise.reject(Error('offline'))]) {
    const b = browser(); b.view();
    assert.doesNotThrow(()=>b.load(result)); b.advance(5000);
    assert.doesNotThrow(()=>b.view('/snowboard/lesson/a'));
    await new Promise<void>(resolve=>setImmediate(resolve));
    assert.equal(b.calls.length, 3);
  }
  const optedOut = browser(); optedOut.view(); optedOut.load();
  optedOut.navigator.globalPrivacyControl = true;
  optedOut.advance(10000); optedOut.heartbeat();
  assert.equal(optedOut.calls.length, 1);
  assert.equal(optedOut.timers.size, 0);
});
