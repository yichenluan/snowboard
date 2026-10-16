import assert from "node:assert/strict";
import {test} from "node:test";
import {BODY,boardToWorld,type MotionState,type Vec3} from "../prototype/motion.ts";
import {canRenderLesson,sampleLesson,type LessonConfig} from "../lesson-player/motion.ts";
import {supportsJsbaCarvingLesson,jsbaCarvingVariants,jsbaCarvingComparison,jsbaCarvingDurationMs,sampleJsbaCarvingLesson as sample} from "../lesson-player/jsba-carving.ts";
import {actualMeanLegLength as length} from "../lesson-player/leg-length.ts";
import {comparisonFor} from "../lesson-player/comparison.ts";
import {phaseRange} from "../lesson-player/playback.ts";

const base:LessonConfig[]=[
  {type:"jsba-carving",task:"basic-linked-carve",variant:"reference"},
  {type:"jsba-carving",task:"dynamic-linked-carve",variant:"reference"},
  {type:"jsba-carving",task:"carve-load-exit",variant:"complete"},
  {type:"jsba-carving",task:"carved-short-turns",variant:"reference"},
  {type:"jsba-carving",task:"carve-size-change",variant:"large-to-short"},
  {type:"jsba-carving",task:"low-linked-carve",variant:"low-dynamic"},
];
const configs=base.flatMap(c=>jsbaCarvingVariants(c).map(v=>({...c,variant:v.value})));
const sub=(a:Vec3,b:Vec3)=>a.map((v,i)=>v-b[i]) as Vec3,dist=(a:Vec3,b:Vec3)=>Math.hypot(...sub(a,b));
const near=(a:number,b:number,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,`${a} vs ${b}`);

test("JSBA family has six independent tasks, exact variants and no silently ignored strategy options",()=>{
  assert.equal(base.length,6);assert.equal(configs.length,15);
  for(const c of configs){
    assert.ok(canRenderLesson(c));assert.ok(supportsJsbaCarvingLesson(c));
    assert.ok(jsbaCarvingDurationMs(c)>=12000);
    for(const change of [{task:"unknown"},{variant:"unknown"},{variant:undefined},{posture:"low"},{transition:"extend"},{transition:"retract"},{turnShape:"open"},{timing:"late"},{rotationComparison:"natural"},{fromEdge:"unknown"},{pressureDiagram:true}]){
      const bad={...c,...change} as LessonConfig;assert.equal(canRenderLesson(bad),false);assert.throws(()=>sample(.2,bad));
    }
    for(const fromEdge of ["toe","heel"] as const){assert.ok(canRenderLesson({...c,fromEdge}));assert.doesNotThrow(()=>sampleLesson(.2,{...c,fromEdge}));}
    const reference=jsbaCarvingComparison(c)!;assert.notEqual(reference.config.variant,c.variant);assert.ok(canRenderLesson(reference.config));
    assert.deepEqual(comparisonFor(c,{variants:jsbaCarvingVariants(c)}),reference);
  }
});

test("all actual variants and both first edges/stances preserve shared boots and anatomical lengths",()=>{
  for(const c0 of configs)for(const fromEdge of ["toe","heel"] as const)for(const stance of ["regular","goofy"] as const)for(let i=0;i<=120;i++){
    const s=sample(i/120,{...c0,fromEdge},stance).state,j=s.joints;
    for(const leg of ["front","rear"] as const){
      near(dist(j[`${leg}Hip`],j[`${leg}Knee`]),BODY.thigh);near(dist(j[`${leg}Knee`],j[`${leg}Ankle`]),BODY.shin);
      assert.ok(dist(j[`${leg}Ankle`],boardToWorld([(leg==="front"?1:-1)*BODY.stanceWidth/2,BODY.ankleHeight,0],s.board))<1e-9);
      assert.ok(s.boots[leg].cuffPitch>=12&&s.boots[leg].cuffPitch<=18);
      assert.ok(s.metrics[`${leg}Knee`]>20&&s.metrics[`${leg}Knee`]<100,"author example range, not universal ROM");
      near(dist(j[`${leg}Shoulder`],j[`${leg}Elbow`]),BODY.upperArm);near(dist(j[`${leg}Elbow`],j[`${leg}Hand`]),BODY.forearm);
    }
    near(dist(j.frontHip,j.rearHip),BODY.hipWidth);near(dist(j.frontShoulder,j.rearShoulder),BODY.shoulderWidth);near(dist(j.pelvis,j.chest),BODY.trunk);
    for(const p of Object.values(j))assert.ok(p.every(Number.isFinite));
    for(const x of [-s.board.length/2,s.board.length/2])for(const z of [-s.board.width/2,s.board.width/2])assert.ok(boardToWorld([x,-s.board.thickness/2,z],s.board)[1]>=-1e-9);
  }
});

