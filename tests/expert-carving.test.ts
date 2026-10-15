import assert from "node:assert/strict";
import {test} from "node:test";
import {BODY,boardToWorld,type MotionState,type Vec3} from "../prototype/motion.ts";
import type {LessonConfig} from "../lesson-player/motion.ts";
import {sampleCarvingLesson} from "../lesson-player/carving.ts";
import {sampleExpertCarvingLesson as sample,supportsExpertCarvingLesson,expertCarvingVariants,expertCarvingDurationMs,expertCarvingCorridor} from "../lesson-player/expert-carving.ts";
const configs:LessonConfig[]=[
  {type:"expert-carving",task:"expert-carve-arc",variant:"linked"},
  {type:"expert-carving",task:"expert-carve-release",variant:"coordinated"},
  {type:"expert-carving",task:"expert-carve-release",variant:"late-flex"},
  {type:"expert-carving",task:"expert-carve-adaptation",variant:"normal"},
  {type:"expert-carving",task:"expert-carve-adaptation",variant:"lower-recover"},
];
const sub=(a:Vec3,b:Vec3)=>a.map((v,i)=>v-b[i]) as Vec3,dist=(a:Vec3,b:Vec3)=>Math.hypot(...sub(a,b));
const meanLength=(s:MotionState)=>(dist(s.joints.frontHip,s.joints.frontAnkle)+dist(s.joints.rearHip,s.joints.rearAnkle))/2;

test("expert carving exposes only the independent supported task/variant contracts",()=>{
  for(const c of configs){
    assert.ok(supportsExpertCarvingLesson(c));assert.equal(expertCarvingDurationMs(c),24000);
    for(const option of expertCarvingVariants(c))assert.ok(supportsExpertCarvingLesson({...c,variant:option.value}));
    for(const change of [{type:"duck-carve"},{task:"linked-duck-carve"},{variant:"unknown"},{posture:"low"},{transition:"retract"},{turnShape:"open"},{fromEdge:"unknown"},{pressureDiagram:true}]){
      assert.equal(supportsExpertCarvingLesson({...c,...change} as LessonConfig),false);assert.throws(()=>sample(.4,{...c,...change} as LessonConfig));
    }
  }
  assert.equal(supportsExpertCarvingLesson({type:"expert-carving",task:"expert-carve-arc"}),false);
  assert.notDeepEqual(sample(.25,configs[0]).state.board,sampleCarvingLesson(.25,{type:"duck-carve",task:"linked-duck-carve",posture:"normal"}).state.board);
});

test("six complete arcs preserve actual boots, bone lengths, corridor and both stance identities",()=>{
  for(const c0 of configs)for(const fromEdge of ["toe","heel"] as const)for(const stance of ["regular","goofy"] as const){
    const c={...c0,fromEdge};
    for(let i=0;i<=480;i++){
      const f=sample(i/480,c,stance),s=f.state,j=s.joints;assert.deepEqual(f.corridor,expertCarvingCorridor);assert.ok(f.moving);
      for(const leg of ["front","rear"] as const){
        assert.ok(Math.abs(dist(j[`${leg}Hip`],j[`${leg}Knee`])-BODY.thigh)<1e-9);
        assert.ok(Math.abs(dist(j[`${leg}Knee`],j[`${leg}Ankle`])-BODY.shin)<1e-9);
        assert.ok(dist(j[`${leg}Ankle`],boardToWorld([(leg==="front"?1:-1)*BODY.stanceWidth/2,BODY.ankleHeight,0],s.board))<1e-9);
        assert.ok(s.metrics[`${leg}Knee`]>20&&s.metrics[`${leg}Knee`]<80,"example retains flexion room; not a medical limit");
        assert.ok(s.boots[leg].cuffPitch>=12&&s.boots[leg].cuffPitch<=18,"authored equipment range");
      }
      assert.ok(Math.abs(dist(j.pelvis,j.chest)-BODY.trunk)<1e-9);
      for(const point of Object.values(j))assert.ok(point.every(Number.isFinite));
      for(const x of [-s.board.length/2,s.board.length/2])for(const z of [-s.board.width/2,s.board.width/2]){
        const p=boardToWorld([x,-s.board.thickness/2,z],s.board);assert.ok(p[1]>=-1e-9);assert.ok(Math.abs(p[0])<=5);
      }
    }
  }
});

test("board follows the independent route tangent without pivot and roll matches turn direction",()=>{
  const h=1e-6;
  for(const c0 of configs)for(const fromEdge of ["toe","heel"] as const)for(const stance of ["regular","goofy"] as const)for(let i=1;i<180;i++){
    const c={...c0,fromEdge},t=i/180,s=sample(t,c,stance).state,a=sample(t-h,c,stance).state,b=sample(t+h,c,stance).state;
    const d=sub(b.board.position,a.board.position),length=Math.hypot(d[0],d[2]);
    assert.ok(Math.hypot(d[0]/length-s.travel[0],d[2]/length-s.travel[2])<1e-7);
    assert.ok(Math.abs(Math.cos(s.board.yaw)-s.travel[0])<1e-9);assert.ok(Math.abs(-Math.sin(s.board.yaw)-s.travel[2])<1e-9);
    assert.ok(s.metrics.skidAngle<1e-5);
    const turn=(Math.atan2(b.travel[0],b.travel[2])-Math.atan2(a.travel[0],a.travel[2]))/(2*h);
    assert.ok(turn*s.board.roll<=1e-8,"working edge turns into the authored arc, not against it");
  }
});

