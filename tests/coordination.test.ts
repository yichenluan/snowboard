import assert from "node:assert/strict";
import {test} from "node:test";
import {canRenderLesson,sampleLesson,type LessonConfig} from "../lesson-player/motion.ts";
import {meanLegLength} from "../lesson-player/pressure-advanced.ts";
import type {MotionState,Vec3} from "../prototype/motion.ts";

const staticConfigs:LessonConfig[]=[{type:"hip-edge-change",variant:"open",task:"board-coordinate-study"},{type:"hip-edge-change",task:"stationary-hip-rock"}];
const dynamicConfigs:LessonConfig[]=[{type:"hip-edge-change",task:"hip-transition"},{type:"knee-edge-change",task:"coordinated-knee-transition"},{type:"retraction-turns",task:"linked-retraction-skid"}];
const distance=(a:Vec3,b:Vec3)=>Math.hypot(...a.map((v,i)=>v-b[i]));

test("coordination references require an unambiguous task and reject unknown variants",()=>{
  for(const c of [...staticConfigs,...dynamicConfigs])assert.ok(canRenderLesson(c));
  for(const c of [{type:"hip-edge-change"},{type:"hip-edge-change",task:"unknown"},{type:"hip-edge-change",variant:"open",task:"hip-transition"},{type:"knee-edge-change",variant:"unknown",task:"coordinated-knee-transition"},{type:"retraction-turns",task:"unknown"}])assert.equal(canRenderLesson(c),false);
});
test("stationary coordination transfers within flat support before edging and returns after each side",()=>{
  for(const c of staticConfigs)for(const stance of ["regular","goofy"] as const){
    const first=sampleLesson(0,c,stance);
    for(let i=0;i<=400;i++){
      const frame=sampleLesson(i/400,c,stance),s=frame.state;
      assert.equal(frame.moving,false);assert.equal(Math.hypot(...s.travel),0);
      assert.ok(Math.abs(s.board.position[0])<1e-12&&Math.abs(s.board.position[2])<.002,"no sliding route in a stationary lesson");
      assert.ok(Math.abs(s.contact[1])<1e-10);
      if(Math.abs(s.board.roll)>1e-8)assert.ok(Math.abs(s.com[2]-s.contact[2])<1e-8,"COM projection remains over the grounded edge");
      else assert.ok(Math.abs(s.com[2])<=s.board.width/2+1e-8,"flat board supports the transfer");
    }
    for(const t of [.5,1]){
      const s=sampleLesson(t,c,stance).state;assert.equal(s.edge,"flat");
      for(const key of Object.keys(s.joints) as (keyof typeof s.joints)[])assert.ok(distance(first.state.joints[key],s.joints[key])<1e-9,"both episodes recover the same neutral stance");
    }
  }
});
test("hip and knee attention tasks retain different extension and flexion transitions in both directions",()=>{
  for(const c of dynamicConfigs.slice(0,2))for(const fromEdge of ["toe","heel"] as const){
    const config={...c,fromEdge},first=sampleLesson(0,config).state,middle=sampleLesson(.5,config).state,last=sampleLesson(1,config).state;
    assert.equal(first.edge,fromEdge);assert.equal(middle.edge,"flat");assert.equal(last.edge,fromEdge==="toe"?"heel":"toe");
    if(c.task==="hip-transition")assert.ok(meanLegLength(middle)>Math.max(meanLegLength(first),meanLegLength(last))+.02);
    else assert.ok(meanLegLength(middle)<Math.min(meanLegLength(first),meanLegLength(last))-.03);
    assert.ok(Math.hypot(...last.travel)>.99);
    const stages=sampleLesson(0,config).stages;
    assert.ok(stages.find(s=>s.at===.53)!.at>=stages.find(s=>s.title.startsWith("渐进建立"))!.at);
  }
});
test("linked retraction recovers leg length twice and joins continuously with real sliding and moving shoulders",()=>{
  for(const fromEdge of ["toe","heel"] as const)for(const stance of ["regular","goofy"] as const){
    const config={...dynamicConfigs[2],fromEdge},sample=(t:number)=>sampleLesson(t,config,stance).state;
    const points=[0,.25,.5,.75,1].map(sample);
    for(const i of [1,3])assert.ok(meanLegLength(points[i])<Math.min(meanLegLength(points[i-1]),meanLegLength(points[i+1]))-.03);
    assert.ok(sample(.1).metrics.skidAngle>1);assert.ok(sample(.6).metrics.skidAngle>1);
    const shoulder=(t:number)=>{const s=sample(t);return Math.atan2(s.joints.frontShoulder[2]-s.joints.rearShoulder[2],s.joints.frontShoulder[0]-s.joints.rearShoulder[0]);};
    assert.ok(Math.abs(shoulder(.25)-shoulder(.75))>.05,"shoulders are not locked in world space");
    for(const key of Object.keys(points[0].joints) as (keyof MotionState["joints"])[]){
      const last=points[4].joints[key].map((v,i)=>v-(i===2?6.4:0)) as Vec3;
      assert.ok(distance(points[0].joints[key],last)<1e-8);
      const h=1e-5,a=sample(.5-h).joints[key],b=sample(.5).joints[key],c=sample(.5+h).joints[key];
      assert.ok(Math.hypot(...b.map((v,i)=>(c[i]-2*v+a[i])/h))<.02,"two halves join without a velocity step");
    }
  }
});