test("stable stage event IDs exercise both transitions and actual new edges/fall lines",()=>{
  for(const c0 of configs)for(const fromEdge of ["toe","heel"] as const){
    const c={...c0,fromEdge},ss=sample(0,c).stages,count=(ss.length-1)/6;
    assert.ok(count>=6);assert.equal(ss.filter(s=>s.event==="edge-engage").length,count);
    assert.equal(ss.filter(s=>s.event==="edge-flat").length,count);
    const first=fromEdge==="toe"?"toe":"heel";
    for(const [i,s] of ss.entries()){
      assert.ok(s.event);assert.ok(s.arc!==undefined);if(i)assert.ok(s.at>ss[i-1].at);
      const f=sample(s.at,c);assert.equal(f.stage,i);assert.equal(f.state.phaseName,s.title);
      if(s.event==="edge-flat"||s.event==="edge-release"||s.event==="sequence-end")assert.equal(f.state.edge,"flat");
      if(s.event==="edge-engage"){assert.equal(f.state.edge,s.arc!%2?(first==="toe"?"heel":"toe"):first);assert.ok(Math.abs(f.state.travel[0])>.4);}
      if(s.event==="fall-line"){near(f.state.travel[0],0);assert.notEqual(f.state.edge,"flat");}
    }
    const replay=phaseRange(ss,ss.length-1);assert.ok(replay.end-replay.start>.08);assert.equal(replay.end,1);
  }
});

test("independent carved paths agree with their analytic tangent; intentional pivot is the sole direction mismatch",()=>{
  for(const c of configs)for(let i=1;i<150;i++){
    const t=i/150,h=1e-6,s=sample(t,c).state,a=sample(t-h,c).state,b=sample(t+h,c).state,d=sub(b.board.position,a.board.position),n=Math.hypot(d[0],d[2]);
    assert.ok(Math.hypot(d[0]/n-s.travel[0],d[2]/n-s.travel[2])<2e-7);
    if(c.variant!=="pivoted")assert.ok(s.metrics.skidAngle<2e-5);
    const turn=(Math.atan2(b.travel[0],b.travel[2])-Math.atan2(a.travel[0],a.travel[2]))/(2*h);assert.ok(turn*s.board.roll<=1e-9);
  }
  const pure=sample(1/16,base[3]).state,pivoted=sample(1/16,{...base[3],variant:"pivoted"}).state;
  assert.deepEqual(pure.board.position,pivoted.board.position);near(pure.board.roll,pivoted.board.roll);assert.ok(pivoted.metrics.skidAngle>14.9);
});

test("basic extension and dynamic retraction differ in actual leg motion and both directions are independently organized",()=>{
  for(const fromEdge of ["toe","heel"] as const){
    const basic={...base[0],fromEdge},dynamic={...base[1],fromEdge};
    assert.ok(length(sample(0,basic).state)-length(sample(1/12,basic).state)>.05);
    assert.ok(length(sample(1/12,dynamic).state)-length(sample(0,dynamic).state)>.06);
    const toeFlat=sample(0,{...dynamic,fromEdge:"toe"}).state,heelFlat=sample(0,{...dynamic,fromEdge:"heel"}).state;
    assert.ok(Math.abs(toeFlat.joints.chest[1]-toeFlat.joints.pelvis[1]-(heelFlat.joints.chest[1]-heelFlat.joints.pelvis[1]))>.005);
    for(const [c,shift,kind] of [[basic,.16,"late-body"],[dynamic,.17,"late-retraction"]] as const){
      const delayed={...c,variant:kind};const samples=Array.from({length:1001},(_,i)=>length(sample(i/6000,delayed).state));
      const extreme=c.task==="basic-linked-carve"?Math.max(...samples):Math.min(...samples);
      assert.ok(Math.abs(samples.indexOf(extreme)/1000-shift)<.002);
      for(const t of [.01,.1,.2,.45,.7]){const a=sample(t,c).state,b=sample(t,delayed).state;assert.deepEqual(a.board,b.board);assert.deepEqual(a.boots,b.boots);assert.equal(a.edge,b.edge);}
    }
  }
});

