import assert from "node:assert/strict";
import {test} from "node:test";
import {BODY,boardToWorld,type MotionState,type Vec3} from "../prototype/motion.ts";
import {rideLeadingAxis,sampleSwitchLesson,supportsSwitchLesson} from "../lesson-player/switch.ts";
const c={type:"switch",task:"switch-linked-skid"},distance=(a:Vec3,b:Vec3)=>Math.hypot(...a.map((v,i)=>v-b[i]));
test("switch task keeps hardware and foot identities while the original rear foot leads",()=>{
  assert.equal(supportsSwitchLesson({type:"switch"}),false);
  for(const stance of ["regular","goofy"] as const)for(let i=0;i<=500;i++){
    const f=sampleSwitchLesson(i/500,c,stance),s=f.state,axis=rideLeadingAxis(s,1);
    assert.equal(f.rideDirection,-1);
    assert.ok(axis[0]*s.travel[0]+axis[2]*s.travel[2]<-.98,"hardware nose points against travel throughout");
    assert.ok(s.metrics.skidAngle<=8.000001,"slide angle uses the riding front end, not hardware nose");
    const displacement=s.boots.rear.position.map((v,k)=>v-s.boots.front.position[k]);
    assert.ok(displacement[0]*s.travel[0]+displacement[2]*s.travel[2]>.5,"original rear foot remains the leading foot");
    for(const which of ["front","rear"] as const){
      const sign=which==="front"?1:-1;
      assert.equal(s.boots[which].localPosition[0],sign*BODY.stanceWidth/2);
      assert.ok(distance(s.boots[which].position,boardToWorld(s.boots[which].localPosition,s.board))<1e-9);
      const hip=s.joints[which+"Hip" as keyof MotionState["joints"]],knee=s.joints[which+"Knee" as keyof MotionState["joints"]],ankle=s.joints[which+"Ankle" as keyof MotionState["joints"]];
      assert.ok(Math.abs(distance(hip,knee)-BODY.thigh)<1e-9);
      assert.ok(Math.abs(distance(knee,ankle)-BODY.shin)<1e-9);
    }
    assert.ok(s.gaze[0]*s.travel[0]+s.gaze[2]*s.travel[2]>.999999,"gaze actually follows the new route");
  }
});
test("switch uses both anatomical edges, mirrors stances and joins the next period continuously",()=>{
  const first=sampleSwitchLesson(0,c).state,last=sampleSwitchLesson(1,c).state;
  for(const [t,edge] of [[0,"heel"],[.25,"flat"],[.5,"toe"],[.75,"flat"],[1,"heel"]] as const)assert.equal(sampleSwitchLesson(t,c).state.edge,edge);
  for(let i=0;i<=100;i++){
    const regular=sampleSwitchLesson(i/100,c).state,goofy=sampleSwitchLesson(i/100,c,"goofy").state;
    for(const key of Object.keys(regular.joints) as (keyof MotionState["joints"])[]){
      const p=regular.joints[key];assert.ok(distance([-p[0],p[1],p[2]],goofy.joints[key])<1e-9);
    }
  }
  for(const key of Object.keys(first.joints) as (keyof MotionState["joints"])[])assert.ok(distance(first.joints[key],[last.joints[key][0],last.joints[key][1],last.joints[key][2]-14])<1e-9);
});
test("switch flat crossings do not introduce vertical or joint velocity steps",()=>{
  const h=1e-5;
  for(const stance of ["regular","goofy"] as const)for(const t of [.25,.75]){
    const a=sampleSwitchLesson(t-h,c,stance).state,b=sampleSwitchLesson(t,c,stance).state,z=sampleSwitchLesson(t+h,c,stance).state;
    for(const key of Object.keys(b.joints) as (keyof MotionState["joints"])[])assert.ok(Math.hypot(...b.joints[key].map((v,i)=>(z.joints[key][i]-2*v+a.joints[key][i])/h))<.001);
    assert.ok(Math.abs((z.board.position[1]-2*b.board.position[1]+a.board.position[1])/h)<.001);
  }
});
