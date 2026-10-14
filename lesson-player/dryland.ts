import { BODY, type Vec3 } from "../prototype/motion";
import registry from "./registry.json";

/** Ordinary shoes, metres: +x subject's left, +y up, +z forward.
 * Authoring parameters and segment weights are not measured motion or clinical ROM.
 * This rig is independent of the snowboard and boot constraints. */
export const DRYLAND_TYPES=["dry-squat","dry-calf-raise","dry-wall-edge","dry-shoulder-rolls","dry-plank","ankle-mobility","hip-mobility","dry-hamstring"] as const;
export type DrylandType=typeof DRYLAND_TYPES[number];
export type Side="left"|"right";
export type StandingTask="bodyweight-squat"|"supported-shallow-squat"|"shallow-hold"|"warmup-shallow"|"shoe-knee-baseline"|"bilateral-calf-raise"|"bilateral-ankle-rock"|"shoulder-rolls";
export type DeferredTask="forearm-plank"|"split-calf-stretch"|"half-kneel-hip-flexor"|"supine-hamstring";
export interface DrylandConfig {type:string;task?:string;variant?:string}
export interface DryPhase {at:number;title:string;detail:string}
export interface Limb {hip:Vec3;knee:Vec3;ankle:Vec3;shoulder:Vec3;elbow:Vec3;wrist:Vec3}
export interface DryJoints {pelvis:Vec3;chest:Vec3;neck:Vec3;head:Vec3;left:Limb;right:Limb}
export interface DryFoot {
  ankle:Vec3;
  /** Sole-surface points, not mesh centres. Rear shoe rotates around ball. */
  heel:Vec3;ball:Vec3;toe:Vec3;forward:Vec3;
  /** Right-handed shoe-box transverse axis, not anatomical right. */right:Vec3;
  rearForward:Vec3;rearUp:Vec3;
  width:number;soleThickness:number;heelLift:number;
}
export interface DryHand {wrist:Vec3;palm:Vec3;along:Vec3;/** From palm toward contact surface. */normal:Vec3;halfThickness:number}
export interface DryContact {id:string;surface:string;point:Vec3;target:Vec3;/** Surface normal toward person. */normal:Vec3}
export type DryProp={id:string;kind:"plane";center:Vec3;normal:Vec3;size:[number,number]}|{id:string;kind:"bar";a:Vec3;b:Vec3;radius:number}|{id:string;kind:"box";center:Vec3;size:Vec3};
export interface DrylandFrame {
  domain:"dryland";type:DrylandType;task:StandingTask;t:number;phase:number;phases:DryPhase[];
  joints:DryJoints;feet:Record<Side,DryFoot>;hands:Record<Side,DryHand>;contacts:DryContact[];props:DryProp[];
  /** Coarse authoring diagnostic, not measured COM or pressure. */estimatedCom:Vec3;
  metrics:{knee:Record<Side,number>;maxBoneError:number};
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
const ALLOWED:Record<string,readonly StandingTask[]>={
  "dry-squat":["bodyweight-squat","supported-shallow-squat","shallow-hold","warmup-shallow","shoe-knee-baseline"],
  "dry-calf-raise":["bilateral-calf-raise"],"dry-wall-edge":["bilateral-ankle-rock"],"dry-shoulder-rolls":["shoulder-rolls"],
};
export function drylandCapability(type:string):"standing"|"deferred"|null {
  if(Object.hasOwn(ALLOWED,type))return "standing";
  return (DRYLAND_TYPES as readonly string[]).includes(type)?"deferred":null;
}
export const canRenderDryland=(c:DrylandConfig)=>(registry.drylandTypes as string[]).includes(c.type)&&drylandCapability(c.type)==="standing";
export function drylandTask(c:DrylandConfig):StandingTask {
  const allowed=Object.hasOwn(ALLOWED,c.type)?ALLOWED[c.type]:undefined;
  if(!allowed)throw new Error("Dryland task not implemented: "+c.type);
  const task=c.task??(c.type==="dry-squat"&&c.variant==="hold"?"shallow-hold":allowed[0]);
  if(!allowed.includes(task as StandingTask))throw new Error("Invalid dryland task: "+task);
  return task as StandingTask;
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
  return {ankle,heel,ball,toe:add(ball,mul(forward,DRY_AUTHOR.ballToToe)),forward,right,rearForward,rearUp,width:DRY_AUTHOR.shoeWidth,soleThickness:DRY_AUTHOR.soleThickness,heelLift:heel[1]};
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
    phase(.12,"向前绕肩","肩带作小圈，手臂自然轻动，不抡整条手臂。"),
    phase(.49,"向后绕肩","反向小幅绕动，躯干和头颈基本安定。"),
    phase(.86,"恢复放松","回到起点，保持呼吸；不是雪上转弯动作。"),
  ];
  const hold=task==="shallow-hold",supported=task==="supported-shallow-squat";
  return [
    phase(0,task==="shoe-knee-baseline"?"普通鞋地面基线":"普通鞋站稳",task==="shoe-knee-baseline"?"只展示普通鞋小幅屈伸；穿靴扣板复查需要另一任务。":supported?"双手轻扶稳椅，脚掌踩稳。":"舒适站距，全脚掌接地。"),
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
