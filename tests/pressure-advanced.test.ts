import assert from "node:assert/strict";
import {test} from "node:test";
import {sampleLesson,type LessonConfig} from "../lesson-player/motion.ts";
import type {MotionState,Vec3} from "../prototype/motion.ts";

const distance=(a:Vec3,b:Vec3)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const legLength=(s:MotionState)=>(distance(s.joints.frontHip,s.joints.frontAnkle)+distance(s.joints.rearHip,s.joints.rearAnkle))/2;
const state=(t:number,c:LessonConfig)=>sampleLesson(t,c).state;
const configs:LessonConfig[]=[{type:"pressure-extend",variant:"heel"},{type:"pressure-flex",variant:"toe"},{type:"edge-change-down",variant:"lower-com"},{type:"edge-change-down",variant:"retraction-study"},{type:"pressure-extend",variant:"timing-study"}];

test("same-edge extension and absorption preserve their edge and finish at a supported stationary exit",()=>{
  for(const c of configs.slice(0,2))for(const stance of ["regular","goofy"] as const) {
    const edge=c.variant==="heel"?"heel":"toe",last=sampleLesson(1,c,stance).state;
    for(let i=0;i<=200;i++)assert.equal(sampleLesson(i/200,c,stance).state.edge,edge);
    assert.equal(Math.hypot(...last.travel),0);assert.match(last.phaseName,/已停住/);
    assert.ok(Math.abs(Math.sin(last.board.yaw))<1e-9);
    const normal=[Math.sin(last.board.yaw),0,Math.cos(last.board.yaw)];
    const projection=(last.com[0]-last.contact[0])*normal[0]+(last.com[2]-last.contact[2])*normal[2];
    assert.ok(Math.abs(projection)<1e-8,"stopped COM must be above working edge in board-width projection");
    assert.ok(distance(sampleLesson(.999,c,stance).state.board.position,last.board.position)<1e-7);
  }
  const ext=configs[0],abs=configs[1];
  assert.ok(legLength(state(.48,ext))>legLength(state(.18,ext))+.02);
  assert.ok(legLength(state(.84,ext))<legLength(state(.48,ext))-.02);
  const shortening=legLength(state(.24,abs))-legLength(state(.62,abs));
  assert.ok(shortening>.02,`absorption must visibly shorten the legs: ${shortening} m`);
  let previous=legLength(state(.24,abs));
  for(let i=1;i<=80;i++) {
    const current=legLength(state(.24+.38*i/80,abs));
    assert.ok(current<=previous+1e-10,"absorption must shorten continuously without an extra extension");
    previous=current;
  }
});
test("lowering and retraction shorten through a true edge transition and restore leg room on the new side",()=>{
  for(const variant of ["lower-com","retraction-study"])for(const fromEdge of ["toe","heel"] as const)for(const stance of ["regular","goofy"] as const) {
    const c={type:"edge-change-down",variant,fromEdge},first=sampleLesson(0,c,stance),middle=sampleLesson(.5,c,stance),last=sampleLesson(1,c,stance);
    assert.equal(first.state.edge,fromEdge);assert.equal(middle.state.edge,"flat");assert.equal(last.state.edge,fromEdge==="toe"?"heel":"toe");
    assert.ok(legLength(middle.state)<Math.min(legLength(first.state),legLength(last.state))-.04);
    assert.ok(Math.hypot(...last.state.travel)>.9);assert.doesNotMatch(last.state.phaseName,/停住/);
    const enter=first.stages.find(s=>/通过近平板/.test(s.title))!.at;
    const leave=first.stages.find(s=>/逐渐建立/.test(s.title))!.at;
    assert.equal(sampleLesson(enter-1e-5,c,stance).state.edge,fromEdge);
    assert.equal(sampleLesson(enter+1e-5,c,stance).state.edge,"flat");
    assert.equal(sampleLesson(leave-1e-5,c,stance).state.edge,"flat");
    assert.equal(sampleLesson(leave+1e-5,c,stance).state.edge,last.state.edge);
    assert.ok(first.stages.find(s=>s.title==="新弯中渐进伸腿")!.at>=leave);
    const samples=Array.from({length:201},(_,i)=>sampleLesson(i/200,c,stance).state);
    for(const s of samples)assert.ok(Math.abs(s.contact[1])<1e-9);
    const comRange=Math.max(...samples.map(s=>s.com[1]))-Math.min(...samples.map(s=>s.com[1]));
    if(variant==="lower-com")assert.ok(comRange>.1);
    else {
      assert.ok(comRange>.02&&comRange<.08,"retraction permits natural height variation; torso cannot be frozen");
      const boardRange=Math.max(...samples.map(s=>s.board.position[0]))-Math.min(...samples.map(s=>s.board.position[0]));
      const bodyRange=Math.max(...samples.map(s=>s.com[0]))-Math.min(...samples.map(s=>s.com[0]));
      assert.ok(boardRange>bodyRange*5,"board visibly travels across a steadier body path");
    }
  }
});
test("timing options shift only the same leg-length envelope, retaining identical board motion",()=>{
  for(const fromEdge of ["toe","heel"] as const)for(const stance of ["regular","goofy"] as const) {
    const c={type:"pressure-extend",variant:"timing-study",fromEdge};
    for(let i=0;i<=100;i++) {
      const t=i/100,early=sampleLesson(t,{...c,timing:"early"},stance).state;
      for(const timing of ["baseline","late"] as const) {
        const other=sampleLesson(t,{...c,timing},stance).state;
        assert.deepEqual(other.board,early.board);assert.deepEqual(other.travel,early.travel);
      }
    }
    for(let i=0;i<=100;i++) {
      const u=.46*i/100;
      const values=(["early","baseline","late"] as const).map((timing,k)=>legLength(sampleLesson(.12+.1*k+u,{...c,timing},stance).state));
      assert.ok(Math.max(...values)-Math.min(...values)<1e-8,"same amplitude and duration, only shifted in time");
    }
  }
});
test("new route directions agree with actual path derivatives and phase boundaries have no velocity steps",()=>{
  const h=1e-5;
  for(const c of configs)for(const fromEdge of ["toe","heel"] as const) {
    const config={...c,fromEdge};
    for(let i=1;i<100;i++) {
      const t=i/100,a=state(t-h,config),b=state(t+h,config),s=state(t,config);
      const dx=b.board.position[0]-a.board.position[0],dz=b.board.position[2]-a.board.position[2],n=Math.hypot(dx,dz);
      if(n>1e-12)assert.ok(Math.hypot(dx/n-s.travel[0],dz/n-s.travel[2])<1e-6);
    }
    for(const event of [...sampleLesson(0,config).stages.map(s=>s.at),.5,.72,.8].filter(t=>t>h&&t<1-h)) {
      const a=state(event-h,config),b=state(event,config),c=state(event+h,config);
      for(const key of ["pelvis","chest","frontKnee","rearKnee"] as const) {
        const jump=Math.hypot(...b.joints[key].map((v,k)=>(c.joints[key][k]-2*v+a.joints[key][k])/h));
        assert.ok(jump<.02,`${config.type}/${config.variant} ${key} velocity discontinuity at ${event}`);
      }
    }
  }
});
