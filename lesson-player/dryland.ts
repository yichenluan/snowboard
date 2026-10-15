import { BODY, type Vec3 } from "../prototype/motion";
import registry from "./registry.json";

/** Ordinary shoes, metres: +x subject's left, +y up, +z forward.
 * Authoring parameters and segment weights are not measured motion or clinical ROM.
 * This rig is independent of the snowboard and boot constraints. */
export const DRYLAND_TYPES=["dry-squat","dry-calf-raise","dry-wall-edge","dry-shoulder-rolls","dry-plank","ankle-mobility","hip-mobility","dry-hamstring"] as const;
export type DrylandType=typeof DRYLAND_TYPES[number];
export type Side="left"|"right";
export type StandingTask="bodyweight-squat"|"supported-shallow-squat"|"shallow-hold"|"warmup-shallow"|"shoe-knee-baseline"|"bilateral-calf-raise"|"bilateral-ankle-rock"|"shoulder-rolls";
export type AdditionalTask="forearm-plank"|"split-calf-stretch"|"half-kneel-hip-flexor"|"supine-hamstring";
export type DryTask=StandingTask|AdditionalTask;
export interface DrylandConfig {type:string;task?:string;variant?:string;side?:Side}
export interface DryPhase {at:number;title:string;detail:string}
export interface Limb {hip:Vec3;knee:Vec3;ankle:Vec3;shoulder:Vec3;elbow:Vec3;wrist:Vec3}
export interface DryJoints {pelvis:Vec3;chest:Vec3;neck:Vec3;head:Vec3;left:Limb;right:Limb}
export interface DryFoot {
  ankle:Vec3;
  /** Sole-surface points, not mesh centres. Rear shoe rotates around ball. */
  heel:Vec3;ball:Vec3;toe:Vec3;forward:Vec3;frontUp:Vec3;
  /** Right-handed shoe-box transverse axis, not anatomical right. */right:Vec3;
  rearForward:Vec3;rearUp:Vec3;
  width:number;soleThickness:number;heelLift:number;
}
export interface DryHand {wrist:Vec3;palm:Vec3;along:Vec3;/** From palm toward contact surface. */normal:Vec3;halfThickness:number}
export interface DryContact {id:string;surface:string;point:Vec3;target:Vec3;/** Surface normal toward person. */normal:Vec3}
export type DryProp={id:string;kind:"plane";center:Vec3;normal:Vec3;size:[number,number]}|{id:string;kind:"bar";a:Vec3;b:Vec3;radius:number}|{id:string;kind:"box";center:Vec3;size:Vec3};
export interface DrylandFrame {
  domain:"dryland";type:DrylandType;task:DryTask;t:number;phase:number;phases:DryPhase[];
  joints:DryJoints;feet:Record<Side,DryFoot>;hands:Record<Side,DryHand>;contacts:DryContact[];props:DryProp[];
  /** Coarse authoring diagnostic, not measured COM or pressure. */estimatedCom:Vec3;
  metrics:{knee:Record<Side,number>;maxBoneError:number};
  cameraTarget?:Vec3;pelvisForward?:Vec3;pelvisRadius?:number;
}
export const DRY_AUTHOR=Object.freeze({ankleHeight:.075,heelToBall:.19,ankleBehindBall:.135,ballToToe:.07,shoeWidth:.105,soleThickness:.04,palmLength:.07,palmHalfThickness:.022});
const SIDES:Side[]=["left","right"],UP:Vec3=[0,1,0],FORWARD:Vec3=[0,0,1];
const add=(a:Vec3,b:Vec3):Vec3=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const sub=(a:Vec3,b:Vec3):Vec3=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const mul=(a:Vec3,n:number):Vec3=>[a[0]*n,a[1]*n,a[2]*n];
const dot=(a:Vec3,b:Vec3)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const len=(a:Vec3)=>Math.hypot(...a);
const unit=(a:Vec3):Vec3=>{const n=len(a);if(n<1e-10)throw new Error("Degenerate dryland direction");return mul(a,1/n);};
const mid=(a:Vec3,b:Vec3)=>mul(add(a,b),.5);
const clamp=(x:number,a=0,b=1)=>Math.max(a,Math.min(b,x));
const rad=(x:number)=>x*Math.PI/180;
const ease=(x:number)=>{const u=clamp(x);return u*u*u*(10+u*(-15+6*u));};
const interval=(t:number,a:number,b:number)=>ease((t-a)/(b-a));
const pulse=(t:number,a:number,b:number,c:number,d:number)=>interval(t,a,b)*(1-interval(t,c,d));
const angle=(a:Vec3,b:Vec3)=>Math.acos(clamp(dot(unit(a),unit(b)),-1,1))*180/Math.PI;
const ALLOWED:Record<string,readonly DryTask[]>={
  "dry-squat":["bodyweight-squat","supported-shallow-squat","shallow-hold","warmup-shallow","shoe-knee-baseline"],
  "dry-calf-raise":["bilateral-calf-raise"],"dry-wall-edge":["bilateral-ankle-rock"],"dry-shoulder-rolls":["shoulder-rolls"],
  "dry-plank":["forearm-plank"],"ankle-mobility":["split-calf-stretch"],"hip-mobility":["half-kneel-hip-flexor"],"dry-hamstring":["supine-hamstring"],
};
export function drylandCapability(type:string):"standing"|"floor"|null {
  if(!Object.hasOwn(ALLOWED,type))return null;
  return ["dry-plank","hip-mobility","dry-hamstring"].includes(type)?"floor":"standing";
}
export const canRenderDryland=(c:DrylandConfig)=>(registry.drylandTypes as string[]).includes(c.type)&&drylandCapability(c.type)!==null;
export function drylandTask(c:DrylandConfig):DryTask {
  const allowed=Object.hasOwn(ALLOWED,c.type)?ALLOWED[c.type]:undefined;
  if(!allowed)throw new Error("Dryland task not implemented: "+c.type);
  const task=c.task??(c.type==="dry-squat"&&c.variant==="hold"?"shallow-hold":allowed[0]);
  if(!allowed.includes(task as DryTask))throw new Error("Invalid dryland task: "+task);
  return task as DryTask;
}
/** Exact two-link solution; fail rather than stretch bones or move contacts. */
export function solveTwoBone(root:Vec3,end:Vec3,first:number,second:number,pole:Vec3):Vec3 {
  const delta=sub(end,root),d=len(delta);
  if(d<=Math.abs(first-second)+1e-8||d>=first+second-1e-8)throw new Error("Unreachable dryland limb: "+d.toFixed(6));
  const axis=mul(delta,1/d);let bend=sub(pole,mul(axis,dot(pole,axis)));
  if(len(bend)<1e-8){const fallback:Vec3=Math.abs(axis[1])<.9?UP:[1,0,0];bend=sub(fallback,mul(axis,dot(fallback,axis)));}
  const along=(first*first-second*second+d*d)/(2*d),h=Math.sqrt(Math.max(0,first*first-along*along));
  return add(add(root,mul(axis,along)),mul(unit(bend),h));
}
function shoe(sign:number,width:number,toeOut:number,heelAngle:number):DryFoot {
  const yaw=sign*rad(toeOut),a=rad(heelAngle),forward:Vec3=[Math.sin(yaw),0,Math.cos(yaw)],right:Vec3=[Math.cos(yaw),0,-Math.sin(yaw)];
  const ball=add([sign*width/2,0,0],mul(forward,DRY_AUTHOR.ankleBehindBall));
  const rearForward=add(mul(forward,Math.cos(a)),mul(UP,-Math.sin(a))),rearUp=add(mul(UP,Math.cos(a)),mul(forward,Math.sin(a)));
  const heel=add(ball,mul(rearForward,-DRY_AUTHOR.heelToBall));
  const ankle=add(add(ball,mul(rearForward,-DRY_AUTHOR.ankleBehindBall)),mul(rearUp,DRY_AUTHOR.ankleHeight));
  return {ankle,heel,ball,toe:add(ball,mul(forward,DRY_AUTHOR.ballToToe)),forward,frontUp:UP,right,rearForward,rearUp,width:DRY_AUTHOR.shoeWidth,soleThickness:DRY_AUTHOR.soleThickness,heelLift:heel[1]};
}
interface StandingPose {width:number;toeOut:number;shin:number;thighBack:number;torso:number;heelAngle:number;arms:number;rollAngle:number;rollDirection:number;support:"none"|"chair"|"wall"}
function propsFor(support:StandingPose["support"]):DryProp[] {
  const props:DryProp[]=[{id:"floor",kind:"plane",center:[0,0,0],normal:UP,size:[3,3]}];
  if(support==="wall")props.push({id:"wall",kind:"plane",center:[0,.85,.5],normal:[0,0,-1],size:[1.2,1.7]});
  if(support==="chair") {
    props.push({id:"chair.top",kind:"bar",a:[-.28,.96,.42],b:[.28,.96,.42],radius:.025},{id:"chair.seat",kind:"box",center:[0,.45,.6],size:[.56,.04,.36]});
    for(const x of [-.28,.28])props.push({id:"chair.back."+x,kind:"bar",a:[x,.022,.42],b:[x,.96,.42],radius:.022},{id:"chair.front."+x,kind:"bar",a:[x,.022,.78],b:[x,.45,.78],radius:.022});
  }
  return props;
}
function fixedHand(sign:number,support:"chair"|"wall"):{hand:DryHand;contact:DryContact} {
  const wall=support==="wall",target:Vec3=wall?[sign*.195,1.13,.5]:[sign*.195,.985,.42],normal:Vec3=wall?[0,0,-1]:UP,along:Vec3=wall?UP:FORWARD;
  const palm=add(target,mul(normal,DRY_AUTHOR.palmHalfThickness)),wrist=sub(palm,mul(along,DRY_AUTHOR.palmLength));
  const hand:DryHand={wrist,palm,along,normal:mul(normal,-1),halfThickness:DRY_AUTHOR.palmHalfThickness};
  return {hand,contact:{id:(sign>0?"left":"right")+".palm",surface:wall?"wall":"chair.top",point:add(palm,mul(hand.normal,hand.halfThickness)),target,normal}};
}
function solveStanding(p:StandingPose) {
  const feet:Record<Side,DryFoot>={left:shoe(1,p.width,p.toeOut,p.heelAngle),right:shoe(-1,p.width,p.toeOut,p.heelAngle)},knees={} as Record<Side,Vec3>;
  for(const side of SIDES)knees[side]=add(feet[side].ankle,mul(add(mul(UP,Math.cos(rad(p.shin))),mul(feet[side].forward,Math.sin(rad(p.shin)))),BODY.shin));
  // Intersect fixed-thigh spheres after removing the hip offsets.
  const a=add(knees.left,[-BODY.hipWidth/2,0,0]),b=add(knees.right,[BODY.hipWidth/2,0,0]),span=sub(b,a),d=len(span);
  if(d<1e-8||d>=2*BODY.thigh)throw new Error("Unreachable dryland pelvis");
  const axis=mul(span,1/d),desired:Vec3=[0,Math.cos(rad(p.thighBack)),-Math.sin(rad(p.thighBack))];
  const radial=unit(sub(desired,mul(axis,dot(desired,axis)))),pelvis=add(mid(a,b),mul(radial,Math.sqrt(BODY.thigh*BODY.thigh-d*d/4)));
  const torsoUp:Vec3=[0,Math.cos(rad(p.torso)),Math.sin(rad(p.torso))],chest=add(pelvis,mul(torsoUp,BODY.trunk)),neck=add(chest,mul(torsoUp,BODY.neck)),head=add(neck,mul(torsoUp,BODY.head));
  const limbs={} as Record<Side,Limb>,hands={} as Record<Side,DryHand>,contacts:DryContact[]=[];
  for(const side of SIDES) {
    const sign=side==="left"?1:-1,foot=feet[side];
    // Fixed effective chest-shoulder length during the small girdle orbit.
    const dy=.012*Math.sin(p.rollAngle),dz=p.rollDirection*.012*(1-Math.cos(p.rollAngle));
    const shoulder=add(chest,[sign*Math.sqrt((BODY.shoulderWidth/2)**2-dy*dy-dz*dz),dy,dz]);
    let elbow:Vec3,wrist:Vec3;
    if(p.support!=="none") {
      const fixed=fixedHand(sign,p.support);hands[side]=fixed.hand;contacts.push(fixed.contact);wrist=fixed.hand.wrist;
      elbow=solveTwoBone(shoulder,wrist,BODY.upperArm,BODY.forearm,[sign*.35,-1,-.15]);
    }else{
      const upper=unit([sign*.07,-Math.cos(rad(p.arms)),Math.sin(rad(p.arms))]),fore=unit([sign*.07,-Math.cos(rad(p.arms+10)),Math.sin(rad(p.arms+10))]);
      elbow=add(shoulder,mul(upper,BODY.upperArm));wrist=add(elbow,mul(fore,BODY.forearm));
      hands[side]={wrist,palm:add(wrist,mul(fore,DRY_AUTHOR.palmLength)),along:fore,normal:unit(sub([-sign,0,0],mul(fore,-sign*fore[0]))),halfThickness:DRY_AUTHOR.palmHalfThickness};
    }
    limbs[side]={hip:add(pelvis,[sign*BODY.hipWidth/2,0,0]),knee:knees[side],ankle:foot.ankle,shoulder,elbow,wrist};
    const solePoints:[string,Vec3][]=[["ball",foot.ball],["toe",foot.toe]];
    if(foot.heelLift<1e-9)solePoints.push(["heel",foot.heel]);
    for(const [part,point] of solePoints)for(const lateral of [-1,1]){
      const surfacePoint=add(point,mul(foot.right,lateral*foot.width/2));
      contacts.push({id:side+"."+part+"."+lateral,surface:"floor",point:surfacePoint,target:[surfacePoint[0],0,surfacePoint[2]],normal:UP});
    }
  }
  const joints:DryJoints={pelvis,chest,neck,head,left:limbs.left,right:limbs.right};
  const parts:[Vec3,number][]=[[head,.08],[mid(pelvis,chest),.46],[pelvis,.10]];
  for(const side of SIDES){const l=limbs[side],f=feet[side];parts.push([mid(l.hip,l.knee),.10],[mid(l.knee,l.ankle),.04],[mid(l.shoulder,l.elbow),.014],[mid(l.elbow,l.wrist),.011],[mid(f.heel,f.toe),.015]);}
  const estimatedCom=parts.reduce((sum,[point,weight])=>add(sum,mul(point,weight)),[0,0,0] as Vec3);
  return {joints,feet,hands,contacts,props:propsFor(p.support),estimatedCom};
}
const phase=(at:number,title:string,detail:string):DryPhase=>({at,title,detail});
function phasesFor(task:StandingTask):DryPhase[] {
  if(task==="bilateral-calf-raise")return [
    phase(0,"全掌准备，轻扶稳椅","脚跟仍接地时先小幅向前掌调整；手只辅助平衡。"),
    phase(.18,"双跟缓慢抬起","前掌留地，脚跟与身体升高；不用伸膝或手拉代替提踵。"),
    phase(.42,"短暂停留","两侧同步，脚踝不向内外翻；本段不表示前刃站姿。"),
    phase(.58,"受控落跟","前掌位置不变，双侧脚跟缓慢回地。"),
    phase(.82,"全掌恢复","脚跟接地后再回到舒适站立。"),
  ];
  if(task==="bilateral-ankle-rock")return [
    phase(0,"普通鞋，轻扶墙","两脚全掌接地；此段没有雪靴与雪板。"),
    phase(.15,"小腿慢慢前移","两膝沿各自脚向前移，髋配合，脚跟不抬。"),
    phase(.42,"保留可控范围","不推墙强压，也不把距离等同于雪上刃角。"),
    phase(.65,"受控返回","全掌保持接触，平顺恢复。"),
  ];
  if(task==="shoulder-rolls")return [
    phase(0,"站定放松","本段只拆解肩部；完整热身还可配合踏步。"),
    phase(.12,"向前绕肩","肩膀小幅绕圈，手臂自然轻动，不抡整条手臂。"),
    phase(.49,"向后绕肩","反向小幅绕动，躯干和头颈基本安定。"),
    phase(.86,"恢复放松","回到起点，保持呼吸；不是雪上转弯动作。"),
  ];
  const hold=task==="shallow-hold",supported=task==="supported-shallow-squat";
  return [
    phase(0,task==="shoe-knee-baseline"?"穿普通鞋观察屈伸":"普通鞋站稳",task==="shoe-knee-baseline"?"只展示普通鞋小幅屈伸；穿雪靴并扣好固定器后的动作，需要另做相应练习检查。":supported?"双手轻扶稳椅，脚掌踩稳。":"舒适站距，全脚掌接地。"),
    phase(.15,hold?"浅幅下降":"受控下降","髋后下移，膝沿脚向、踝配合；不把膝锁在脚尖后。"),
    phase(hold?.32:.42,hold?"浅蹲保持":"舒适位置短停","膝髋仍有余量，保持呼吸；作者幅度不是统一训练标准。"),
    phase(hold?.75:.62,"平稳返回","髋与躯干共同升高，脚跟留地；本段未模拟雪上负荷。"),
  ];
}
export function drylandBoneErrors(j:DryJoints,feet:Record<Side,DryFoot>):number[] {
  const errors:number[]=[],test=(a:Vec3,b:Vec3,n:number)=>errors.push(Math.abs(len(sub(a,b))-n));
  test(j.pelvis,j.chest,BODY.trunk);test(j.chest,j.neck,BODY.neck);test(j.neck,j.head,BODY.head);
  for(const side of SIDES){const l=j[side],f=feet[side];test(j.pelvis,l.hip,BODY.hipWidth/2);test(l.hip,l.knee,BODY.thigh);test(l.knee,l.ankle,BODY.shin);test(j.chest,l.shoulder,BODY.shoulderWidth/2);test(l.shoulder,l.elbow,BODY.upperArm);test(l.elbow,l.wrist,BODY.forearm);test(f.heel,f.ball,DRY_AUTHOR.heelToBall);test(f.ball,f.toe,DRY_AUTHOR.ballToToe);test(f.ball,f.ankle,Math.hypot(DRY_AUTHOR.ankleBehindBall,DRY_AUTHOR.ankleHeight));}
  return errors;
}
export function sampleDryland(time:number,c:DrylandConfig):DrylandFrame {
  const task=drylandTask(c),t=clamp(Number.isFinite(time)?time:0);
  if(task==="forearm-plank"||task==="split-calf-stretch"||task==="half-kneel-hip-flexor"||task==="supine-hamstring")return sampleAdditional(t,c,task);
  const p:StandingPose={width:.34,toeOut:10,shin:4,thighBack:4,torso:6,heelAngle:0,arms:5,rollAngle:0,rollDirection:1,support:"none"};
  if(c.type==="dry-squat") {
    const hold=task==="shallow-hold",q=pulse(t,.15,hold?.32:.42,hold?.75:.62,1);
    // Authoring envelopes: shin, thigh-back, torso-forward, upper-arm degrees.
    const envelopes:Record<string,[number,number,number,number]>={"bodyweight-squat":[20,52,34,60],"supported-shallow-squat":[16,26,20,5],"shallow-hold":[15,34,26,30],"warmup-shallow":[12,25,17,20],"shoe-knee-baseline":[12,22,16,12]};
    const [shin,thigh,torso,arms]=envelopes[task];p.shin+=q*(shin-p.shin);p.thighBack+=q*(thigh-p.thighBack);p.torso+=q*(torso-p.torso);p.arms+=q*(arms-p.arms);
    if(task==="supported-shallow-squat")p.support="chair";
  }else if(task==="bilateral-calf-raise") {
    // Transfer while heels remain down; settle only after they return.
    const shift=pulse(t,0,.18,.82,1),lift=pulse(t,.18,.42,.58,.82);
    p.toeOut=0;p.shin=4+10*shift;p.thighBack=4-12*shift;p.torso=6*(1-shift);p.heelAngle=24*lift;p.support="chair";
  }else if(task==="bilateral-ankle-rock") {
    const q=pulse(t,.15,.42,.65,1);p.toeOut=5;p.shin=4+14*q;p.thighBack=4+10*q;p.torso=6;p.support="wall";
  }else if(task==="shoulder-rolls") {
    p.toeOut=5;p.arms=0;p.torso=0;
    if(t>=.12&&t<.49)p.rollAngle=2*Math.PI*interval(t,.12,.49);
    else if(t>=.49&&t<.86){p.rollAngle=2*Math.PI*interval(t,.49,.86);p.rollDirection=-1;}
  }
  const result=solveStanding(p),phases=phasesFor(task),knee={} as Record<Side,number>;
  for(const side of SIDES){const l=result.joints[side];knee[side]=180-angle(sub(l.hip,l.knee),sub(l.ankle,l.knee));}
  return {domain:"dryland",type:c.type as DrylandType,task,t,phase:phases.reduce((last,s,i)=>t>=s.at?i:last,0),phases,...result,metrics:{knee,maxBoneError:Math.max(...drylandBoneErrors(result.joints,result.feet))}};
}

