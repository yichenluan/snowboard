import assert from "node:assert/strict";
import {test} from "node:test";
import {BODY,boardToWorld,type Vec3} from "../prototype/motion.ts";
import {canRenderLesson,sampleLesson,type LessonConfig} from "../lesson-player/motion.ts";
import {expertShortCorridor,expertShortDurationMs,expertShortVariants} from "../lesson-player/expert-short-turns.ts";

const configs:LessonConfig[]=[
  {type:"expert-short-turns",task:"expert-corridor-steering",variant:"progressive"},
  {type:"expert-short-turns",task:"expert-corridor-steering",variant:"late-steer"},
  {type:"expert-short-turns",task:"expert-load-release",variant:"continuous"},
  {type:"expert-short-turns",task:"expert-load-release",variant:"held-release"},
];
const subtract=(a:Vec3,b:Vec3)=>a.map((v,i)=>v-b[i]) as Vec3;
const dist=(a:Vec3,b:Vec3)=>Math.hypot(...subtract(a,b));
const meanLength=(s:ReturnType<typeof sampleLesson>["state"])=>["front","rear"].reduce((sum,leg)=>sum+dist(s.joints[`${leg}Hip` as "frontHip"],s.joints[`${leg}Ankle` as "frontAnkle"]),0)/2;

test("expert tasks are explicit independent configurations with only compatible reversible comparisons",()=>{
  for(const c of configs){
    assert.ok(canRenderLesson(c));
    for(const option of expertShortVariants(c))assert.ok(canRenderLesson({...c,variant:option.value}));
    assert.equal(expertShortDurationMs(c),16000);
    for(const bad of [{task:"round-linked-skid"},{variant:"round"},{transition:"flex"},{turnShape:"closed"},{posture:"low"},{fromEdge:"unknown"}]){
      assert.equal(canRenderLesson({...c,...bad} as LessonConfig),false);
      assert.throws(()=>sampleLesson(.5,{...c,...bad} as LessonConfig));
    }
  }
  assert.equal(canRenderLesson({type:"expert-short-turns",task:"expert-corridor-steering"}),false);
});

test("expert full cycles preserve both boot connections, fixed bones, board contact and the visible corridor",()=>{
  for(const config of configs)for(const fromEdge of ["toe","heel"] as const)for(const stance of ["regular","goofy"] as const){
    let previous:ReturnType<typeof sampleLesson>["state"]|undefined;
    const n=960,c={...config,fromEdge};
    for(let i=0;i<=n;i++){
      const f=sampleLesson(i/n,c,stance),s=f.state,j=s.joints;
      assert.equal(f.moving,true);assert.deepEqual(f.corridor,expertShortCorridor);
      for(const leg of ["front","rear"] as const){
        assert.ok(Math.abs(dist(j[`${leg}Hip`],j[`${leg}Knee`])-BODY.thigh)<1e-9);
        assert.ok(Math.abs(dist(j[`${leg}Knee`],j[`${leg}Ankle`])-BODY.shin)<1e-9);
        assert.ok(dist(j[`${leg}Ankle`],boardToWorld([(leg==="front"?1:-1)*BODY.stanceWidth/2,BODY.ankleHeight,0],s.board))<1e-9);
        assert.ok(s.metrics[`${leg}Knee`]>15&&s.metrics[`${leg}Knee`]<80,"authored pose retains movement room; not a medical limit");
      }
      assert.ok(Math.abs(dist(j.pelvis,j.chest)-BODY.trunk)<1e-9);
      for(const point of Object.values(j))assert.ok(point.every(Number.isFinite));
      for(const x of [-s.board.length/2,s.board.length/2])for(const z of [-s.board.width/2,s.board.width/2]){
        const p=boardToWorld([x,-s.board.thickness/2,z],s.board);
        assert.ok(Math.abs(p[0])<=expertShortCorridor.width/2+1e-8,`${c.variant} board envelope inside corridor at ${i/n}: ${p[0]}`);
        assert.ok(p[1]>=-1e-9,"rigid board does not tunnel below the snow");
      }
      if(previous){
        const shift=subtract(s.board.position,previous.board.position);
        for(const k of Object.keys(j) as (keyof typeof j)[])assert.ok(dist(subtract(j[k],shift),previous.joints[k])<.08,`${c.variant} ${k} continuity`);
        assert.ok(dist(s.gaze,previous.gaze)<.08);
      }
      previous=s;
    }
  }
});

test("expert route tangent, board slip and working edge remain coherent throughout both directions",()=>{
  const h=1e-6;
  for(const config of configs)for(const fromEdge of ["toe","heel"] as const)for(const stance of ["regular","goofy"] as const)for(let i=1;i<200;i++){
    const t=i/200,c={...config,fromEdge},s=sampleLesson(t,c,stance).state;
    const d=subtract(sampleLesson(t+h,c,stance).state.board.position,sampleLesson(t-h,c,stance).state.board.position);
    const length=Math.hypot(d[0],d[2]);
    assert.ok(Math.hypot(d[0]/length-s.travel[0],d[2]/length-s.travel[2])<1e-7);
    const regular=sampleLesson(t,c).state;
    const heading=Math.atan2(regular.travel[0],regular.travel[2]),slip=regular.board.yaw-(heading-Math.PI/2);
    assert.ok(slip*regular.board.roll<=1e-10,"working edge is compatible with lateral slip");
  }
});

