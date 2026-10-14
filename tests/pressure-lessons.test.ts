import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { BODY, type Vec3 } from "../prototype/motion.ts";
import { canRenderLesson, sampleLesson, type LessonConfig } from "../lesson-player/motion.ts";

const content=JSON.parse(readFileSync(new URL("../content.json",import.meta.url),"utf8"));
const refs:LessonConfig[]=content.lessons.flatMap((l:{demos?:LessonConfig[];demo?:LessonConfig})=>l.demos?.length?l.demos:l.demo?[l.demo]:[]).filter((c:LessonConfig)=>/^(pressure-|edge-change-)/.test(c.type));
const distance=(a:Vec3,b:Vec3)=>Math.hypot(...a.map((v,i)=>v-b[i]));

test("pressure migration covers all fifteen references but rejects unknown variants",()=>{
  assert.equal(refs.length,15);
  assert.equal(refs.filter(canRenderLesson).length,15);
  for(const type of ["pressure-flex","pressure-extend","edge-change-down"]) {
    assert.equal(canRenderLesson({type}),false);
    assert.throws(()=>sampleLesson(.5,{type,variant:"unknown"}),/尚未实现/);
  }
});

test("flat-ground phase studies retain a stationary support and keep estimated COM within it",()=>{
  for(const c of refs.filter(c=>c.variant==="phase-study"))for(const stance of ["regular","goofy"] as const) {
    const start=sampleLesson(0,c,stance).state;
    for(let i=0;i<=200;i++) {
      const f=sampleLesson(i/200,c,stance),s=f.state;
      assert.equal(f.task,"pressure-phase-study");assert.equal(f.moving,false);
      assert.deepEqual(s.board,start.board);assert.equal(Math.hypot(...s.travel),0);
      assert.deepEqual(s.joints.frontAnkle,start.joints.frontAnkle);assert.deepEqual(s.joints.rearAnkle,start.joints.rearAnkle);
      assert.ok(Math.abs(s.com[0])<BODY.stanceWidth/2);
      assert.ok(Math.abs(s.com[2])<s.board.width/2);
      assert.equal(s.metrics.skidAngle,0);
    }
    assert.ok(distance(sampleLesson(1,c,stance).state.com,start.com)<1e-9);
  }
});

test("acceleration stage labels follow actual COM motion and the hold is really constant",()=>{
  for(const type of ["pressure-flex","pressure-extend"]) {
    const c={type,variant:"phase-study"},frame=sampleLesson(0,c),event=frame.stages[1].at,end=frame.stages[2].at;
    const height=(t:number)=>sampleLesson(t,c).state.com[1],h=1e-4;
    const acceleration=(t:number)=>(height(t+h)-2*height(t)+height(t-h))/(h*h);
    const sign=type==="pressure-extend"?1:-1;
    assert.ok(acceleration(event-.02)*sign>0,"still speeding up before event");
    assert.ok(acceleration(event+.02)*sign<0,"slowing down after event");
    assert.ok((height(event+h)-height(event-h))*sign>0,"motion direction must not reverse at speed peak");
    assert.ok(Math.abs(height(end)-height(.6))<1e-10);
    assert.ok(Math.abs(height(end)-height(0))>.05,"height change must be observable");
  }
});

test("both transition directions expose the actual old-edge, flat, new-edge events and remain in motion",()=>{
  for(const fromEdge of ["toe","heel"] as const)for(const stance of ["regular","goofy"] as const) {
    const c={type:"edge-change-up",fromEdge},first=sampleLesson(0,c,stance),to=fromEdge==="toe"?"heel":"toe";
    const enter=first.stages[1].at,leave=first.stages[2].at;
    assert.equal(first.state.edge,fromEdge);
    assert.equal(sampleLesson(enter-1e-5,c,stance).state.edge,fromEdge);
    assert.equal(sampleLesson(enter+1e-5,c,stance).state.edge,"flat");
    assert.equal(sampleLesson(leave-1e-5,c,stance).state.edge,"flat");
    assert.equal(sampleLesson(leave+1e-5,c,stance).state.edge,to);
    assert.match(sampleLesson(.5,c,stance).state.phaseName,/平板/);
    const last=sampleLesson(1,c,stance).state;
    assert.equal(last.edge,to);assert.ok(Math.hypot(...last.travel)>.9);
    assert.doesNotMatch(last.phaseName,/停住/);
    for(let i=0;i<=200;i++)assert.ok(Math.abs(sampleLesson(i/200,c,stance).state.contact[1])<1e-9);
  }
});
