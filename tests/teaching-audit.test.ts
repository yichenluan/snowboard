import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
function fixture(){
  const dir=mkdtempSync(join(tmpdir(),'snowboard-teaching-audit-'));
  mkdirSync(join(dir,'scripts'));mkdirSync(join(dir,'docs'));
  for(const path of ['content.json','app.js','guide-state.js','progression.js','styles.css','progression.css','build.py','shell.html','comments.js','animations.js','lesson-player','prototype','scripts/inventory-teaching.mjs','docs/teaching-audit-review.json'])cpSync(join(root,path),join(dir,path),{recursive:true});
  // Use this test's explicit observations, never any real user/browser evidence.
  const manual=JSON.parse(readFileSync(join(dir,'docs/teaching-audit-review.json'),'utf8'));manual.observations=[];manual.reviewedLessons=[];manual.reviewedEntries=[];
  const save=()=>writeFileSync(join(dir,'docs/teaching-audit-review.json'),JSON.stringify(manual));save();
  const run=(...args:string[])=>spawnSync(process.execPath,['scripts/inventory-teaching.mjs',...args],{cwd:dir,encoding:'utf8'});
  const report=()=>JSON.parse(readFileSync(join(dir,'docs/teaching-audit.json'),'utf8'));
  return {dir,manual,save,run,report,clean:()=>rmSync(dir,{recursive:true,force:true})};
}
function generate(f:ReturnType<typeof fixture>){const result=f.run();assert.equal(result.status,0,result.stderr||JSON.stringify(f.report().structural));}

test('教学清单不会从源码/历史迁移记录推导访问、渲染或教学通过',()=>{
  const f=fixture();try{
    generate(f);
    const report=f.report();
    assert.equal(report.counts.pageAccessible,0);assert.equal(report.counts.animationRendered,0);assert.equal(report.counts.teachingVerified,0);
    const animations=report.entries.filter((entry:any)=>entry.kind==='animation');
    const data=JSON.parse(readFileSync(join(f.dir,'content.json'),'utf8'));
    assert.equal(animations.length,data.lessons.reduce((n:number,l:any)=>n+(l.demos?.length||Number(!!l.demo)),0));
    assert.ok(animations.every((entry:any)=>entry.states.codePresent.status==='present'&&entry.states.animationRendered.status==='not-verified'));
    assert.equal(f.run('--check').status,0);
    writeFileSync(join(f.dir,'docs/teaching-audit.md'),'outdated');assert.equal(f.run('--check').status,1);
  }finally{f.clean();}
});

test('实际观察仅认可对应条目和维度，源码变动后证据自动过期',()=>{
  const f=fixture();try{
    generate(f);
    const target=f.report().entries.find((entry:any)=>entry.kind==='animation');
    f.manual.observations=[{id:target.id,dimension:'animationRendered',fingerprint:target.fingerprint,status:'passed',date:'test-fixture',scope:'synthetic fixture',evidence:['test-only observation; never published']}];f.save();
    generate(f);
    assert.equal(f.report().counts.animationRendered,1);assert.equal(f.report().counts.pageAccessible,0);assert.equal(f.report().counts.teachingVerified,0);
    writeFileSync(join(f.dir,'lesson-player/motion.ts'),readFileSync(join(f.dir,'lesson-player/motion.ts'),'utf8')+'\n// changed source fixture\n');
    generate(f);
    const changed=f.report().entries.find((entry:any)=>entry.id===target.id);
    assert.equal(changed.states.animationRendered.status,'stale');assert.equal(f.report().counts.animationRendered,0);
  }finally{f.clean();}
});

