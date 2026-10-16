import assert from "node:assert/strict";
import {test} from "node:test";
import {applyStance,buildPose,type Route} from "../prototype/motion";
import {bodyOrientationObservation,studiesBodyOrientation} from "../lesson-player/body-orientation";
import {sampleLesson} from "../lesson-player/motion";

const route:Route={position:[0,0,0],travel:[1,0,0],yaw:0,roll:0,edgeLoad:0,phase:0,half:0,progress:0,holding:false,lean:0,extension:0,braking:0};
const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);

test("开放朝向读取骨盆与胸廓，转头不能冒充开髋",()=>{
  const closed=buildPose(route,"correct",{hipYaw:0,shoulderYaw:0,torsoPitch:0,torsoAlong:0,lookDirection:[1,0,0]});
  const observed=bodyOrientationObservation(closed,"regular");
  near(observed.hip.towardNose,0);near(observed.hip.towardToe,1);
  near(observed.chest.towardNose,0);near(observed.chest.towardToe,1);
  const opened=buildPose(route,"correct",{hipYaw:Math.PI/4,shoulderYaw:Math.PI/3,torsoPitch:0,torsoAlong:0});
  const current=bodyOrientationObservation(opened,"regular");
  near(current.hip.towardNose,Math.SQRT1_2);near(current.hip.towardToe,Math.SQRT1_2);
  near(current.chest.towardNose,Math.sqrt(3)/2);near(current.chest.towardToe,.5);
});

test("镜像与整条路线朝向改变后，开放前方仍指向本人板头",()=>{
  for(const yaw of [-2.3,-.7,0,1.9]){
    const state=buildPose({...route,yaw},"correct",{hipYaw:yaw+Math.PI/4,shoulderYaw:yaw+Math.PI/3,torsoPitch:.3,torsoAlong:.1});
    const regular=bodyOrientationObservation(state,"regular"),goofy=bodyOrientationObservation(applyStance(state,"goofy"),"goofy");
    for(const key of ["hip","chest"] as const){
      near(regular[key].towardNose,goofy[key].towardNose);
      near(regular[key].towardToe,goofy[key].towardToe);
      assert.ok(regular[key].towardNose>0);
      near(Math.hypot(regular[key].towardNose,regular[key].towardToe),1);
    }
    near(regular.frontLeg,goofy.frontLeg);near(regular.rearLeg,goofy.rearLeg);
  }
});

test("分腿读数保持原前后脚身份，不以平均值替代各自屈伸",()=>{
  const state=buildPose(route,"correct",{hipYaw:Math.PI/4,shoulderYaw:Math.PI/3,legBend:65});
  const observed=bodyOrientationObservation(state,"regular");
  assert.ok(Math.abs(observed.frontLeg-observed.rearLeg)>.005);
  const shifted=structuredClone(state);
  shifted.board.position=shifted.board.position.map((v,i)=>v+[10,3,-7][i]) as [number,number,number];
  for(const joint of Object.values(shifted.joints))for(let i=0;i<3;i++)joint[i]+=[10,3,-7][i];
  const translated=bodyOrientationObservation(shifted,"regular");
  near(translated.frontLeg,observed.frontLeg);near(translated.rearLeg,observed.rearLeg);
  near(translated.hip.towardNose,observed.hip.towardNose);
});

test("朝向观察覆盖任务目标，不把所有后刃和低位任务提升为强制开放",()=>{
  for(const c of [{type:"jsba-carving"},{type:"fore-aft",variant:"rear-heel"},{type:"hip-edge-change",task:"board-coordinate-study"},{type:"shoulder-coordination"},{type:"counter-rotation"}])assert.equal(studiesBodyOrientation(c),true);
  for(const c of [{type:"heel-edge"},{type:"center-low"},{type:"rail-track"},{type:"fore-aft",variant:"front-return-toe"},{type:"hip-edge-change",task:"hip-transition"}])assert.equal(studiesBodyOrientation(c),false);
});

test("开放后刃对照真正转动骨盆与胸，保留板路线、固定脚位和小腿输入",()=>{
  for(const stance of ["regular","goofy"] as const)for(let i=0;i<=100;i++){
    const t=i/100,config={type:"fore-aft",variant:"rear-heel",task:"single-arc"};
    const natural=sampleLesson(t,{...config,rotationComparison:"natural"},stance),opened=sampleLesson(t,{...config,rotationComparison:"slightly-open"},stance);
    const a=natural.state,b=opened.state,ao=bodyOrientationObservation(a,stance),bo=bodyOrientationObservation(b,stance);
    assert.ok(bo.hip.towardNose>ao.hip.towardNose+.2);
    assert.ok(bo.chest.towardNose>ao.chest.towardNose+.3);
    assert.deepEqual(a.board,b.board);assert.deepEqual(a.boots,b.boots);
    for(const joint of ["frontAnkle","rearAnkle","frontKnee","rearKnee"] as const)assert.deepEqual(a.joints[joint],b.joints[joint]);
    assert.deepEqual(natural.stages.map(s=>s.at),opened.stages.map(s=>s.at));
  }
});
