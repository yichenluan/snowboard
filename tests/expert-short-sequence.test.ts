import assert from "node:assert/strict";
import {test} from "node:test";
import {BODY,boardToWorld,type Vec3} from "../prototype/motion.ts";
import type {LessonConfig} from "../lesson-player/motion.ts";
import {sampleExpertShortSequenceLesson as sample,supportsExpertShortSequenceLesson as supports,expertShortSequenceVariants,expertShortSequenceDurationMs} from "../lesson-player/expert-short-sequence.ts";

const configs:LessonConfig[]=[
  {type:"expert-short-sequence",task:"expert-run-recovery",variant:"planned-recovery"},
  {type:"expert-short-sequence",task:"expert-steering-range",variant:"guided-slide"},
  {type:"expert-short-sequence",task:"expert-steering-range",variant:"edge-guided"},
];
const sub=(a:Vec3,b:Vec3)=>a.map((v,i)=>v-b[i]) as Vec3;
const dist=(a:Vec3,b:Vec3)=>Math.hypot(...sub(a,b));
const meanLength=(s:ReturnType<typeof sample>["state"])=>["front","rear"].reduce((n,leg)=>n+dist(s.joints[`${leg}Hip` as "frontHip"],s.joints[`${leg}Ankle` as "frontAnkle"]),0)/2;

test("finite expert short tasks expose only implemented choices and an observation clock",()=>{
  for(const c of configs){
    assert.ok(supports(c));
    for(const option of expertShortSequenceVariants(c))assert.ok(supports({...c,variant:option.value}));
    assert.equal(expertShortSequenceDurationMs(c),c.task==="expert-run-recovery"?24000:28000);
    for(const bad of [{type:"expert-short-turns"},{task:"expert-corridor-steering"},{variant:undefined},{fromEdge:"invalid"},{transition:"flex"},{posture:"low"},{turnShape:"closed"}]){
      const config={...c,...bad} as LessonConfig;
      assert.equal(supports(config),false);assert.throws(()=>sample(.4,config));
    }
  }
});

test("whole finite sequences keep fixed bones, boots and board envelope inside their world corridor sections",()=>{
  for(const config of configs)for(const fromEdge of ["toe","heel"] as const)for(const stance of ["regular","goofy"] as const){
    const c={...config,fromEdge},sections=sample(0,c,stance).corridorSections;
    assert.equal(sections.length,3);assert.equal(sections[1].width,2.5);
    assert.equal(sections[0].end,sections[1].start);assert.equal(sections[1].end,sections[2].start);
    for(let i=0;i<=480;i++){
      const f=sample(i/480,c,stance),s=f.state,j=s.joints;
      assert.deepEqual(f.corridorSections,sections,"world references do not follow the rider");assert.equal(f.moving,true);
      assert.ok(f.routeWindow.start<=s.board.position[2]+1e-10&&f.routeWindow.end>=s.board.position[2]-1e-10);
      assert.ok(f.routeWindow.end>f.routeWindow.start,"local route view has a nonzero interval even at the terminal frame");
      for(const leg of ["front","rear"] as const){
        assert.ok(Math.abs(dist(j[`${leg}Hip`],j[`${leg}Knee`])-BODY.thigh)<1e-9);
        assert.ok(Math.abs(dist(j[`${leg}Knee`],j[`${leg}Ankle`])-BODY.shin)<1e-9);
        assert.ok(dist(j[`${leg}Ankle`],boardToWorld([(leg==="front"?1:-1)*BODY.stanceWidth/2,BODY.ankleHeight,0],s.board))<1e-9);
        assert.ok(s.metrics[`${leg}Knee`]>20&&s.metrics[`${leg}Knee`]<75,"authored movement room; not a universal joint limit");
      }
      assert.ok(Math.abs(dist(j.pelvis,j.chest)-BODY.trunk)<1e-9);
      for(const point of Object.values(j))assert.ok(point.every(Number.isFinite));
      for(const x of [-s.board.length/2,s.board.length/2])for(const z of [-s.board.width/2,s.board.width/2]){
        const point=boardToWorld([x,-s.board.thickness/2,z],s.board);
        assert.ok(point[1]>=-1e-9);
        const section=sections.find(section=>point[2]>=section.start&&point[2]<=section.end);
        if(section)assert.ok(Math.abs(point[0])<=section.width/2+1e-8,`${c.variant} ${stance} ${i/480}: ${point} outside ${section.label}`);
      }
    }
  }
});