/** Additional dryland tasks. All ROM and timing below are authoring envelopes. */
const MAT=.015;
const cross=(a:Vec3,b:Vec3):Vec3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const sideSign=(side:Side)=>side==="left"?1:-1;
const otherSide=(side:Side):Side=>side==="left"?"right":"left";
function movedFoot(foot:DryFoot,delta:Vec3):DryFoot {
  return {...foot,ankle:add(foot.ankle,delta),heel:add(foot.heel,delta),ball:add(foot.ball,delta),toe:add(foot.toe,delta)};
}
/** A rigid ordinary shoe for an airborne/resting foot; no snowboard axes. */
function freeFoot(ankle:Vec3,forward:Vec3,up:Vec3):DryFoot {
  const f=unit(forward),u=unit(up),right=unit(cross(u,f));
  if(Math.abs(dot(f,u))>1e-8)throw new Error("Nonorthogonal dryland foot");
  const ball=add(add(ankle,mul(f,DRY_AUTHOR.ankleBehindBall)),mul(u,-DRY_AUTHOR.ankleHeight));
  return {ankle,ball,heel:sub(ball,mul(f,DRY_AUTHOR.heelToBall)),toe:add(ball,mul(f,DRY_AUTHOR.ballToToe)),forward:f,right,rearForward:f,rearUp:u,frontUp:u,width:DRY_AUTHOR.shoeWidth,soleThickness:DRY_AUTHOR.soleThickness,heelLift:0};
}
function soleContacts(side:Side,foot:DryFoot,parts:("heel"|"ball"|"toe")[],height:number,surface:string):DryContact[] {
  return parts.flatMap(part=>[-1,1].map(n=>{
    const point=add(foot[part],mul(foot.right,n*foot.width/2));
    return {id:side+"."+part+"."+n,surface,point,target:[point[0],height,point[2]] as Vec3,normal:UP};
  }));
}
function contactHand(id:string,target:Vec3,normal:Vec3,along:Vec3,surface:string):{hand:DryHand;contact:DryContact} {
  const n=unit(normal),a=unit(along),palm=add(target,mul(n,DRY_AUTHOR.palmHalfThickness)),wrist=sub(palm,mul(a,DRY_AUTHOR.palmLength));
  const hand={wrist,palm,along:a,normal:mul(n,-1),halfThickness:DRY_AUTHOR.palmHalfThickness};
  return {hand,contact:{id,surface,point:add(palm,mul(hand.normal,hand.halfThickness)),target,normal:n}};
}
function core(pelvis:Vec3,up:Vec3) {
  const chest=add(pelvis,mul(up,BODY.trunk)),neck=add(chest,mul(up,BODY.neck)),head=add(neck,mul(up,BODY.head));
  return {pelvis,chest,neck,head};
}
function looseArm(shoulder:Vec3,sign:number) {
  const upper=unit([sign*.07,-Math.cos(rad(50)),Math.sin(rad(50))]),fore=unit([sign*.07,-Math.cos(rad(60)),Math.sin(rad(60))]);
  const elbow=add(shoulder,mul(upper,BODY.upperArm)),wrist=add(elbow,mul(fore,BODY.forearm));
  const hand:DryHand={wrist,palm:add(wrist,mul(fore,DRY_AUTHOR.palmLength)),along:fore,normal:unit(sub([-sign,0,0],mul(fore,-sign*fore[0]))),halfThickness:DRY_AUTHOR.palmHalfThickness};
  return {elbow,wrist,hand};
}
function matProps(centerZ=0,length=2.4):DryProp[] {
  return [{id:"floor",kind:"plane",center:[0,0,0],normal:UP,size:[3,3]},{id:"mat",kind:"box",center:[0,MAT/2,centerZ],size:[1.2,MAT,length]}];
}
function estimateDryCom(j:DryJoints,feet:Record<Side,DryFoot>):Vec3 {
  const parts:[Vec3,number][]=[[j.head,.08],[mid(j.pelvis,j.chest),.46],[j.pelvis,.10]];
  for(const side of SIDES){const l=j[side],f=feet[side];parts.push([mid(l.hip,l.knee),.10],[mid(l.knee,l.ankle),.04],[mid(l.shoulder,l.elbow),.014],[mid(l.elbow,l.wrist),.011],[mid(f.heel,f.toe),.015]);}
  return parts.reduce((sum,[point,weight])=>add(sum,mul(point,weight)),[0,0,0] as Vec3);
}
interface AdditionalPose {
  joints:DryJoints;feet:Record<Side,DryFoot>;hands:Record<Side,DryHand>;contacts:DryContact[];props:DryProp[];
  cameraTarget:Vec3;pelvisForward?:Vec3;pelvisRadius?:number;
}
function additionalFrame(t:number,c:DrylandConfig,task:AdditionalTask,pose:AdditionalPose,phases:DryPhase[]):DrylandFrame {
  const knee={} as Record<Side,number>;
  for(const side of SIDES){const l=pose.joints[side];knee[side]=180-angle(sub(l.hip,l.knee),sub(l.ankle,l.knee));}
  return {domain:"dryland",type:c.type as DrylandType,task,t,phase:phases.reduce((last,s,i)=>t>=s.at?i:last,0),phases,...pose,estimatedCom:estimateDryCom(pose.joints,pose.feet),metrics:{knee,maxBoneError:Math.max(...drylandBoneErrors(pose.joints,pose.feet))}};
}
function sampleCalfStretch(t:number,c:DrylandConfig):DrylandFrame {
  const rear=c.side??"left",q=pulse(t,.15,.42,.65,1),beta=rad(13+9*q);
  const feet={} as Record<Side,DryFoot>;
  for(const side of SIDES)feet[side]=movedFoot(shoe(sideSign(side),.34,0,0),[0,0,side===rear?-.20:.16]);
  const reach=(BODY.thigh+BODY.shin)*Math.cos(rad(1.5)),dx=.17-BODY.hipWidth/2,sagittal=Math.sqrt(reach*reach-dx*dx);
  const rearHip=add(feet[rear].ankle,[-sideSign(rear)*dx,sagittal*Math.cos(beta),sagittal*Math.sin(beta)]);
  const base=core(sub(rearHip,[sideSign(rear)*BODY.hipWidth/2,0,0]),[0,Math.cos(rad(10)),Math.sin(rad(10))]);
  const limbs={} as Record<Side,Limb>,hands={} as Record<Side,DryHand>,contacts:DryContact[]=[];
  for(const side of SIDES){
    const sign=sideSign(side),hip=add(base.pelvis,[sign*BODY.hipWidth/2,0,0]),shoulder=add(base.chest,[sign*BODY.shoulderWidth/2,0,0]);
    const fixed=contactHand(side+".palm",[sign*.195,1.13,.46],[0,0,-1],UP,"wall");hands[side]=fixed.hand;
    limbs[side]={hip,knee:solveTwoBone(hip,feet[side].ankle,BODY.thigh,BODY.shin,FORWARD),ankle:feet[side].ankle,shoulder,elbow:solveTwoBone(shoulder,fixed.hand.wrist,BODY.upperArm,BODY.forearm,[sign*.35,-1,-.15]),wrist:fixed.hand.wrist};
    contacts.push(...soleContacts(side,feet[side],["heel","ball","toe"],0,"floor"),fixed.contact);
  }
  const joints={...base,left:limbs.left,right:limbs.right};
  return additionalFrame(t,c,"split-calf-stretch",{joints,feet,hands,contacts,props:[{id:"floor",kind:"plane",center:[0,0,0],normal:UP,size:[3,3]},{id:"wall",kind:"plane",center:[0,.85,.46],normal:[0,0,-1],size:[1.2,1.7]}],cameraTarget:[0,.8,.08]},[
    phase(0,"扶墙分腿站稳","本次目标腿在后；两脚向前，全掌留地。"),
    phase(.15,"前膝弯，身体小幅前移","后膝接近伸直但不锁死，后跟不抬；不强推到末端。"),
    phase(.42,"舒适范围短停","后侧小腿保持温和拉伸感；动画不判断实际柔韧性。"),
    phase(.65,"退回起点，放松小腿","回到分腿准备位；另一侧应单独练习。"),
  ]);
}
function sampleHipStretch(t:number,c:DrylandConfig):DrylandFrame {
  const rear=c.side??"left",front=otherSide(rear),tuck=pulse(t,.12,.30,.78,1),move=pulse(t,.30,.52,.68,.88),alpha=rad(9*move);
  const backKnee:Vec3=[sideSign(rear)*BODY.hipWidth/2,MAT+.055,-.18],feet={} as Record<Side,DryFoot>;
  const backFoot=movedFoot(shoe(sideSign(rear),BODY.hipWidth,0,65),[0,MAT,0]);
  const backZ=backKnee[2]-Math.sqrt(BODY.shin**2-(backFoot.ankle[1]-backKnee[1])**2);
  feet[rear]=movedFoot(backFoot,[0,0,backZ-backFoot.ankle[2]]);
  feet[front]=movedFoot(shoe(sideSign(front),.34,0,0),[0,MAT,.24]);
  const backHip=add(backKnee,[0,BODY.thigh*Math.cos(alpha),BODY.thigh*Math.sin(alpha)]);
  const base=core(sub(backHip,[sideSign(rear)*BODY.hipWidth/2,0,0]),UP),limbs={} as Record<Side,Limb>,hands={} as Record<Side,DryHand>,contacts:DryContact[]=[];
  for(const side of SIDES){
    const sign=sideSign(side),hip=add(base.pelvis,[sign*BODY.hipWidth/2,0,0]),shoulder=add(base.chest,[sign*BODY.shoulderWidth/2,0,0]),arm=looseArm(shoulder,sign);hands[side]=arm.hand;
    limbs[side]={hip,knee:side===rear?backKnee:solveTwoBone(hip,feet[side].ankle,BODY.thigh,BODY.shin,FORWARD),ankle:feet[side].ankle,shoulder,elbow:arm.elbow,wrist:arm.wrist};
    contacts.push(...soleContacts(side,feet[side],side===rear?["ball","toe"]:["heel","ball","toe"],MAT,"mat"));
  }
  const kneePoint=sub(backKnee,mul(UP,.055));contacts.push({id:rear+".knee",surface:"mat",point:kneePoint,target:[kneePoint[0],MAT,kneePoint[2]],normal:UP});
  return additionalFrame(t,c,"half-kneel-hip-flexor",{joints:{...base,left:limbs.left,right:limbs.right},feet,hands,contacts,props:matProps(),cameraTarget:[0,.6,-.12],pelvisForward:[0,Math.sin(rad(4*tuck)),Math.cos(rad(4*tuck))]},[
    phase(0,"目标腿在后，膝下垫软垫","前脚踩稳，后膝与脚趾支撑；本次只示范一侧。"),
    phase(.12,"轻收骨盆","躯干保持直立，不以挺腰代替髋前侧伸展。"),
    phase(.30,"小幅前移并短停","保留轻收骨盆，在舒适范围缓慢前移；不追求大幅压髋。"),
    phase(.68,"先退回，再放松骨盆","保持前脚和后膝支点，平稳回到起点。"),
  ]);
}
function sampleHamstring(t:number,c:DrylandConfig):DrylandFrame {
  const active=c.side??"left",rest=otherSide(active),q=pulse(t,.15,.45,.60,1),alpha=rad(100),flex=rad(110-75*q),lowerAngle=alpha-flex;
  const pelvis:Vec3=[0,MAT+.13,0],chest=add(pelvis,[0,0,-BODY.trunk]),headDrop=-.025/(BODY.neck+BODY.head),neckDir:Vec3=[0,headDrop,-Math.sqrt(1-headDrop*headDrop)],neck=add(chest,mul(neckDir,BODY.neck)),head=add(neck,mul(neckDir,BODY.head));
  const femur:Vec3=[0,Math.sin(alpha),Math.cos(alpha)],lower:Vec3=[0,Math.sin(lowerAngle),Math.cos(lowerAngle)];
  const legs={} as Record<Side,{hip:Vec3;knee:Vec3;ankle:Vec3}>,feet={} as Record<Side,DryFoot>;
  for(const side of SIDES){
    const hip=add(pelvis,[sideSign(side)*BODY.hipWidth/2,0,0]);
    if(side===active){
      const knee=add(hip,mul(femur,BODY.thigh)),ankle=add(knee,mul(lower,BODY.shin));legs[side]={hip,knee,ankle};
      feet[side]=freeFoot(ankle,[0,Math.cos(lowerAngle),-Math.sin(lowerAngle)],mul(lower,-1));
    }else{
      const dy=MAT+.055-hip[1],ankle=add(hip,[0,dy,Math.sqrt((BODY.thigh+BODY.shin)**2-dy*dy)]);
      legs[side]={hip,knee:mid(hip,ankle),ankle};feet[side]=freeFoot(ankle,UP,[0,0,-1]);
    }
  }
  const held=add(legs[active].hip,mul(femur,BODY.thigh*.60)),posterior:Vec3=[0,-Math.cos(alpha),Math.sin(alpha)];
  const limbs={} as Record<Side,Limb>,hands={} as Record<Side,DryHand>,contacts:DryContact[]=[];
  for(const side of SIDES){
    const sign=sideSign(side),shoulder=add(chest,[sign*BODY.shoulderWidth/2,0,0]),radial:Vec3=[sign*.85,posterior[1]*Math.sqrt(1-.85**2),posterior[2]*Math.sqrt(1-.85**2)];
    // Fingers wrap toward the posterior centre; wrists remain lateral to the thigh.
    const along=add(mul(femur,.5),mul(cross(radial,femur),sign*Math.sqrt(.75)));
    const target=add(held,mul(radial,.07)),fixed=contactHand(side+".thigh-hold",target,radial,along,active+".thigh");hands[side]=fixed.hand;contacts.push(fixed.contact);
    const elbowAngle=rad(side===active?5:15),pole:Vec3=[sign*Math.cos(elbowAngle),Math.sin(elbowAngle),0];
    limbs[side]={...legs[side],shoulder,elbow:solveTwoBone(shoulder,fixed.hand.wrist,BODY.upperArm,BODY.forearm,pole),wrist:fixed.hand.wrist};
  }
  const back=sub(mid(pelvis,chest),mul(UP,.13)),headPoint=sub(head,mul(UP,.105));
  for(const x of [-.01,.01]){const point=add(pelvis,[x,-.13,0]);contacts.push({id:"pelvis."+x,surface:"mat",point,target:[point[0],MAT,point[2]],normal:UP});}
  contacts.push({id:"back",surface:"mat",point:back,target:[back[0],MAT,back[2]],normal:UP},{id:"head",surface:"mat",point:headPoint,target:[headPoint[0],MAT,headPoint[2]],normal:UP},...soleContacts(rest,feet[rest],["heel"],MAT,"mat"));
  return additionalFrame(t,c,"supine-hamstring",{joints:{pelvis,chest,neck,head,left:limbs.left,right:limbs.right},feet,hands,contacts,props:matProps(),cameraTarget:[0,.35,.1],pelvisRadius:.13},[
    phase(0,"仰卧，双手托住大腿后侧","本次只示范一腿；头与背有垫面支撑，另一腿舒适放下。"),
    phase(.15,"固定大腿，缓慢伸膝","手不拉小腿、不压膝；只在舒适范围主动伸直。"),
    phase(.45,"在舒适伸直范围短停","保留膝部余量；作者角度不是柔韧性达标值。"),
    phase(.60,"主动屈膝回位","双手继续托住大腿，受控返回；另一侧单独进行。"),
  ]);
}
function samplePlank(t:number,c:DrylandConfig):DrylandFrame {
  const q=pulse(t,.15,.42,.70,1),feet:Record<Side,DryFoot>={left:movedFoot(shoe(1,BODY.hipWidth,0,65),[0,MAT,0]),right:movedFoot(shoe(-1,BODY.hipWidth,0,65),[0,MAT,0])};
  const ankle=feet.left.ankle,elbowY=MAT+.032,holdShoulderY=elbowY+BODY.upperArm,total=BODY.shin+BODY.thigh+BODY.trunk;
  const uy=(holdShoulderY-ankle[1])/total,up:Vec3=[0,uy,Math.sqrt(1-uy*uy)],elbowZ=ankle[2]+total*up[2];
  const kneeY=MAT+.055+q*(ankle[1]+BODY.shin*up[1]-(MAT+.055)),kneeZ=ankle[2]+Math.sqrt(BODY.shin**2-(kneeY-ankle[1])**2);
  const pelvisAt=(d:number):Vec3=>[0,elbowY+Math.sqrt(BODY.upperArm**2-d*d)-BODY.trunk*up[1],elbowZ-d-BODY.trunk*up[2]];
  const error=(d:number)=>Math.hypot(pelvisAt(d)[1]-kneeY,pelvisAt(d)[2]-kneeZ)-BODY.thigh;
  let shift=0;
  if(q<1-1e-12){
    let lo=0,hi=.20;
    if(error(lo)<-1e-10||error(hi)>0)throw new Error("Unreachable plank closure");
    for(let i=0;i<55;i++){const m=(lo+hi)/2;if(error(m)>0)lo=m;else hi=m;}shift=(lo+hi)/2;
  }
  const base=core(pelvisAt(shift),up),limbs={} as Record<Side,Limb>,hands={} as Record<Side,DryHand>,contacts:DryContact[]=[];
  // Small hand slope: the finger-side lower edge meets the mat without sinking.
  const handAngle=Math.asin(.032/Math.hypot(.14,DRY_AUTHOR.palmHalfThickness))-Math.atan2(DRY_AUTHOR.palmHalfThickness,.14);
  const along:Vec3=[0,-Math.sin(handAngle),Math.cos(handAngle)],normal:Vec3=[0,-Math.cos(handAngle),-Math.sin(handAngle)];
  for(const side of SIDES){
    const sign=sideSign(side),shoulder=add(base.chest,[sign*BODY.shoulderWidth/2,0,0]),elbow:Vec3=[sign*BODY.shoulderWidth/2,elbowY,elbowZ],wrist=add(elbow,[0,0,BODY.forearm]);
    const palm=add(wrist,mul(along,DRY_AUTHOR.palmLength));hands[side]={wrist,palm,along,normal,halfThickness:DRY_AUTHOR.palmHalfThickness};
    const knee:Vec3=[sign*BODY.hipWidth/2,kneeY,kneeZ];limbs[side]={hip:add(base.pelvis,[sign*BODY.hipWidth/2,0,0]),knee,ankle:feet[side].ankle,shoulder,elbow,wrist};
    contacts.push(...soleContacts(side,feet[side],["ball","toe"],MAT,"mat"));
    for(const offset of [.06,.19]){const point:Vec3=[elbow[0],MAT,elbow[2]+offset];contacts.push({id:side+".forearm."+offset,surface:"mat",point,target:point,normal:UP});}
    const handPoint=add(add(palm,mul(along,DRY_AUTHOR.palmLength)),mul(normal,DRY_AUTHOR.palmHalfThickness));contacts.push({id:side+".finger-edge",surface:"mat",point:handPoint,target:[handPoint[0],MAT,handPoint[2]],normal:UP});
    if(q<1e-10){const point=sub(knee,mul(UP,.055));contacts.push({id:side+".knee",surface:"mat",point,target:[point[0],MAT,point[2]],normal:UP});}
  }
  return additionalFrame(t,c,"forearm-plank",{joints:{...base,left:limbs.left,right:limbs.right},feet,hands,contacts,props:matProps(.85,2.1),cameraTarget:[0,.35,.85]},[
    phase(0,"前臂与膝先支稳","前臂、手指边缘和脚趾留在垫上，先让前臂和膝盖支稳，调整好躯干。"),
    phase(.15,"受控抬膝并伸腿","前臂和脚趾位置不变，膝离垫；不以抬臀或塌腰代替。"),
    phase(.42,"保持前臂平板","肩、髋、踝形成近似直线，持续呼吸；不是最大憋气时长测试。"),
    phase(.70,"膝受控回垫","保留前臂支撑，缓慢回到准备位；本段不演示整身俯卧放下。"),
  ]);
}
function sampleAdditional(t:number,c:DrylandConfig,task:AdditionalTask):DrylandFrame {
  if(c.side!==undefined&&c.side!=="left"&&c.side!=="right")throw new Error("Invalid dryland side");
  switch(task){
    case "split-calf-stretch":return sampleCalfStretch(t,c);
    case "half-kneel-hip-flexor":return sampleHipStretch(t,c);
    case "supine-hamstring":return sampleHamstring(t,c);
    case "forearm-plank":return samplePlank(t,c);
  }
}