test("stage buttons reach real edge states and each working edge starts before its actual fall line",()=>{
  for(const c0 of configs)for(const fromEdge of ["toe","heel"] as const){
    const c={...c0,fromEdge},stages=sample(0,c).stages;assert.equal(stages.length,37);
    for(const [i,stage]of stages.entries()){
      const f=sample(stage.at,c);assert.equal(f.stage,i);if(i)assert.ok(stage.at>stages[i-1].at);
      if(stage.title.includes("开始建立")){assert.equal(f.state.edge,stage.title.startsWith("前刃")?"toe":"heel");assert.ok(stage.at<stages[i+2].at);assert.ok(Math.abs(f.state.travel[0])>.4);}
      if(stage.title.includes("通过落线")){assert.ok(Math.abs(f.state.travel[0])<1e-9);assert.notEqual(f.state.edge,"flat");}
      if(stage.title.includes("减到近平板"))assert.equal(f.state.edge,"flat");
    }
    const start=sample(0,c).state,end=sample(1,c).state,delta=sub(end.board.position,start.board.position);
    assert.ok(end.travel[2]>.5);assert.equal(end.edge,"flat");assert.ok(delta[2]>70);
    for(const key of Object.keys(start.joints) as (keyof typeof start.joints)[])assert.ok(dist(sub(end.joints[key],delta),start.joints[key])<1e-8);
    const toe=sample(1/12,{...c,fromEdge:"toe"}).state,heel=sample(1/12,{...c,fromEdge:"heel"}).state;
    assert.notEqual(toe.boots.front.cuffPitch,heel.boots.front.cuffPitch);assert.notEqual(toe.joints.chest[1]-toe.joints.pelvis[1],heel.joints.chest[1]-heel.joints.pelvis[1]);
  }
});

test("timing comparison shifts actual leg shortening while preserving board, knees, edge events and cuff",()=>{
  let difference=0;
  for(let i=0;i<=360;i++){
    const a=sample(i/360,configs[1]).state,b=sample(i/360,configs[2]).state;
    assert.deepEqual(a.board,b.board);assert.deepEqual(a.travel,b.travel);assert.deepEqual(a.boots,b.boots);assert.equal(a.edge,b.edge);
    assert.deepEqual(a.joints.frontKnee,b.joints.frontKnee);assert.deepEqual(a.joints.rearKnee,b.joints.rearKnee);
    difference=Math.max(difference,Math.abs(meanLength(a)-meanLength(b)));
  }
  assert.ok(difference>.02);
  const minimum=(c:LessonConfig)=>{const lengths=Array.from({length:1001},(_,i)=>meanLength(sample(i/6000,c).state));return lengths.indexOf(Math.min(...lengths))/1000;};
  assert.ok(Math.abs(minimum(configs[2])-minimum(configs[1])-.14)<.002);
});

test("normal to slightly lower to recovery changes both middle arcs and actually restores the baseline",()=>{
  for(let i=0;i<=360;i++){
    const t=i/360,a=sample(t,configs[3]).state,b=sample(t,configs[4]).state;
    assert.deepEqual(a.board,b.board);assert.deepEqual(a.travel,b.travel);assert.deepEqual(a.boots,b.boots);
    if(t<=1/3||t>=2/3)for(const key of Object.keys(a.joints) as (keyof typeof a.joints)[])assert.ok(dist(a.joints[key],b.joints[key])<1e-8,"baseline is restored, not merely relabelled");
  }
  for(const t of [2.5/6,3.5/6]){
    const a=sample(t,configs[3]).state,b=sample(t,configs[4]).state;
    assert.ok(meanLength(a)-meanLength(b)>.035);assert.ok(a.joints.pelvis[1]-b.joints.pelvis[1]>.03,"both working edges show an actual lower pelvis");
  }
});

test("both stances mirror complete joint/equipment states without swapping foot identities",()=>{
  for(const c of configs)for(let i=0;i<=24;i++){
    const a=sample(i/24,c).state,b=sample(i/24,c,"goofy").state;
    for(const key of Object.keys(a.joints) as (keyof typeof a.joints)[])assert.ok(dist([-a.joints[key][0],a.joints[key][1],a.joints[key][2]],b.joints[key])<1e-10);
    assert.equal(a.edge,b.edge);assert.equal(a.boots.front.cuffPitch,b.boots.front.cuffPitch);assert.equal(a.boots.rear.cuffPitch,b.boots.rear.cuffPitch);
  }
});

test("arc boundaries and whole-sequence replay converge in velocity, including adaptation boundaries",()=>{
  const values=(t:number,c:LessonConfig)=>{const s=sample(t,c).state;return [...s.board.position,s.board.yaw,s.board.roll,...Object.values(s.joints).flat(),...s.gaze];};
  for(const c of configs){
    for(const t of [1/6,2/6,3/6,4/6,5/6]){
      const jump=(h:number)=>{const l=values(t-h,c),a=values(t,c),r=values(t+h,c);return Math.max(...a.map((v,i)=>Math.abs((v-l[i])/h-(r[i]-v)/h)));};
      const coarse=jump(1e-4),fine=jump(2.5e-5);assert.ok(fine<coarse*.4+2e-5,`${c.variant} boundary ${t}: ${coarse} -> ${fine}`);
    }
    const jump=(h:number)=>{const l=values(1-h,c),e=values(1,c),s=values(0,c),r=values(h,c);return Math.max(...e.map((v,i)=>Math.abs((v-l[i])/h-(r[i]-s[i])/h)));};
    const coarse=jump(1e-4),fine=jump(2.5e-5);assert.ok(fine<coarse*.4+2e-5,`${c.variant} replay: ${coarse} -> ${fine}`);
  }
});