test("variable-width route tangents and curve-driven edge changes stay physically labelled",()=>{
  const h=1e-6;
  for(const config of configs)for(const fromEdge of ["toe","heel"] as const)for(const stance of ["regular","goofy"] as const)for(let i=1;i<160;i++){
    const c={...config,fromEdge},t=i/160,s=sample(t,c,stance).state;
    const delta=sub(sample(t+h,c,stance).state.board.position,sample(t-h,c,stance).state.board.position);
    const length=Math.hypot(delta[0],delta[2]);
    assert.ok(Math.hypot(delta[0]/length-s.travel[0],delta[2]/length-s.travel[2])<2e-7);
    const regular=sample(t,c).state,heading=Math.atan2(regular.travel[0],regular.travel[2]);
    const slip=regular.board.yaw-(heading-Math.PI/2);
    assert.ok(slip*regular.board.roll<=1e-10,"skidding side and working edge must agree");
    const before=sample(t-h,c).state,after=sample(t+h,c).state;
    const headingChange=Math.atan2(after.travel[0],after.travel[2])-Math.atan2(before.travel[0],before.travel[2]);
    assert.ok(headingChange*regular.board.roll<=1e-10,"edge follows real curvature, not an unchanged base cosine");
  }
});

test("both strategies change actual board/body organisation while retaining the intended route and finite recovery",()=>{
  let yawDifference=0,rollDifference=0,lengthDifference=0;
  for(let i=0;i<=240;i++){
    const a=sample(i/240,configs[1]).state,b=sample(i/240,configs[2]).state;
    assert.ok(Math.hypot(a.board.position[0]-b.board.position[0],a.board.position[2]-b.board.position[2])<1e-10);
    assert.deepEqual(a.travel,b.travel);
    yawDifference=Math.max(yawDifference,Math.abs(a.board.yaw-b.board.yaw));
    rollDifference=Math.max(rollDifference,Math.abs(a.board.roll-b.board.roll));
    lengthDifference=Math.max(lengthDifference,Math.abs(meanLength(a)-meanLength(b)));
  }
  assert.ok(yawDifference>.15&&rollDifference>.1&&lengthDifference>.04,"choices change visible geometry, not only labels");
  for(const c of configs){
    const entry=sample(0,c).state,middle=sample(.5,c).state,recovery=sample(1,c).state;
    assert.ok(Math.abs(entry.board.position[0])>Math.abs(middle.board.position[0])+.6);
    assert.ok(Math.abs(recovery.board.position[0])>Math.abs(middle.board.position[0])+.8);
    assert.ok(recovery.board.position[2]>middle.board.position[2]);
    assert.ok(Math.hypot(...recovery.travel)>.9);
    assert.match(recovery.phaseName,/仍在滑行/);
    assert.equal(sample(1,c).routeWindow.end,sample(1,c).corridorSections.at(-1)!.end);
    assert.ok(Math.abs(entry.board.position[0]-recovery.board.position[0])>.1,"finite endpoints must not be advertised as a seamless loop");
    const regular=sample(.63,c).state,goofy=sample(.63,c,"goofy").state;
    for(const key of Object.keys(regular.joints) as (keyof typeof regular.joints)[])assert.ok(dist(goofy.joints[key],[-regular.joints[key][0],regular.joints[key][1],regular.joints[key][2]])<1e-9);
  }
});

test("all stage entrances name actual edge events and section joins have converging velocity differences",()=>{
  for(const config of configs)for(const fromEdge of ["toe","heel"] as const){
    const c={...config,fromEdge},stages=sample(0,c).stages;
    assert.equal(stages.length,25);
    for(let i=0;i<stages.length;i++){
      const f=sample(stages[i].at,c);assert.equal(f.stage,i);assert.ok(i===0||stages[i].at>stages[i-1].at);
      if(stages[i].title.includes("进入近平板"))assert.equal(f.state.edge,"flat");
      if(stages[i].title.includes("接上前刃"))assert.equal(f.state.edge,"toe");
      if(stages[i].title.includes("接上后刃"))assert.equal(f.state.edge,"heel");
    }
    const vector=(t:number)=>{const s=sample(t,c).state;return [...s.board.position,s.board.yaw,s.board.roll,...Object.values(s.joints).flat(),...s.gaze];};
    for(const t of [.25/8,.125,.25,.375,.5,.625,.75,.875,7.75/8]){
      const difference=(h:number)=>{const a=vector(t-h),b=vector(t),d=vector(t+h);return Math.max(...b.map((v,i)=>Math.abs((v-a[i])/h-(d[i]-v)/h)));};
      const coarse=difference(1e-4),fine=difference(2.5e-5);
      assert.ok(fine<coarse*.45+1e-4,`${c.variant} at ${t}: ${coarse} -> ${fine}`);
    }
  }
});
