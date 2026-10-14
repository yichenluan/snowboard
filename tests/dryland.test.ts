import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {canRenderDryland,drylandCapability,sampleDryland,type DrylandConfig} from "../lesson-player/dryland.ts";
import type {Vec3} from "../prototype/motion.ts";

const content=JSON.parse(readFileSync(new URL("../content.json",import.meta.url),"utf8"));
const all:DrylandConfig[]=content.lessons.flatMap((l:{demos?:DrylandConfig[];demo?:DrylandConfig})=>l.demos?.length?l.demos:l.demo?[l.demo]:[]);
const standingTypes=new Set(["dry-squat","dry-calf-raise","dry-wall-edge","dry-shoulder-rolls"]);
const refs=all.filter(c=>standingTypes.has(c.type)&&canRenderDryland(c)),sides=["left","right"] as const;
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
const additionalTypes=["dry-plank","ankle-mobility","hip-mobility","dry-hamstring"] as const;
test("additional tasks preserve bones, fixed supports and their endpoints",()=>{
  const extra=all.filter(c=>(additionalTypes as readonly string[]).includes(c.type));
  assert.equal(extra.length,8);
  for(const type of additionalTypes)for(const side of sides) {
    const c={type,side},first=sampleDryland(0,c),stable=new Map<string,Vec3>();
    for(let i=0;i<=200;i++) {
      const f=sampleDryland(i/200,c);
      assert.ok(f.metrics.maxBoneError<1e-9);
      assert.deepEqual(f.props,first.props);
      for(const contact of f.contacts) {
        assert.ok(distance(contact.point,contact.target)<1e-9);
        if(["mat","wall","floor"].includes(contact.surface)) {
          if(stable.has(contact.id))assert.ok(distance(contact.point,stable.get(contact.id)!)<1e-9);
          else stable.set(contact.id,contact.point);
        }
      }
      if(f.contacts.some(contact=>contact.surface==="mat")) {
        const polygon=hull(f.contacts.filter(contact=>contact.surface==="mat").map(contact=>contact.point));
        for(let k=0;k<polygon.length;k++)assert.ok(cross(polygon[k],polygon[(k+1)%polygon.length],f.estimatedCom)>=-1e-9);
      }
    }
    assert.deepEqual(sampleDryland(1,c).joints,first.joints);
    assert.deepEqual(sampleDryland(1,c).feet,first.feet);
  }
});
test("supine hamstring holds the thigh while the knee moves",()=>{
  for(const side of sides) {
    const c={type:"dry-hamstring",side},first=sampleDryland(0,c),peak=sampleDryland(.5,c);
    assert.equal(peak.pelvisRadius,.13);
    assert.ok(first.metrics.knee[side]>100);
    assert.ok(peak.metrics.knee[side]>25&&peak.metrics.knee[side]<45);
    assert.deepEqual(first.joints[side].hip,peak.joints[side].hip);
    assert.deepEqual(first.joints[side].knee,peak.joints[side].knee);
    assert.deepEqual(first.hands,peak.hands);
    for(const name of ["back","head","pelvis.-0.01","pelvis.0.01"])assert.ok(peak.contacts.some(contact=>contact.id===name));
    const held=peak.contacts.filter(contact=>contact.surface===side+".thigh");
    assert.equal(held.length,2);
    const leg=peak.joints[side],axis=leg.knee.map((v,i)=>v-leg.hip[i]) as Vec3,length=distance(leg.hip,leg.knee);
    for(const contact of held) {
      const offset=contact.point.map((v,i)=>v-leg.hip[i]);
      const along=offset.reduce((sum,v,i)=>sum+v*axis[i]/length,0);
      const radial=Math.sqrt(offset.reduce((sum,v)=>sum+v*v,0)-along*along);
      assert.ok(along>.07&&along<length-.07);
      assert.ok(Math.abs(radial-.07)<1e-9);
    }
  }
});
test("half kneeling changes pelvic direction before translating the hips",()=>{
  const c={type:"hip-mobility",side:"left" as const};
  const first=sampleDryland(0,c),tucked=sampleDryland(.3,c),forward=sampleDryland(.6,c);
  assert.deepEqual(first.joints.pelvis,tucked.joints.pelvis);
  assert.ok(tucked.pelvisForward![1]>.06);
  assert.ok(forward.joints.pelvis[2]>first.joints.pelvis[2]+.06);
  assert.deepEqual(first.joints.left.knee,forward.joints.left.knee);
  assert.deepEqual(first.feet,forward.feet);
});
test("plank closes the fixed support chain and holds a sagittal shoulder hip ankle line",()=>{
  const c={type:"dry-plank"},first=sampleDryland(0,c),hold=sampleDryland(.5,c),end=sampleDryland(1,c);
  assert.equal(first.contacts.filter(c=>c.id.endsWith(".knee")).length,2);
  assert.equal(hold.contacts.filter(c=>c.id.endsWith(".knee")).length,0);
  assert.equal(end.contacts.filter(c=>c.id.endsWith(".knee")).length,2);
  for(const side of sides) {
    assert.deepEqual(first.joints[side].elbow,hold.joints[side].elbow);
    assert.deepEqual(first.joints[side].wrist,hold.joints[side].wrist);
    assert.deepEqual(first.feet[side],hold.feet[side]);
    const {shoulder,hip,ankle}=hold.joints[side];
    const area=(hip[1]-ankle[1])*(shoulder[2]-ankle[2])-(hip[2]-ankle[2])*(shoulder[1]-ankle[1]);
    assert.ok(Math.abs(area)<1e-9);
    for(const contact of hold.contacts.filter(c=>c.id.startsWith(side+".forearm.")))assert.ok(Math.abs(hold.joints[side].elbow[1]-contact.point[1]-.032)<1e-9);
  }
});
test("additional capabilities reject an unrelated task",()=>{
  assert.equal(drylandCapability("ankle-mobility"),"standing");
  for(const type of ["dry-plank","hip-mobility","dry-hamstring"])assert.equal(drylandCapability(type),"floor");
  assert.throws(()=>sampleDryland(.5,{type:"dry-plank",task:"bodyweight-squat"}),/Invalid dryland task/);
});
test("asymmetric tasks mirror anatomical sides and keep shoe meshes above their supports",()=>{
  const mirror=(p:Vec3):Vec3=>[-p[0],p[1],p[2]];
  const dot=(a:Vec3,b:Vec3)=>a.reduce((sum,v,i)=>sum+v*b[i],0);
  const cross3=(a:Vec3,b:Vec3):Vec3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  for(const type of additionalTypes)for(let i=0;i<=100;i++) {
    const left=sampleDryland(i/100,{type,side:"left"}),right=sampleDryland(i/100,{type,side:"right"});
    for(const side of sides) {
      const opposite=side==="left"?"right":"left";
      for(const key of ["hip","knee","ankle","shoulder","elbow","wrist"] as const)assert.ok(distance(mirror(left.joints[side][key]),right.joints[opposite][key])<1e-9);
      for(const key of ["heel","ball","toe","ankle"] as const)assert.ok(distance(mirror(left.feet[side][key]),right.feet[opposite][key])<1e-9);
      const f=left.feet[side],surface=type==="ankle-mobility"?0:.015;
      // Renderer bases must be rotations, including a raised ordinary shoe's
      // front segment. Assuming global UP would invert its visible support.
      for(const [forward,up] of [[f.forward,f.frontUp],[f.rearForward,f.rearUp]]) {
        assert.ok(Math.abs(dot(forward,up))<1e-9);
        assert.ok(distance(cross3(f.right,up),forward)<1e-9);
      }
      for(const [a,b,up] of [[f.heel,f.ball,f.rearUp],[f.ball,f.toe,f.frontUp]])for(const p of [a,b])for(const x of [-1,1])for(const h of [0,f.soleThickness]) {
        const y=p[1]+x*f.right[1]*f.width/2+up[1]*h;
        assert.ok(y>=surface-1e-9,"shoe sole mesh may not penetrate its floor or mat");
      }
    }
    if(type==="dry-hamstring")assert.ok(Math.abs(left.joints.pelvis[1]-left.pelvisRadius!-.015)<1e-9,"visible pelvis capsule must meet its recorded mat contact");
  }
});
