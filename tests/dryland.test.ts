import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {canRenderDryland,drylandCapability,sampleDryland,type DrylandConfig} from "../lesson-player/dryland.ts";
import type {Vec3} from "../prototype/motion.ts";

const content=JSON.parse(readFileSync(new URL("../content.json",import.meta.url),"utf8"));
const all:DrylandConfig[]=content.lessons.flatMap((l:{demos?:DrylandConfig[];demo?:DrylandConfig})=>l.demos?.length?l.demos:l.demo?[l.demo]:[]);
const refs=all.filter(canRenderDryland),sides=["left","right"] as const;
const distance=(a:Vec3,b:Vec3)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const cross=(o:Vec3,a:Vec3,b:Vec3)=>(a[0]-o[0])*(b[2]-o[2])-(a[2]-o[2])*(b[0]-o[0]);
function hull(points:Vec3[]) {
  const p=points.slice().sort((a,b)=>a[0]-b[0]||a[2]-b[2]),lower:Vec3[]=[],upper:Vec3[]=[];
  for(const v of p){while(lower.length>=2&&cross(lower.at(-2)!,lower.at(-1)!,v)<=0)lower.pop();lower.push(v);}
  for(const v of p.slice().reverse()){while(upper.length>=2&&cross(upper.at(-2)!,upper.at(-1)!,v)<=0)upper.pop();upper.push(v);}
  return lower.slice(0,-1).concat(upper.slice(0,-1));
}
test("all standing references preserve bones, contact surfaces and a supported estimated COM",()=>{
  assert.equal(refs.length,12);assert.equal(new Set(refs.map(c=>c.task)).size,8);
  for(const c of refs) {
    const initial=sampleDryland(0,c);
    for(let i=0;i<=200;i++) {
      const f=sampleDryland(i/200,c);
      assert.ok(f.metrics.maxBoneError<1e-9,`${c.task}: limbs must not stretch`);
      assert.deepEqual(f.props,initial.props,"external support cannot follow the person");
      for(const contact of f.contacts)assert.ok(distance(contact.point,contact.target)<1e-9);
      if(f.contacts.some(contact=>contact.id.endsWith(".palm")))for(const side of sides)assert.deepEqual(f.hands[side],initial.hands[side]);
      const support=hull(f.contacts.filter(contact=>contact.surface==="floor").map(contact=>contact.point));
      for(let k=0;k<support.length;k++)assert.ok(cross(support[k],support[(k+1)%support.length],f.estimatedCom)>=-1e-9,"coarse COM projection must remain in the actual sole support polygon");
    }
  }
});
test("calf raises transfer before lifting and rotate both rear feet without sliding the forefoot",()=>{
  const c={type:"dry-calf-raise"},start=sampleDryland(0,c),shift=sampleDryland(.18,c),high=sampleDryland(.5,c),end=sampleDryland(1,c);
  assert.ok(shift.estimatedCom[2]>start.estimatedCom[2]+.06);
  for(const side of sides) {
    assert.equal(shift.feet[side].heelLift,0);assert.ok(high.feet[side].heelLift>.07);
    assert.ok(Math.abs(high.metrics.knee[side]-shift.metrics.knee[side])<1e-8,"rising cannot be produced by knee extension");
    for(let i=0;i<=100;i++){const f=sampleDryland(i/100,c);assert.deepEqual(f.feet[side].ball,start.feet[side].ball);assert.deepEqual(f.feet[side].toe,start.feet[side].toe);}
  }
  const pelvisRise=high.joints.pelvis[1]-shift.joints.pelvis[1];
  assert.ok(pelvisRise>.04);
  assert.ok(Math.abs(pelvisRise-(high.feet.left.ankle[1]-shift.feet.left.ankle[1]))<1e-9,"body rises by the shoe rotation, not by stretching the legs");
  assert.deepEqual(end.feet,start.feet);assert.deepEqual(end.joints,start.joints);
});
test("anatomical left and right agree with a person facing positive z",()=>{
  const f=sampleDryland(0,{type:"dry-squat"});
  // Looking from behind in +z, a person's left is +x in this right-handed world.
  for(const part of ["hip","knee","ankle","shoulder","elbow","wrist"] as const)assert.ok(f.joints.left[part][0]>f.joints.right[part][0]);
  assert.ok(f.feet.left.toe[0]>f.feet.left.heel[0],"left toes turn outward toward +x");
  assert.ok(f.feet.right.toe[0]<f.feet.right.heel[0],"right toes turn outward toward -x");
  const supported=sampleDryland(.5,{type:"dry-wall-edge"});
  assert.ok(supported.contacts.find(c=>c.id==="left.palm")!.point[0]>0);
  assert.ok(supported.contacts.find(c=>c.id==="right.palm")!.point[0]<0);
});
test("squat purposes have distinct ranges, support and hold timing",()=>{
  const f=(task:string,t=.5)=>sampleDryland(t,{type:"dry-squat",task});
  assert.ok(f("bodyweight-squat").joints.pelvis[1]<f("warmup-shallow").joints.pelvis[1]-.1);
  assert.ok(f("supported-shallow-squat").props.some(p=>p.id==="chair.top"));
  assert.deepEqual(f("shallow-hold",.4).joints,f("shallow-hold",.7).joints);
  assert.ok(f("warmup-shallow",.7).joints.pelvis[1]>f("warmup-shallow",.5).joints.pelvis[1]);
  assert.match(f("shoe-knee-baseline",0).phases[0].detail,/穿靴扣板.*另一任务/);
});
test("wall rocking keeps full soles and fixed palms while knees advance",()=>{
  const c={type:"dry-wall-edge"},first=sampleDryland(0,c),peak=sampleDryland(.5,c);
  for(const side of sides) {
    assert.deepEqual(first.feet[side],peak.feet[side]);assert.deepEqual(first.hands[side],peak.hands[side]);
    assert.ok(peak.joints[side].knee[2]>first.joints[side].knee[2]+.07);
  }
});
test("shoulder rolls move the girdle subtly while feet, torso and neck remain steady",()=>{
  const c={type:"dry-shoulder-rolls"},first=sampleDryland(0,c);let max=0;
  for(let i=0;i<=200;i++) {
    const f=sampleDryland(i/200,c);assert.deepEqual(f.feet,first.feet);
    for(const key of ["pelvis","chest","neck","head"] as const)assert.deepEqual(f.joints[key],first.joints[key]);
    max=Math.max(max,distance(f.joints.left.shoulder,first.joints.left.shoulder));
  }
  assert.ok(max>.02&&max<.03);assert.deepEqual(sampleDryland(1,c).joints,first.joints);
});
test("unimplemented floor and asymmetric tasks cannot silently produce a standing placeholder",()=>{
  for(const type of ["dry-plank","ankle-mobility","hip-mobility","dry-hamstring"]) {
    assert.equal(drylandCapability(type),"deferred");assert.equal(canRenderDryland({type}),false);assert.throws(()=>sampleDryland(.5,{type}),/not implemented/);
  }
});
