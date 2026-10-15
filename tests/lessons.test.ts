import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { BODY, boardToWorld, type Vec3 } from "../prototype/motion.ts";
import { canRenderLesson, sampleLesson, type LessonConfig } from "../lesson-player/motion.ts";
import { supportsShortTurnLesson, shortTurnDurationMs } from "../lesson-player/short-turns.ts";

const content=JSON.parse(readFileSync(new URL("../content.json",import.meta.url),"utf8"));
const refs:LessonConfig[]=content.lessons.flatMap((l:{demos?:LessonConfig[];demo?:LessonConfig})=>l.demos?.length?l.demos:l.demo?[l.demo]:[]).filter(canRenderLesson);
const distance=(a:Vec3,b:Vec3)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const dot=(a:Vec3,b:Vec3)=>a.reduce((sum,v,i)=>sum+v*b[i],0);
const subtract=(a:Vec3,b:Vec3):Vec3=>a.map((v,i)=>v-b[i]) as Vec3;

test("every migrated course preserves feet, both legs and finite equipment movement throughout its own task",()=>{
  assert.equal(refs.length,111,"review added/removed references explicitly");
  for(const config of refs) for(const stance of ["regular","goofy"] as const) {
    let before:ReturnType<typeof sampleLesson>|undefined;
    // The short-turn route can turn continuously faster than foundation drills.
    // Check its frame displacement at 60 fps; this is a rendering regression
    // guard, not a physiological speed limit or proof of C1 continuity. The
    // soft-limit seams have separate one-sided derivative tests.
    const shortTurn=supportsShortTurnLesson(config);
    const duration=shortTurn?shortTurnDurationMs(config):(config.duration??10000);
    const samples=Math.max(200,Math.ceil(duration/(shortTurn?1000/60:50)));
    for(let i=0;i<=samples;i++) {
      const frame=sampleLesson(i/samples,config,stance),s=frame.state,j=s.joints;
      for(const leg of ["front","rear"] as const) {
        assert.ok(Math.abs(distance(j[`${leg}Hip`],j[`${leg}Knee`])-BODY.thigh)<1e-9);
        assert.ok(Math.abs(distance(j[`${leg}Knee`],j[`${leg}Ankle`])-BODY.shin)<1e-9);
        const ankle=boardToWorld([BODY.stanceWidth/2*(leg==="front"?1:-1),BODY.ankleHeight,0],s.board);
        assert.ok(distance(ankle,j[`${leg}Ankle`])<1e-9);
        const shin=subtract(j[`${leg}Knee`],j[`${leg}Ankle`]),boot=s.boots[leg];
        const pitch=Math.atan2(dot(shin,boot.toeDirection),dot(shin,boot.up))*180/Math.PI;
        assert.ok(pitch>=12-1e-8&&pitch<=20+1e-8,"authored cuff must not pass through highback or fold without limit");
        assert.ok(s.metrics[`${leg}Knee`]>15&&s.metrics[`${leg}Knee`]<80,"neither locked knees nor deep crouch in these foundation tasks");
      }
      assert.ok(Math.abs(distance(j.pelvis,j.chest)-BODY.trunk)<1e-9);
      if(before) {
        const shift=subtract(s.board.position,before.state.board.position);
        for(const key of Object.keys(j) as (keyof typeof j)[]) assert.ok(distance(subtract(j[key],shift),before.state.joints[key])<.08,`continuous pose ${config.type} ${key}`);
        assert.ok(distance(s.gaze,before.state.gaze)<.08,`head direction ${config.type}/${config.variant??"default"} ${stance} at ${i/samples}`);
      }
      before=frame;
    }
  }
});

test("stationary drills stay still; a single-turn stop ends across the slope on its working edge",()=>{
  for(const config of refs) {
    const first=sampleLesson(0,config),last=sampleLesson(1,config);
    if(["static-edge","stationary"].includes(first.task)) {
      for(const t of [.25,.5,.75,1]) {
        const s=sampleLesson(t,config).state;
        assert.equal(s.board.position[0],0);assert.equal(s.board.position[2],0);
        assert.equal(Math.hypot(...s.travel),0);
      }
    }
    if(first.task==="single-turn-stop") {
      assert.equal(last.state.edge,"heel");
      assert.ok(Math.abs(Math.sin(last.state.board.yaw))<1e-8,"nose must end across the slope");
      assert.equal(Math.hypot(...last.state.travel),0);
      assert.match(last.state.phaseName,/停住/);
      assert.ok(last.state.metrics.edgeAngle>5,"do not release to flat after stopping");
    }
  }
});

test("reference projections and both stance directions use the same state",()=>{
  for(const config of refs) for(const t of [0,.2,.5,.8,1]) {
    const a=sampleLesson(t,config,"regular").state,b=sampleLesson(t,config,"goofy").state;
    for(const key of Object.keys(a.joints) as (keyof typeof a.joints)[]) {
      assert.ok(distance([-a.joints[key][0],a.joints[key][1],a.joints[key][2]],b.joints[key])<1e-9);
    }
    assert.equal(a.phaseName,b.phaseName);assert.equal(a.edge,b.edge);
  }
});

test("stationary edge awareness has reachable fixed hands on its support rail",()=>{
  for(const config of refs.filter(c=>c.task==="static-edge")) for(const stance of ["regular","goofy"] as const) for(let i=0;i<=100;i++) {
    const f=sampleLesson(i/100,config,stance),j=f.state.joints;
    assert.ok(f.supportRail);
    for(const leg of ["front","rear"] as const) {
      const hand=j[`${leg}Hand`],elbow=j[`${leg}Elbow`],shoulder=j[`${leg}Shoulder`];
      assert.equal(hand[1],f.supportRail[0][1]);assert.equal(hand[2],f.supportRail[0][2]);
      assert.ok(Math.abs(hand[0])<.9);
      assert.ok(Math.abs(distance(shoulder,elbow)-BODY.upperArm)<1e-9,"support must not stretch the upper arm");
      assert.ok(Math.abs(distance(elbow,hand)-BODY.forearm)<1e-9,"support must stay reachable");
    }
  }
});

test("fore-aft range moves pelvis and chest together without moving the bindings",()=>{
  const config={type:"fore-aft",task:"stationary"};
  const middle=sampleLesson(0,config).state,front=sampleLesson(.25,config).state,rear=sampleLesson(.75,config).state;
  for(const key of ["pelvis","chest"] as const) {
    assert.ok(front.joints[key][0]>middle.joints[key][0]+.03);
    assert.ok(rear.joints[key][0]<middle.joints[key][0]-.03);
  }
  assert.deepEqual(middle.joints.frontAnkle,front.joints.frontAnkle);
  assert.deepEqual(middle.joints.rearAnkle,rear.joints.rearAnkle);
});

test("inclination comparison holds board angle and route constant while torso organisation changes",()=>{
  for(const t of [.2,.5,.8]) {
    const a=sampleLesson(t,{type:"inclination",variant:"inclination-focused"}).state;
    const b=sampleLesson(t,{type:"inclination",variant:"angulation-focused"}).state;
    assert.deepEqual(a.board,b.board);
    assert.ok(distance(a.joints.chest,b.joints.chest)>.015);
  }
});
