import assert from "node:assert/strict";
import {test} from "node:test";
import {BODY,boardToWorld,type MotionState,type Vec3} from "../prototype/motion.ts";
import {surfaceMeshData,surfacePointToWorld,surfaceRollAt,surfaceSnowHeight,surfaceVectorToWorld,type SurfaceBoard} from "../prototype/board-surface.ts";
import {sampleTwistLesson,twistGeometry} from "../lesson-player/twist.ts";
const distance=(a:Vec3,b:Vec3)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const base:SurfaceBoard={position:[.2,.08,.7],yaw:-.8,roll:.18,length:1.58,width:.265,thickness:.026};
test("optional surface preserves rigid geometry and keeps each mounting footprint planar",()=>{
  for(const x of [-.79,-.37,-.17,0,.17,.37,.79])for(const z of [-.1325,0,.1325]){
    const p:Vec3=[x,.013,z];assert.ok(distance(surfacePointToWorld(p,base),boardToWorld(p,base))<1e-12);
    const same={...base,segmentRolls:{front:base.roll,rear:base.roll}};assert.ok(distance(surfacePointToWorld(p,same),boardToWorld(p,base))<1e-12);
  }
  const b={...base,segmentRolls:{front:-.02,rear:.04}};
  for(const x of [-.37,-.17,.17,.37])assert.equal(surfaceRollAt(x,b),x>0?b.segmentRolls.front:b.segmentRolls.rear);
  for(const x of [-.27,.27]){
    const at=surfacePointToWorld([x,0,0],b),normal=surfaceVectorToWorld([0,1,0],b,x);
    for(const dx of [-.099,.099])for(const dz of [-.16,.16]){
      const p=surfacePointToWorld([x+dx,0,dz],b);
      assert.ok(Math.abs(p.reduce((sum,v,i)=>sum+(v-at[i])*normal[i],0))<1e-12,"full rigid mounting frame shares the local plane");
    }
  }
});
test("twist comparison changes only segment timing on one common planar route",()=>{
  let maxDifference=0;
  for(const fromEdge of ["toe","heel"] as const)for(let i=0;i<=400;i++){
    const t=i/400,config={type:"twist",task:"twist-timing-compare",fromEdge};
    const baseline=twistGeometry(t,{...config,twistTiming:"near-synchronous"}),early=twistGeometry(t,{...config,twistTiming:"front-earlier"});
    assert.deepEqual(baseline.route.position,early.route.position);assert.deepEqual(baseline.route.travel,early.route.travel);assert.equal(baseline.route.yaw,early.route.yaw);
    assert.equal(baseline.pose.segmentRolls.front,baseline.pose.segmentRolls.rear);
    maxDifference=Math.max(maxDifference,Math.abs(early.pose.segmentRolls.front-early.pose.segmentRolls.rear)*180/Math.PI);
    const b={...base,roll:early.route.roll,segmentRolls:early.pose.segmentRolls};b.position=[0,surfaceSnowHeight(b),0];
    for(let k=0;k<=40;k++)for(const z of [-b.width/2,b.width/2])assert.ok(surfacePointToWorld([-b.length/2+b.length*k/40,-b.thickness/2,z],b)[1]>-1e-12);
    if(t<.175||t>.825)assert.equal(early.pose.segmentRolls.front,early.pose.segmentRolls.rear);
  }
  assert.ok(maxDifference>3&&maxDifference<5,"small local roll difference, not a large opposing twist");
  const config={type:"twist",task:"progressive-twist",fromEdge:"heel" as const};
  const at=twistGeometry(.5,config).pose.segmentRolls;assert.ok(at.front>0&&at.rear<0,"front crosses first and rear follows");
});
test("local board surfaces drive both boots and bone-constrained legs in either stance",()=>{
  for(const fromEdge of ["toe","heel"] as const)for(const twistTiming of ["near-synchronous","front-earlier"] as const)for(let i=0;i<=300;i++){
    const c={type:"twist",task:"twist-timing-compare",fromEdge,twistTiming},t=i/300,regular=sampleTwistLesson(t,c).state,goofy=sampleTwistLesson(t,c,"goofy").state;
    for(const s of [regular,goofy]){
      for(const which of ["front","rear"] as const){
        const boot=s.boots[which],x=which==="front"?BODY.stanceWidth/2:-BODY.stanceWidth/2;
        const hip=s.joints[which+"Hip" as keyof MotionState["joints"]],knee=s.joints[which+"Knee" as keyof MotionState["joints"]],ankle=s.joints[which+"Ankle" as keyof MotionState["joints"]];
        assert.ok(distance(boot.position,boardToWorld(boot.localPosition,s.board))<1e-9);
        assert.ok(distance(boot.up,surfaceVectorToWorld([0,1,0],s.board,x))<1e-9);
        assert.ok(distance(ankle,boardToWorld([x,BODY.ankleHeight,0],s.board))<1e-9);
        assert.ok(Math.abs(distance(hip,knee)-BODY.thigh)<1e-9&&Math.abs(distance(knee,ankle)-BODY.shin)<1e-9);
        assert.ok(boot.cuffPitch>=12-1e-9&&boot.cuffPitch<=18+1e-9);
      }
      assert.ok(Math.abs(s.contact[1])<1e-9,"one actual lowest geometric point remains on snow");
      const mesh=surfaceMeshData(s.board);for(let k=1;k<mesh.positions.length;k+=3)assert.ok(mesh.positions[k]+s.board.position[1]>=-1e-9,"rendered lower surface cannot penetrate snow");
    }
    for(const key of Object.keys(regular.joints) as (keyof MotionState["joints"])[]){const p=regular.joints[key];assert.ok(distance([-p[0],p[1],p[2]],goofy.joints[key])<1e-9);}
  }
});
test("local flat events and the middle support handoff keep all joint velocities continuous",()=>{
  const h=1e-5;
  for(const fromEdge of ["toe","heel"] as const)for(const twistTiming of ["near-synchronous","front-earlier"] as const){
    const c={type:"twist",task:"twist-timing-compare",fromEdge,twistTiming};
    const events=[.175,.20,.225,.42,.5,.58,.775,.80,.825,...sampleTwistLesson(0,c).stages.map(s=>s.at)].filter(t=>t>h&&t<1-h);
    for(const t of events){
      const a=sampleTwistLesson(t-h,c).state,b=sampleTwistLesson(t,c).state,z=sampleTwistLesson(t+h,c).state;
      for(const key of Object.keys(b.joints) as (keyof MotionState["joints"])[])assert.ok(Math.hypot(...b.joints[key].map((v,i)=>(z.joints[key][i]-2*v+a.joints[key][i])/h))<.001,"no vertical or cuff-induced joint velocity step");
      assert.ok(Math.abs((z.board.position[1]-2*b.board.position[1]+a.board.position[1])/h)<.001);
    }
  }
});
