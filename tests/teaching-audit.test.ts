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
  for(const path of ['content.json','app.js','progression.js','styles.css','progression.css','assessment.js','assessment.css','build.py','shell.html','comments.js','animations.js','lesson-player','prototype','scripts/inventory-teaching.mjs','docs/teaching-audit-review.json'])cpSync(join(root,path),join(dir,path),{recursive:true});
  // Use this test's explicit observations, never any real user/browser evidence.
  const manual=JSON.parse(readFileSync(join(dir,'docs/teaching-audit-review.json'),'utf8'));manual.observations=[];
  const save=()=>writeFileSync(join(dir,'docs/teaching-audit-review.json'),JSON.stringify(manual));save();
  const run=(...args:string[])=>spawnSync(process.execPath,['scripts/inventory-teaching.mjs',...args],{cwd:dir,encoding:'utf8'});
  const report=()=>JSON.parse(readFileSync(join(dir,'docs/teaching-audit.json'),'utf8'));
  return {dir,manual,save,run,report,clean:()=>rmSync(dir,{recursive:true,force:true})};
}
function generate(f:ReturnType<typeof fixture>){const result=f.run();assert.equal(result.status,0,result.stderr||result.stdout);}

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
    const target=f.report().entries.find((entry:any)=>entry.kind==='lesson'&&entry.review.status==='text-reviewed');
    assert.ok(target);
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

test('训练协议、观察维度与真人片段单独登记，存在时刻不自动授予实看状态',()=>{
  const f=fixture();try{
    generate(f);
    const report=f.report(),data=JSON.parse(readFileSync(join(f.dir,'content.json'),'utf8'));
    assert.equal(report.byKind['assessment-protocol'].discovered,data.assessmentProtocols.length);
    assert.equal(report.byKind['assessment-criterion'].discovered,data.assessmentProtocols.reduce((n:number,p:any)=>n+p.criteria.length,0));
    assert.equal(report.byKind['video-segment'].discovered,data.lessons.reduce((n:number,l:any)=>n+(l.videoStudy?.segments.length||0),0));
    assert.equal(report.byKind['video-segment'].dimensions.teachingVerified.passed,0);
    assert.ok(report.inputs['assessment.js']);assert.ok(report.inputs['assessment.css']);assert.ok(report.inputs['build.py']);
    const protocol=report.entries.find((e:any)=>e.kind==='assessment-protocol');
    f.manual.observations=[{id:protocol.id,dimension:'pageAccessible',fingerprint:protocol.fingerprint,status:'passed',date:'test-fixture',scope:'synthetic only',evidence:['not a real browser observation']}];f.save();generate(f);
    assert.equal(f.report().entries.find((e:any)=>e.id===protocol.id).states.pageAccessible.status,'passed');
    writeFileSync(join(f.dir,'assessment.css'),readFileSync(join(f.dir,'assessment.css'),'utf8')+'\n/* layout changed */\n');generate(f);
    assert.equal(f.report().entries.find((e:any)=>e.id===protocol.id).states.pageAccessible.status,'stale');
    assert.ok(f.report().revalidation.some((e:any)=>e.id===protocol.id&&e.dimension==='pageAccessible'));
    const lesson=data.lessons.find((l:any)=>l.videoStudy);lesson.videoStudy.segments[0].end=lesson.videoStudy.segments[0].start-1;
    data.assessmentProtocols[0].criteria[0].lessonId='missing-lesson';
    writeFileSync(join(f.dir,'content.json'),JSON.stringify(data));
    const result=f.run();assert.notEqual(result.status,0);assert.match(result.stdout,/时间范围无效/);assert.match(result.stdout,/missing-lesson/);
  }finally{f.clean();}
});