test('教学通过拒绝缺乏结论来源的记录，正文修改不会沿用全文已读状态',()=>{
  const f=fixture();try{
    generate(f);
    const initial=f.report();
    const target=initial.entries.find((entry:any)=>entry.kind==='lesson');
    const initialTerm=initial.entries.find((entry:any)=>entry.kind==='term');
    const review={date:'test-fixture',reviewer:'synthetic fixture',summary:'Not real reading evidence',evidence:['test-only']};
    f.manual.reviewedLessons=[{...review,id:target.lessonId,fingerprint:target.contentFingerprint,parts:['mechanics']}];
    f.manual.reviewedEntries=[{...review,id:initialTerm.id,fingerprint:initialTerm.contentFingerprint,parts:['definition']}];
    f.save();generate(f);
    assert.equal(f.report().entries.find((entry:any)=>entry.id===target.id).review.status,'text-reviewed');
    f.manual.observations=[{id:target.id,dimension:'teachingVerified',fingerprint:target.fingerprint,status:'passed',date:'test-fixture',scope:'synthetic fixture',evidence:['unsupported assertion']}];f.save();
    const refused=f.run();assert.notEqual(refused.status,0);assert.match(refused.stderr,/逐结论来源/);
    f.manual.observations=[];f.save();
    const path=join(f.dir,'content.json'),data=JSON.parse(readFileSync(path,'utf8'));
    data.lessons.find((lesson:any)=>lesson.id===target.lessonId).goal+=' 测试变更';writeFileSync(path,JSON.stringify(data));
    generate(f);
    assert.equal(f.report().entries.find((entry:any)=>entry.id===target.id).review.status,'needs-recheck');
    const term=f.report().entries.find((entry:any)=>entry.kind==='term'&&entry.review.status==='text-reviewed');
    assert.ok(term);assert.ok(term.review.reviewer);assert.ok(term.review.evidence.length);
    data.glossary.find((entry:any)=>`term:${entry.id}`===term.id).definition+=' 测试变更';writeFileSync(path,JSON.stringify(data));
    generate(f);
    assert.equal(f.report().entries.find((entry:any)=>entry.id===term.id).review.status,'needs-recheck');
    assert.equal(f.report().counts.teachingVerified,0);
  }finally{f.clean();}
});

test('真人片段单独登记，存在时刻不自动授予实看状态',()=>{
  const f=fixture();try{
    generate(f);
    const report=f.report(),data=JSON.parse(readFileSync(join(f.dir,'content.json'),'utf8'));
    assert.equal(report.byKind['video-segment'].discovered,data.lessons.reduce((n:number,l:any)=>n+(l.videoStudy?.segments.length||0),0));
    assert.equal(report.byKind['video-segment'].dimensions.teachingVerified.passed,0);
    assert.ok(report.inputs['build.py']);
    const lesson=data.lessons.find((l:any)=>l.videoStudy);lesson.videoStudy.segments[0].end=lesson.videoStudy.segments[0].start-1;
    writeFileSync(join(f.dir,'content.json'),JSON.stringify(data));
    const result=f.run();assert.notEqual(result.status,0);assert.match(result.stdout,/时间范围无效/);
  }finally{f.clean();}
});

function observe(f:ReturnType<typeof fixture>,entries:any[],dimension='animationRendered'){
  f.manual.observations=entries.map(entry=>({id:entry.id,dimension,fingerprint:entry.fingerprint,status:'passed',date:'test-fixture',scope:'synthetic fixture only',evidence:['test-only; never a real observation']}));f.save();
}
function changeSource(f:ReturnType<typeof fixture>,file:string){writeFileSync(join(f.dir,file),readFileSync(join(f.dir,file),'utf8')+'\n// changed dependency fixture\n');}

test('独立 JSBA 任务及其腿长求解只使相依动画过期，基础动画不受无关模块影响',()=>{
  const f=fixture();try{
    generate(f);
    const byId=(id:string)=>f.report().entries.find((entry:any)=>entry.id===id);
    const base=byId('animation:v-toe-tongue/1'),expert=byId('animation:s-carve-expert-pressure/1');
    for(const file of ['lesson-player/jsba-carving.ts','lesson-player/leg-length.ts']){
      const current=byId(expert.id);
      assert.ok(!base.dependencyFiles.includes(file));
      assert.ok(current.dependencyFiles.includes(file));
      observe(f,[base,current]);generate(f);
      changeSource(f,file);generate(f);
      assert.equal(byId(base.id).fingerprint,base.fingerprint);
      assert.equal(byId(base.id).states.animationRendered.status,'passed');
      assert.equal(byId(expert.id).states.animationRendered.status,'stale');
      assert.notEqual(byId(expert.id).fingerprint,current.fingerprint);
    }
  }finally{f.clean();}
});

