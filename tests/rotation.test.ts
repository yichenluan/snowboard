import test from "node:test";
import assert from "node:assert/strict";
import { BODY, boardToWorld, type MotionState, type Vec3 } from "../prototype/motion";
import { isRotationLesson, sampleRotationLesson as sample, type RotationConfig } from "../lesson-player/rotation";

const distance=(a:Vec3,b:Vec3)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const wrap=(a:number)=>Math.atan2(Math.sin(a),Math.cos(a));
const heading=(s:MotionState,part:"hip"|"shoulder")=>{
  const [a,b]=part==="hip"?[s.joints.frontHip,s.joints.rearHip]:[s.joints.frontShoulder,s.joints.rearShoulder];
  return Math.atan2(-(a[2]-b[2]),a[0]-b[0]);
};
const local=(s:MotionState,key:keyof MotionState["joints"])=>s.joints[key].map((v,i)=>v-s.board.position[i]) as Vec3;
const configurations:RotationConfig[]=[
  {type:"shoulder-coordination",task:"arms-traverse-stop"},
  {type:"shoulder-coordination",task:"arms-traverse-stop",edgeSide:"heel"},
  {type:"shoulder-coordination",task:"arms-linked-feedback"},
  {type:"shoulder-coordination",variant:"neutral"},
  {type:"shoulder-coordination",variant:"open-heel"},
  {type:"shoulder-coordination",variant:"closed-toe"},
  {type:"shoulder-coordination",variant:"closed-toe",rotationComparison:"slightly-open"},
  {type:"shoulder-coordination",task:"heel-baseline-stop"},
  {type:"rotation"},{type:"counter-rotation"},{type:"mixed-rotation"},
];
test("旋转门控拒绝未知变体和不属于该类型的任务",()=>{
  for(const c of configurations)assert.ok(isRotationLesson(c));
  for(const c of [{type:"rotation",task:"heel-speed-check"},{type:"shoulder-coordination",variant:"unknown"},{type:"counter-rotation",variant:"neutral"},{type:"mixed-rotation",task:"unknown"},{type:"shoulder-coordination",variant:"neutral",task:"arms-traverse-stop"}]){
    assert.equal(isRotationLesson(c),false);assert.throws(()=>sample(0,c));
  }
});
test("旋转任务共用固定装备、骨长与镜像，停止与连弯末态分开",()=>{
  const bones:[keyof MotionState["joints"],keyof MotionState["joints"],number][]=[
    ["frontAnkle","frontKnee",BODY.shin],["rearAnkle","rearKnee",BODY.shin],["frontKnee","frontHip",BODY.thigh],["rearKnee","rearHip",BODY.thigh],
    ["frontHip","rearHip",BODY.hipWidth],["pelvis","chest",BODY.trunk],["frontShoulder","rearShoulder",BODY.shoulderWidth],
    ["frontShoulder","frontElbow",BODY.upperArm],["rearShoulder","rearElbow",BODY.upperArm],["frontElbow","frontHand",BODY.forearm],["rearElbow","rearHand",BODY.forearm],
  ];
  for(const c of configurations){
    for(let i=0;i<=500;i++){
      const a=sample(i/500,c).state,b=sample(i/500,c,"goofy").state;
      for(const [x,y,length] of bones)assert.ok(Math.abs(distance(a.joints[x],a.joints[y])-length)<1e-9);
      for(const key of Object.keys(a.joints) as (keyof MotionState["joints"])[]){
        assert.ok(a.joints[key].every(Number.isFinite));
        assert.ok(distance(b.joints[key],[-a.joints[key][0],a.joints[key][1],a.joints[key][2]])<1e-10);
      }
      assert.ok(distance(a.joints.frontAnkle,boardToWorld([.27,BODY.ankleHeight,0],a.board))<1e-10);
      assert.ok(distance(a.joints.rearAnkle,boardToWorld([-.27,BODY.ankleHeight,0],a.board))<1e-10);
      assert.ok(Math.abs(a.contact[1])<1e-10);
      for(const side of ["front","rear"] as const){
        assert.ok(distance(a.joints[side==="front"?"frontShoulder":"rearShoulder"],a.joints[side==="front"?"frontHand":"rearHand"])<BODY.upperArm+BODY.forearm-.08);
        const shin=a.joints[`${side}Knee`].map((v,i)=>v-a.joints[`${side}Ankle`][i]),boot=a.boots[side];
        const pitch=Math.atan2(shin.reduce((n,v,i)=>n+v*boot.toeDirection[i],0),shin.reduce((n,v,i)=>n+v*boot.up[i],0))*180/Math.PI;
        assert.ok(pitch>=12-1e-8&&pitch<=18+1e-8,"actual shin remains in this authored boot range");
      }
    }
    const end=sample(1,c),stops=end.task.endsWith("-stop");
    assert.equal(Math.hypot(...end.state.travel)<1e-8,stops);
    if(stops)assert.notEqual(end.state.edge,"flat");
  }
});
test("反向调速实际肩髋角速度异号、髋板同向，恢复不重复同时反拧",()=>{
  const c={type:"counter-rotation"};
  for(const stance of ["regular","goofy"] as const){
    for(let i=0;i<=1000;i++)assert.equal(sample(i/1000,c,stance).state.edge,"heel");
    for(let i=221;i<419;i++){
      const a=sample(i/1000,c,stance).state,b=sample((i+1)/1000,c,stance).state;
      const h=wrap(heading(b,"hip")-heading(a,"hip")),s=wrap(heading(b,"shoulder")-heading(a,"shoulder")),y=wrap(b.board.yaw-a.board.yaw);
      assert.ok(h*s<0);assert.ok(h*y>0);
    }
    for(let i=641;i<979;i++){
      const a=sample(i/1000,c,stance).state,b=sample((i+1)/1000,c,stance).state;
      const h=wrap(heading(b,"hip")-heading(a,"hip")),s=wrap(heading(b,"shoulder")-heading(a,"shoulder"));
      assert.ok(Math.abs(h)<1e-7||Math.abs(s)<1e-7||h*s>=0);
    }
    const a=sample(0,c,stance).state,b=sample(1,c,stance).state;
    assert.ok(Math.abs(wrap(a.board.yaw-b.board.yaw))<1e-10);
    assert.ok(Math.abs(wrap(heading(a,"shoulder")-heading(b,"shoulder")))<1e-10);
  }
  assert.ok(sample(.2,c).state.metrics.frontKnee>sample(.08,c).state.metrics.frontKnee);
});
test("同向旋转由实际肩髋线验证，允许换向极值附近自然相位差",()=>{
  let same=0,total=0,min=Infinity,max=-Infinity;
  for(let i=0;i<1000;i++){
    const a=sample(i/1000,{type:"rotation"}).state,b=sample((i+1)/1000,{type:"rotation"}).state;
    const h=wrap(heading(b,"hip")-heading(a,"hip")),s=wrap(heading(b,"shoulder")-heading(a,"shoulder")),y=wrap(b.board.yaw-a.board.yaw);
    if(Math.abs(y)>1e-5){total++;if(h*y>0&&s*y>0)same++;}
    const relative=wrap(heading(a,"shoulder")-a.board.yaw);min=Math.min(min,relative);max=Math.max(max,relative);
  }
  assert.ok(same/total>.96);assert.ok(max-min>8*Math.PI/180);
});
test("混合任务先同后刃反向一次，再连续接前后刃自然弯",()=>{
  const c={type:"mixed-rotation"},h=1e-6;
  for(const at of [.36,.46,.73]){
    const values=(t:number)=>{const s=sample(t,c).state;return [s.board.yaw,s.board.roll,heading(s,"hip"),heading(s,"shoulder")];};
    const a=values(at-h),b=values(at),d=values(at+h);
    for(let i=0;i<b.length;i++)assert.ok(Math.abs(wrap(b[i]-a[i])/h-wrap(d[i]-b[i])/h)<.002);
    // Check the displayed body, not just yaw/roll. The grounded board height
    // contains |sin roll|, which used to bounce at a nonzero-rate flat crossing.
    const sa=sample(at-h,c).state,sb=sample(at,c).state,sd=sample(at+h,c).state;
    for(const key of Object.keys(sb.joints) as (keyof MotionState["joints"])[])assert.ok(Math.hypot(...sb.joints[key].map((v,i)=>(sd.joints[key][i]-2*v+sa.joints[key][i])/h))<.002);
    assert.ok(Math.hypot(...sb.board.position.map((v,i)=>(sd.board.position[i]-2*v+sa.board.position[i])/h))<.002);
  }
  assert.equal(sample(0,c).state.edge,"heel");assert.equal(sample(.46,c).state.edge,"flat");
  assert.equal(sample(.6,c).state.edge,"toe");assert.equal(sample(.73,c).state.edge,"flat");
  assert.equal(sample(.9,c).state.edge,"heel");assert.ok(Math.hypot(...sample(1,c).state.travel)>.9);
});
test("停止末态独立支撑解保留前后刃的身体关系，不冻结弯中倾倒",()=>{
  for(const c of configurations.filter(c=>sample(1,c).task.endsWith("-stop")))for(const stance of ["regular","goofy"] as const){
    const s=sample(1,c,stance).state,side:Vec3=[Math.sin(s.board.yaw),0,Math.cos(s.board.yaw)],nose:Vec3=[Math.cos(s.board.yaw),0,-Math.sin(s.board.yaw)];
    assert.ok(Math.abs(s.com.reduce((n,v,i)=>n+(v-s.contact[i])*side[i],0))<1e-8,"COM projection reaches the grounded edge at zero speed");
    assert.ok(Math.abs(s.com.reduce((n,v,i)=>n+(v-s.contact[i])*nose[i],0))<s.board.length/2);
    const anatomical=side.map(v=>v*(stance==="regular"?1:-1)) as Vec3;
    const ankle=s.joints.frontAnkle.map((v,i)=>(v+s.joints.rearAnkle[i])/2) as Vec3;
    const tilt=(a:Vec3,b:Vec3)=>Math.atan2(a.reduce((n,v,i)=>n+(v-b[i])*anatomical[i],0),a[1]-b[1]);
    const lower=tilt(s.joints.pelvis,ankle),trunk=tilt(s.joints.chest,s.joints.pelvis);
    if(s.edge==="toe"){assert.ok(lower>0);assert.ok(trunk<lower-.03);}
    else {assert.ok(lower<0);assert.ok(trunk>lower+.03);}
    const a=sample(1-1e-4,c,stance).state;
    assert.ok(distance(a.board.position,s.board.position)/1e-4<1e-4,"actual route velocity also converges to zero");
  }
});
test("横切架臂和放臂后的短观察不改变肩线、刃角或路线，另行停止",()=>{
  for(const edgeSide of ["toe","heel"]){
    const c={type:"shoulder-coordination",task:"arms-traverse-stop",edgeSide};
    const base=sample(.1,c).state;
    for(const t of [.25,.36,.61,.72]){
      const s=sample(t,c).state;
      assert.ok(Math.abs(s.board.yaw-base.board.yaw)<1e-10);
      assert.ok(Math.abs(s.board.roll-base.board.roll)<1e-10);
      assert.ok(Math.abs(wrap(heading(s,"shoulder")-heading(base,"shoulder")))<1e-10);
    }
    assert.ok(distance(sample(.25,c).state.gaze,base.gaze)>.3);
    assert.ok(distance(sample(.36,c).state.gaze,base.gaze)<1e-10);
    assert.ok(distance(sample(.61,c).state.gaze,base.gaze)>.3);
    assert.ok(distance(sample(.72,c).state.gaze,base.gaze)<1e-10);
    assert.ok(Math.hypot(...sample(1,c).state.travel)<1e-10);
  }
});
test("朝向对照保留板与脚位，五组比较最终回原编排",()=>{
  for(let i=0;i<=200;i++){
    const t=i/200,c={type:"shoulder-coordination",variant:"closed-toe"};
    const a=sample(t,c).state,b=sample(t,{...c,rotationComparison:"slightly-open"}).state;
    assert.ok(distance(a.board.position,b.board.position)<1e-10);
    assert.equal(a.board.yaw,b.board.yaw);assert.equal(a.board.roll,b.board.roll);
    assert.ok(distance(a.joints.frontAnkle,b.joints.frontAnkle)<1e-10);
    assert.ok(distance(a.joints.rearAnkle,b.joints.rearAnkle)<1e-10);
    assert.ok(Math.abs(Math.abs(wrap(heading(a,"shoulder")-heading(b,"shoulder")))-8*Math.PI/180)<1e-10);
  }
  for(const u of [.13,.25,.5,.75,.9]){
    const c={type:"shoulder-coordination",variant:"open-heel"},a=sample(u/5,c).state,b=sample((4+u)/5,c).state;
    for(const key of Object.keys(a.joints) as (keyof MotionState["joints"])[])assert.ok(distance(local(a,key),local(b,key))<1e-9);
    for(let group=1;group<=4;group++){
      const s=sample((group+u)/5,c).state;
      assert.ok(Math.abs(s.board.yaw-a.board.yaw)<1e-10);assert.ok(Math.abs(s.board.roll-a.board.roll)<1e-10);
    }
  }
});