test("the preparation comparison holds board and cuff state fixed while shifting actual leg-length timing",()=>{
  const a=configs[2],b=configs[3];let separation=0;
  for(let i=0;i<=200;i++){
    const x=sampleLesson(i/200,a).state,y=sampleLesson(i/200,b).state;
    assert.deepEqual(x.board,y.board);assert.deepEqual(x.travel,y.travel);assert.equal(x.edge,y.edge);
    assert.deepEqual(x.joints.frontKnee,y.joints.frontKnee);assert.deepEqual(x.joints.rearKnee,y.joints.rearKnee);
    separation=Math.max(separation,Math.abs(meanLength(x)-meanLength(y)));
  }
  assert.ok(separation>.02,"comparison changes actual lengths rather than captions");
  const lengths=(c:LessonConfig)=>Array.from({length:251},(_,i)=>meanLength(sampleLesson(i/1000,c).state));
  const x=lengths(a),y=lengths(b),min=(v:number[])=>v.indexOf(Math.min(...v))/1000;
  assert.ok(min(y)-min(x)>.035&&min(y)-min(x)<.045);
});

test("spatial steering changes path and its direction within the same corridor rather than only speeding old turns",()=>{
  let pathDifference=0,headingDifference=0;
  for(let i=0;i<=100;i++){
    const a=sampleLesson(i/100,configs[0]).state,b=sampleLesson(i/100,configs[1]).state;
    pathDifference=Math.max(pathDifference,Math.abs(a.board.position[0]-b.board.position[0]));
    headingDifference=Math.max(headingDifference,Math.abs(a.board.yaw-b.board.yaw));
    assert.equal(a.board.position[2],b.board.position[2]);
  }
  assert.ok(pathDifference>.3);assert.ok(headingDifference>.3);
  const old=sampleLesson(.125,{type:"short-turns",variant:"round",task:"round-linked-skid"}).state;
  const expert=sampleLesson(.125,configs[0]).state;
  assert.notDeepEqual(expert.board,old.board);
});

test("expert stage buttons identify actual edge events, both side organisations, and a moving end state",()=>{
  for(const c0 of configs)for(const fromEdge of ["toe","heel"] as const){
    const c={...c0,fromEdge},stages=sampleLesson(0,c).stages;
    assert.equal(stages.length,21);
    for(let i=0;i<stages.length;i++){
      const stage=stages[i],f=sampleLesson(stage.at,c);
      assert.equal(f.stage,i);assert.ok(i===0||stage.at>stages[i-1].at);
      if(stage.title==="实际进入近平板")assert.equal(f.state.edge,"flat");
      if(stage.title==="连续接上前刃")assert.equal(f.state.edge,"toe");
      if(stage.title==="连续接上后刃")assert.equal(f.state.edge,"heel");
    }
    const start=sampleLesson(0,c).state,end=sampleLesson(1,c).state,delta=subtract(end.board.position,start.board.position);
    assert.equal(end.edge,fromEdge);assert.ok(Math.hypot(...end.travel)>.9);
    for(const k of Object.keys(start.joints) as (keyof typeof start.joints)[])assert.ok(dist(subtract(end.joints[k],delta),start.joints[k])<1e-8);
    const toe=sampleLesson(.0,{...c,fromEdge:"toe"}).state,heel=sampleLesson(.0,{...c,fromEdge:"heel"}).state;
    assert.notEqual(toe.metrics.frontKnee,heel.metrics.frontKnee,"toe/heel are separately organised, not a mirrored torso pose");
  }
});

test("expert seam velocity differences converge rather than hiding a jump with coarse frames",()=>{
  const value=(t:number,c:LessonConfig)=>{
    const s=sampleLesson(t,c).state,j=s.joints;
    return [...s.board.position,s.board.yaw,s.board.roll,...Object.values(j).flat(),...s.gaze];
  };
  for(const c of configs)for(const t of [.25,.5,.75]){
    const difference=(h:number)=>{
      const left=value(t-h,c),at=value(t,c),right=value(t+h,c);
      return Math.max(...at.map((v,i)=>Math.abs((v-left[i])/h-(right[i]-v)/h)));
    };
    const coarse=difference(1e-4),fine=difference(2.5e-5);
    assert.ok(fine<coarse*.4+1e-5,`${c.variant} seam ${t}: ${coarse} -> ${fine}`);
  }
  for(const c of configs){
    const difference=(h:number)=>{
      const left=value(1-h,c),end=value(1,c),start=value(0,c),right=value(h,c);
      return Math.max(...end.map((v,i)=>Math.abs((v-left[i])/h-(right[i]-start[i])/h)));
    };
    const coarse=difference(1e-4),fine=difference(2.5e-5);
    assert.ok(fine<coarse*.4+1e-5,`${c.variant} loop velocity: ${coarse} -> ${fine}`);
  }
});
