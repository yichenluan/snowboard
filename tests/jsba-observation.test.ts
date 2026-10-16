import assert from "node:assert/strict";
import {test} from "node:test";
import {applyStance,buildPose,type Route} from "../prototype/motion";
import {jsbaBodyObservation} from "../lesson-player/jsba-observation";

const route:Route={position:[0,0,0],travel:[1,0,0],yaw:0,roll:0,edgeLoad:0,phase:0,half:0,progress:0,holding:false,lean:0,extension:0,braking:0};
const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);

test("开放朝向读取骨盆与胸廓，转头不能冒充开髋",()=>{
  const closed=buildPose(route,"correct",{hipYaw:0,shoulderYaw:0,torsoPitch:0,torsoAlong:0,lookDirection:[1,0,0]});
  const observed=jsbaBodyObservation(closed,"regular");
  near(observed.hip.towardNose,0);near(observed.hip.towardToe,1);
  near(observed.chest.towardNose,0);near(observed.chest.towardToe,1);
  const opened=buildPose(route,"correct",{hipYaw:Math.PI/4,shoulderYaw:Math.PI/3,torsoPitch:0,torsoAlong:0});
  const current=jsbaBodyObservation(opened,"regular");
  near(current.hip.towardNose,Math.SQRT1_2);near(current.hip.towardToe,Math.SQRT1_2);
  near(current.chest.towardNose,Math.sqrt(3)/2);near(current.chest.towardToe,.5);
});

test("镜像与整条路线朝向改变后，开放前方仍指向本人板头",()=>{
  for(const yaw of [-2.3,-.7,0,1.9]){
    const state=buildPose({...route,yaw},"correct",{hipYaw:yaw+Math.PI/4,shoulderYaw:yaw+Math.PI/3,torsoPitch:.3,torsoAlong:.1});
    const regular=jsbaBodyObservation(state,"regular"),goofy=jsbaBodyObservation(applyStance(state,"goofy"),"goofy");
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
  const observed=jsbaBodyObservation(state,"regular");
  assert.ok(Math.abs(observed.frontLeg-observed.rearLeg)>.005);
  const shifted=structuredClone(state);
  shifted.board.position=shifted.board.position.map((v,i)=>v+[10,3,-7][i]) as [number,number,number];
  for(const joint of Object.values(shifted.joints))for(let i=0;i<3;i++)joint[i]+=[10,3,-7][i];
  const translated=jsbaBodyObservation(shifted,"regular");
  near(translated.frontLeg,observed.frontLeg);near(translated.rearLeg,observed.rearLeg);
  near(translated.hip.towardNose,observed.hip.towardNose);
});