test('共享人体、场景和播放器源码仍使全部依赖引用失效，不按任务隔离共同约束',()=>{
  const f=fixture();try{
    generate(f);
    for(const file of ['prototype/motion.ts','prototype/scene.tsx','lesson-player/main.tsx']){
      const animations=f.report().entries.filter((entry:any)=>entry.kind==='animation');
      assert.ok(animations.every((entry:any)=>entry.dependencyFiles.includes(file)),file);
      observe(f,animations);generate(f);changeSource(f,file);generate(f);
      const changed=f.report().entries.filter((entry:any)=>entry.kind==='animation');
      assert.ok(changed.every((entry:any)=>entry.states.animationRendered.status==='stale'),file);
    }
  }finally{f.clean();}
});

test('新增共享导入沿真实依赖传播，独立原型不被课内模块改动误伤',()=>{
  const f=fixture();try{
    const path=join(f.dir,'lesson-player/turns.ts');
    writeFileSync(path,readFileSync(path,'utf8')+'\nimport { auditValue } from "./audit-helper";\n');
    writeFileSync(join(f.dir,'lesson-player/audit-helper.ts'),'export const auditValue=1;\n');
    generate(f);
    const before=f.report();
    const rails=before.entries.find((e:any)=>e.id==='animation:s20-rails/1');
    const base=before.entries.find((e:any)=>e.id==='animation:v-toe-tongue/1');
    const prototype=before.entries.find((e:any)=>e.id==='prototype:correct');
    assert.ok(rails.dependencyFiles.includes('lesson-player/audit-helper.ts'));
    assert.ok(!base.dependencyFiles.includes('lesson-player/audit-helper.ts'));
    observe(f,[rails,base,prototype]);generate(f);
    changeSource(f,'lesson-player/audit-helper.ts');generate(f);
    const current=f.report();
    assert.equal(current.entries.find((e:any)=>e.id===rails.id).states.animationRendered.status,'stale');
    assert.equal(current.entries.find((e:any)=>e.id===base.id).states.animationRendered.status,'passed');
    assert.equal(current.entries.find((e:any)=>e.id===prototype.id).states.animationRendered.status,'passed');
  }finally{f.clean();}
});

test('guide-state 进入页面指纹，旧算法记录不迁移为新算法通过',()=>{
  const f=fixture();try{
    generate(f);
    const initial=f.report(),page=initial.entries.find((e:any)=>e.id==='page:curriculum');
    const animation=initial.entries.find((e:any)=>e.kind==='animation');
    assert.ok(initial.inputs['guide-state.js']);assert.ok(page.dependencyFiles.includes('guide-state.js'));
    observe(f,[page],'pageAccessible');
    f.manual.observations.push({id:animation.id,dimension:'animationRendered',fingerprint:'previous-global-policy-fingerprint',status:'passed',date:'historical-test',scope:'synthetic old policy',evidence:['retained original record']});f.save();generate(f);
    assert.equal(f.report().entries.find((e:any)=>e.id===animation.id).states.animationRendered.status,'stale');
    changeSource(f,'guide-state.js');generate(f);
    assert.equal(f.report().entries.find((e:any)=>e.id===page.id).states.pageAccessible.status,'stale');
    assert.equal(f.manual.observations[1].fingerprint,'previous-global-policy-fingerprint','生成器不会重写人工证据');
  }finally{f.clean();}
});

test('导航路线独立登记并校验字段、重复和有效课程引用',()=>{
  const f=fixture();try{
    generate(f);
    const report=f.report(),path=join(f.dir,'content.json'),data=JSON.parse(readFileSync(path,'utf8'));
    const routes=report.entries.filter((e:any)=>e.kind==='navigation-route');
    assert.equal(routes.length,data.navigationRoutes.length);
    assert.ok(routes.every((e:any)=>e.review.status==='not-reviewed'&&e.states.teachingVerified.status==='not-verified'));
    assert.ok(!report.structural.warnings.some((warning:string)=>warning.includes('缺少 success')),'去重后检查实际自检来源');
    data.navigationRoutes[0].entry='';
    data.navigationRoutes[0].lessons.push(data.navigationRoutes[0].lessons[0],'missing-navigation-lesson');
    writeFileSync(path,JSON.stringify(data));
    const result=f.run();assert.equal(result.status,1);
    const errors=f.report().structural.errors.join('\n');
    assert.match(errors,/缺少有效 entry/);assert.match(errors,/含重复课程/);assert.match(errors,/missing-navigation-lesson/);
  }finally{f.clean();}
});