test("low posture, strategy comparison and recovery are real changes with declared invariant pairs",()=>{
  const low=base[5],normal={...low,variant:"normal-dynamic"},basic={...low,variant:"low-basic"},recover={...low,variant:"recover"},dive={...low,variant:"chest-dive"};
  for(let i=0;i<=120;i++){
    const t=i/120,a=sample(t,low).state,b=sample(t,normal).state,r=sample(t,recover).state,d=sample(t,dive).state;
    assert.deepEqual(a.board,b.board);assert.deepEqual(a.board,d.board);assert.deepEqual(a.boots,d.boots);
    for(const k of ["frontAnkle","rearAnkle","frontKnee","rearKnee","frontHip","rearHip","pelvis"] as const)assert.deepEqual(a.joints[k],d.joints[k]);
    if(t<=1/3||t>=2/3)for(const k of Object.keys(b.joints) as (keyof typeof b.joints)[])assert.ok(dist(b.joints[k],r.joints[k])<1e-8);
  }
  for(const t of [1/12,3/12]){const a=sample(t,low).state,b=sample(t,normal).state;assert.ok(length(b)-length(a)>.04);assert.ok(b.joints.pelvis[1]-a.joints.pelvis[1]>.018);}
  assert.ok(length(sample(0,basic).state)-length(sample(0,low).state)>.14);
  for(const t of [1/12,3/12])near(length(sample(t,basic).state),length(sample(t,low).state),1e-7);
  assert.ok(dist(sample(1/12,low).state.joints.chest,sample(1/12,dive).state.joints.chest)>.08);
  assert.deepEqual(sample(3/12,low).state.joints,sample(3/12,dive).state.joints);
});

test("size changes exist in physical arc lengths and outlet comparison changes the actual route",()=>{
  const c=base[4],ss=sample(0,c).stages,starts=ss.filter(s=>s.event==="edge-flat").map(s=>s.at).concat(1);
  const lengths=starts.slice(0,-1).map((start,k)=>{const end=starts[k+1];let length=0,prev=sample(start,c).state.board.position;for(let i=1;i<=120;i++){const now=sample(start+(end-start)*i/120,c).state.board.position;length+=Math.hypot(now[0]-prev[0],now[2]-prev[2]);prev=now;}return length;});
  assert.ok(lengths[0]>lengths[2]*1.35&&lengths[2]>lengths[4]*1.5);assert.ok(lengths[6]>lengths[4]*1.5);
  const large=sample(.13,base[2]).state,shallow=sample(.13,{...base[2],variant:"cut-exit"}).state;assert.ok(dist(large.board.position,shallow.board.position)>.2);
  assert.ok(Math.abs(large.travel[0])>Math.abs(shallow.travel[0]));
});

test("mirroring, all arc joins and translated sequence replay retain continuous whole-body motion",()=>{
  const values=(t:number,c:LessonConfig)=>{const s=sample(t,c).state;return [...s.board.position,s.board.yaw,s.board.roll,...Object.values(s.joints).flat(),...s.gaze];};
  for(const c of configs){
    for(const t of [.013,.24,.51,.83]){const a=sample(t,c).state,b=sample(t,c,"goofy").state;for(const k of Object.keys(a.joints) as (keyof typeof a.joints)[])assert.ok(dist([-a.joints[k][0],a.joints[k][1],a.joints[k][2]],b.joints[k])<1e-10);assert.equal(a.edge,b.edge);}
    const ss=sample(0,c).stages;
    for(const stage of ss.filter(s=>s.event==="edge-flat"&&s.at>0)){
      const t=stage.at,jump=(h:number)=>{const a=values(t-h,c),b=values(t,c),d=values(t+h,c);return Math.max(...b.map((v,i)=>Math.abs((v-a[i])/h-(d[i]-v)/h)));};
      const coarse=jump(1e-4),fine=jump(2.5e-5);assert.ok(fine<coarse*.4+1e-4,`${c.task}/${c.variant}: ${coarse} to ${fine}`);
    }
    const a=sample(0,c).state,b=sample(1,c).state,delta=sub(b.board.position,a.board.position);
    for(const k of Object.keys(a.joints) as (keyof typeof a.joints)[])assert.ok(dist(a.joints[k],sub(b.joints[k],delta))<1e-8);
    near(a.board.yaw,b.board.yaw);near(a.board.roll,b.board.roll);
  }
});
