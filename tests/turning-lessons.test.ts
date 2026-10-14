import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { boardVectorToWorld, type Vec3 } from "../prototype/motion.ts";
import { sampleLesson, type LessonConfig } from "../lesson-player/motion.ts";

const content=JSON.parse(readFileSync(new URL("../content.json",import.meta.url),"utf8"));
const types=["steering","rail-track","garland","j-turn","gaze-control"];
const refs:LessonConfig[]=content.lessons.flatMap((l:{demos?:LessonConfig[];demo?:LessonConfig})=>l.demos?.length?l.demos:l.demo?[l.demo]:[]).filter((c:LessonConfig)=>types.includes(c.type));
const sub=(a:Vec3,b:Vec3):Vec3=>a.map((v,i)=>v-b[i]) as Vec3;
const dot=(a:Vec3,b:Vec3)=>a.reduce((n,v,i)=>n+v*b[i],0);
const unit=(a:Vec3):Vec3=>a.map(v=>v/Math.hypot(...a)) as Vec3;
const dist=(a:Vec3,b:Vec3)=>Math.hypot(...sub(a,b));

test("turning references retain a route-derived direction and keep the working edge clear of the slip direction",()=>{
  assert.equal(refs.length,16);
  for(const c of refs)for(const stance of ["regular","goofy"] as const)for(let i=1;i<200;i++) {
    const t=i/200,h=.001,s=sampleLesson(t,c,stance).state;
    const delta=sub(sampleLesson(t+h,c,stance).state.board.position,sampleLesson(t-h,c,stance).state.board.position);
    delta[1]=0;
    assert.ok(dot(unit(delta),s.travel)>.9999,`${c.type}: arrow and path must agree`);
    // Mirror swaps board roll as well as local z. Always use the output frame.
    const toe=boardVectorToWorld([0,0,1],s.board);
    assert.ok(Math.sign(s.board.roll)*dot(s.travel,toe)<1e-8,`${c.type}: working edge must not lead sideways motion`);
  }
});

test("paired sliding and reduced-pivot examples share route, phase and edge angle but preserve their distinct board heading",()=>{
  for(const stance of ["regular","goofy"] as const)for(let i=0;i<=100;i++) {
    const a=sampleLesson(i/100,{type:"steering",path:"rail"},stance),b=sampleLesson(i/100,{type:"rail-track",path:"rail"},stance);
    assert.deepEqual(a.state.board.position,b.state.board.position);
    assert.deepEqual(a.state.travel,b.state.travel);
    assert.equal(a.stage,b.stage);assert.equal(a.state.edge,b.state.edge);
    if(i===25||i===75)assert.ok(a.state.metrics.skidAngle>b.state.metrics.skidAngle+9);
  }
});

test("open and closed turns really change exit direction and required width",()=>{
  const open={type:"steering",turnShape:"open"} as const,closed={type:"steering",turnShape:"closed"} as const;
  const width=(c:LessonConfig)=>{const xs=Array.from({length:101},(_,i)=>sampleLesson(i/100,c).state.board.position[0]);return Math.max(...xs)-Math.min(...xs);};
  assert.ok(width(closed)>width(open)*2);
  assert.ok(sampleLesson(.5,closed).state.travel[2]<.2);
  assert.ok(sampleLesson(.5,open).state.travel[2]>.8);
});

test("garlands keep one edge and one traverse direction while descending through two separate half-turns",()=>{
  for(const variant of ["toe","heel"])for(const stance of ["regular","goofy"] as const) {
    const c={type:"garland",variant},initial=sampleLesson(0,c,stance).state;
    for(let i=1;i<=100;i++) {
      const s=sampleLesson(i/100,c,stance).state;
      assert.equal(s.edge,variant);assert.equal(Math.sign(s.travel[0]),Math.sign(initial.travel[0]));
      assert.ok(s.board.position[2]>0);assert.ok(s.travel[2]>0);
    }
    assert.ok(sampleLesson(.25,c).state.metrics.edgeAngle<sampleLesson(0,c).state.metrics.edgeAngle-7);
  }
});

test("single arcs and the planned rail exit slow to a held across-slope endpoint, with different pivot intent",()=>{
  for(const c of refs.filter(c=>c.type==="j-turn"||c.task==="rails-then-stop")) {
    const end=sampleLesson(1,c).state,late=sampleLesson(.99,c).state,earlier=sampleLesson(.98,c).state;
    assert.equal(Math.hypot(...end.travel),0);assert.ok(end.metrics.edgeAngle>10);
    assert.ok(Math.abs(Math.sin(end.board.yaw))<1e-9);
    assert.match(end.phaseName,/停住/);
    assert.ok(dist(end.board.position,late.board.position)<dist(late.board.position,earlier.board.position));
  }
  assert.ok(sampleLesson(.5,{type:"j-turn",skid:true}).state.metrics.skidAngle>sampleLesson(.5,{type:"j-turn"}).state.metrics.skidAngle+8);
  assert.equal(sampleLesson(.05,{type:"j-turn"}).state.edge,"flat","keep the short straight entrance");
});

test("observation includes a finite uphill scan and returns forward without changing the traverse",()=>{
  const c={type:"gaze-control"},first=sampleLesson(0,c).state,scan=sampleLesson(.425,c).state,end=sampleLesson(1,c).state;
  assert.ok(scan.gaze[2]<0,"the scan must actually reach uphill");
  assert.ok(dist(first.gaze,scan.gaze)>.5);assert.ok(dist(first.gaze,end.gaze)<1e-9);
  for(let i=0;i<=100;i++) {
    const s=sampleLesson(i/100,c).state;
    assert.equal(s.board.yaw,first.board.yaw);assert.equal(s.board.roll,first.board.roll);
    assert.deepEqual(s.travel,first.travel);
  }
});

test("planned rail exit joins turn and edging rates without a pose-speed step",()=>{
  const c={type:"rail-track",task:"rails-then-stop"},t=.72,h=1e-5;
  const before=sampleLesson(t-h,c).state,join=sampleLesson(t,c).state,after=sampleLesson(t+h,c).state;
  for(const key of ["yaw","roll"] as const) {
    const left=(join.board[key]-before.board[key])/h,right=(after.board[key]-join.board[key])/h;
    assert.ok(Math.abs(left-right)<.005,`${key} must not stop rotating at the segment join`);
  }
  assert.match(sampleLesson(.6,{type:"steering"}).state.phaseName,/后刃/);
});
