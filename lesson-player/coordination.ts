import { applyStance, buildPose, type MotionState, type PoseOptions, type Route, type Stance, type Vec3 } from "../prototype/motion";
import type { LessonConfig, LessonFrame, Stage } from "./motion";

export type CoordinationTask = "board-coordinate-study" | "stationary-hip-rock" | "hip-transition" | "coordinated-knee-transition" | "linked-retraction-skid";
type Edge="toe"|"heel";
const rad=(x:number)=>x*Math.PI/180, PI=Math.PI;
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const ease=(x:number)=>{const u=clamp(x);return u*u*u*(10+u*(-15+6*u));};
const mix=(a:number,b:number,q:number)=>a+(b-a)*q;
const edgeSign=(e:Edge)=>e==="toe"?1:-1;
const opposite=(e:Edge):Edge=>e==="toe"?"heel":"toe";
const edgeName=(e:Edge)=>e==="toe"?"前刃":"后刃";
const pulse=(u:number,a:number,b:number,c:number,d:number)=>ease((u-a)/(b-a))*(1-ease((u-c)/(d-c)));

export function coordinationTask(c:LessonConfig):CoordinationTask|undefined {
  if(c.type==="hip-edge-change"){
    if(c.variant&&c.variant!=="open")return undefined;
    const task=c.task??(c.variant==="open"?"board-coordinate-study":undefined);
    if(c.variant==="open"&&task!=="board-coordinate-study")return undefined;
    if(["board-coordinate-study","stationary-hip-rock","hip-transition"].includes(task??""))return task as CoordinationTask;
    return undefined;
  }
  if(c.type==="knee-edge-change"&&!c.variant&&c.task==="coordinated-knee-transition")return "coordinated-knee-transition";
  if(c.type==="retraction-turns"&&!c.variant&&c.task==="linked-retraction-skid")return "linked-retraction-skid";
}
export const supportsCoordinationLesson=(c:LessonConfig)=>coordinationTask(c)!==undefined;
const staticTask=(task:CoordinationTask)=>task==="board-coordinate-study"||task==="stationary-hip-rock";
function route(position:Vec3,travel:Vec3,yaw:number,roll:number,u:number,from:Edge):Route{
  return {position,travel,yaw,roll,edgeLoad:Math.abs(roll)/rad(26),phase:0,half:from==="toe"?1:0,progress:u,holding:false,lean:roll/rad(26),extension:0,braking:0};
}
const meanLegLength=(s:MotionState)=>(
  Math.hypot(...s.joints.frontHip.map((v,i)=>v-s.joints.frontAnkle[i]))+
  Math.hypot(...s.joints.rearHip.map((v,i)=>v-s.joints.rearAnkle[i]))
)/2;

function staticState(t:number,task:CoordinationTask):MotionState {
  const half=t<.5?0:1,u=t===1?1:t*2-half,s=half===0?1:-1;
  const shift=pulse(u,0,.22,.78,1),edge=pulse(u,.22,.42,.58,.78);
  const roll=s*rad(3)*edge;
  // Rotate about the fixed ground edge, after transferring within flat support.
  const z=s*.1325*(1-Math.cos(roll))+.013*Math.sin(roll);
  const r=route([0,0,z],[0,0,0],0,roll,u,s>0?"toe":"heel");
  const open=task==="board-coordinate-study";
  const base:PoseOptions={
    cuffPitch:14+(s>0?4:-2)*shift,rearCuffPitch:14+(s>0?4:-2)*shift,
    legBend:34+(s>0?-10:22)*shift,hipYaw:open?.2:.05,shoulderYaw:open?.5:.12,
    lookDirection:[0,0,1],
  };
  const target=s*.1325*shift;
  const at=(pitch:number)=>buildPose(r,"correct",{...base,torsoPitch:pitch});
  let lo=-.3,hi=.85;
  if(at(lo).com[2]>target||at(hi).com[2]<target)throw new Error("原地支撑需要重新编排，不能借动态内倾");
  for(let i=0;i<32;i++){const m=(lo+hi)/2;if(at(m).com[2]<target)lo=m;else hi=m;}
  const result=at((lo+hi)/2);
  result.metrics.skidAngle=0;result.half=half===0?0:1;
  return result;
}
function edgeWave(u:number){
  const w=Math.cos(PI*u),e=.12;
  return (1+e*e)*w*w*w/(w*w+e*e);
}
type MotionGeometry={r:Route;heading:number;u:number;from:Edge;halfIndex:number};
function dynamicGeometry(t:number,task:CoordinationTask,initial:Edge):MotionGeometry{
  const linked=task==="linked-retraction-skid";
  const halfIndex=linked?(t<.5?0:1):0,u=linked?(t===1?1:t*2-halfIndex):t;
  const from=halfIndex===0?initial:opposite(initial),s=edgeSign(from);
  const a=linked?.35:.9,length=linked?3.2:4.4,maxRoll=linked?26:13;
  const originX=halfIndex===0?0:-2*edgeSign(initial)*a;
  const dx=-s*a*PI*Math.sin(PI*u),heading=Math.atan2(dx,length);
  const roll=s*rad(maxRoll)*edgeWave(u);
  const yaw=heading-PI/2-s*rad(linked?6:7)*Math.cos(PI*u);
  const position:Vec3=[originX+s*a*(Math.cos(PI*u)-1),0,(halfIndex+u)*length];
  return {r:route(position,[Math.sin(heading),0,Math.cos(heading)],yaw,roll,u,from),heading,u,from,halfIndex};
}
function dynamicPose(g:MotionGeometry,bend:number,task:CoordinationTask):PoseOptions{
  const toe=Math.max(0,g.r.roll/rad(26)),heel=Math.max(0,-g.r.roll/rad(26));
  return {
    cuffPitch:14+4*toe-2*heel,rearCuffPitch:14+4*toe-2*heel,legBend:bend,
    hipYaw:g.r.yaw+rad(6),
    shoulderYaw:task==="linked-retraction-skid"?-PI/2+.28+.2*g.heading:g.r.yaw+.3,
    torsoPitch:.14+.012*(bend-32)+.2*heel-.25*toe,
    lookDirection:[Math.sin(g.heading),0,Math.cos(g.heading)],
  };
}
function shortening(u:number){return pulse(u,.1,.48,.53,.94);}
const targets=new Map<string,{first:number;middle:number;last:number}>();
function lengthTargets(task:CoordinationTask,from:Edge){
  const key=task+":"+from,found=targets.get(key);if(found)return found;
  const sample=(u:number,b:number)=>{
    const g=dynamicGeometry(task==="linked-retraction-skid"?u*.5:u,task,from);
    return meanLegLength(buildPose(g.r,"correct",dynamicPose(g,b,task)));
  };
  const startBend=task==="hip-transition"?44:task==="coordinated-knee-transition"?34:32;
  const middleBend=task==="hip-transition"?30:task==="coordinated-knee-transition"?56:52;
  const foundTarget={first:sample(0,startBend),middle:sample(.5,middleBend),last:sample(1,startBend)};
  targets.set(key,foundTarget);return foundTarget;
}
function dynamicState(t:number,task:CoordinationTask,from:Edge):MotionState{
  const g=dynamicGeometry(t,task,from),q=shortening(g.u),endpoints=lengthTargets(task,g.from);
  const target=mix(g.u<=.5?endpoints.first:endpoints.last,endpoints.middle,q);
  const at=(bend:number)=>buildPose(g.r,"correct",dynamicPose(g,bend,task));
  let lo=20,hi=80;
  if(meanLegLength(at(lo))<target||meanLegLength(at(hi))>target)throw new Error("换刃腿长超出可达范围");
  for(let i=0;i<32;i++){const m=(lo+hi)/2;if(meanLegLength(at(m))>target)lo=m;else hi=m;}
  return at((lo+hi)/2);
}
const events=new Map<string,{flatEnter:number;flatLeave:number}>();
function edgeEvents(task:CoordinationTask,from:Edge){
  const key=task+":"+from,old=events.get(key);if(old)return old;
  const sample=(u:number)=>dynamicState(task==="linked-retraction-skid"?u*.5:u,task,from).edge;
  if(sample(0)!==from||sample(.5)!=="flat"||sample(1)!==opposite(from))throw new Error("实际换刃事件与起止刃不一致");
  let lo=0,hi=.5;
  for(let i=0;i<36;i++){const m=(lo+hi)/2;if(sample(m)===from)lo=m;else hi=m;}
  const flatEnter=hi;lo=.5;hi=1;
  for(let i=0;i<36;i++){const m=(lo+hi)/2;if(sample(m)===opposite(from))hi=m;else lo=m;}
  const result={flatEnter,flatLeave:hi};events.set(key,result);return result;
}
function staticStages(task:CoordinationTask):Stage[]{
  const prefix=task==="board-coordinate-study"?"上身可以自然略朝板头，先分清沿板头板尾的方向与沿脚尖脚跟的方向。":"重点观察髋部，脚踝与膝盖仍要一起配合。";
  return [
    {at:0,title:"放平雪板，先调整身体位置",detail:prefix+"此段原地练习；先在平板支撑范围内调整，再立小刃。"},
    {at:.11,title:"逐渐建立小幅前刃",detail:"双脚固定，小腿、膝与髋协调；图中估算的整体重心落在当前支撑刃上方，不能只把上身扑向前方。"},
    {at:.29,title:"先落回平板，再回中",detail:"先把远侧板刃受控放回地面，再恢复两脚间可调位置，不从一侧直接弹到另一侧。"},
    {at:.5,title:"平板内向另一侧调整",detail:"分清脚跟侧与板尾；沿板长位置仍可控，不锁膝或用腰硬顶。"},
    {at:.61,title:"逐渐建立小幅后刃",detail:"膝髋协调屈曲、靴内脚位保持，高背关系可见；这不是滑行中的大角度后刃。"},
    {at:.79,title:"先落回平板，再恢复",detail:"先落回平板，再恢复舒适站姿。本段没有演示随后的单弯与滑行验证。"},
  ];
}
function oneTransitionStages(task:CoordinationTask,from:Edge):Stage[]{
  const to=opposite(from),e=edgeEvents(task,from),hip=task==="hip-transition",linked=task==="linked-retraction-skid";
  return [
    {at:0,title:"旧"+edgeName(from)+"仍可控",detail:hip?"观察髋部在脚尖、脚跟两侧的位置；踝膝保持活动，不把髋当作独立发动机。":"旧弯中双腿仍能继续屈曲，先完成原弧线，不靠甩肩抢换侧。"},
    {at:.1,title:hip?"减旧刃、髋随两腿回中":linked?"换刃前协调回收":"膝踝髋共同释放",detail:hip?"本例用温和伸展帮助调整；伸腿不是压力归零，不要向后脚方向坐到板尾。":linked?"实际髋到踝距离缩短；板沿路线向身下靠近，躯干允许自然运动，不锁死胸部。":"用自然膝轨迹观察屈腿与减刃的配合；不要只扭膝盖带动雪板，也不夹膝。"},
    {at:e.flatEnter,title:"连续经过近平板",detail:"双脚留在固定器内；低刃角阶段仍贴雪、仍可能有板雪作用，不停住等换刃。"},
    {at:e.flatLeave,title:"渐进建立"+edgeName(to),detail:to==="toe"?"膝与髋共同进入脚尖侧，胸部不抢先扑入，前后腿继续有序带板。":"骨盆进入脚跟侧，膝髋共同折叠，胸部适量移回雪板上方；不靠大幅折踝完成后刃。"},
    {at:.53,title:hip?"新弯继续屈腿引导":"进入新弯，逐渐伸腿",detail:hip?"新弧线仍有可控滑移，髋膝与上身保持能继续调整的关系。":"双腿逐渐伸展，继续引导弧线和滑移；不是踢后脚，也不是全程最低位。"},
    {at:.94,title:"接续"+edgeName(to)+"弧线",detail:"本段结束仍在滑行，保留下一次调整余量；不表示已经停止。"},
  ];
}
function stagesFor(task:CoordinationTask,from:Edge):Stage[]{
  if(staticTask(task))return staticStages(task);
  if(task!=="linked-retraction-skid")return oneTransitionStages(task,from);
  return [from,opposite(from)].flatMap((edge,i)=>oneTransitionStages(task,edge).map(s=>({...s,at:(i+s.at)/2})));
}
export function sampleCoordinationLesson(time:number,c:LessonConfig,stance:Stance="regular"):LessonFrame{
  const t=clamp(Number.isFinite(time)?time:0),task=coordinationTask(c);
  if(!task)throw new Error("需要明确髋膝回收任务，不能按类型套用");
  const from=c.fromEdge??"heel",stages=stagesFor(task,from),stage=stages.reduce((n,s,i)=>t>=s.at?i:n,0);
  const raw=staticTask(task)?staticState(t,task):dynamicState(t,task,from),state=applyStance(raw,stance);
  state.phase=Math.min(3,stage) as 0|1|2|3;state.phaseName=stages[stage].title;state.turnProgress=t;
  if(t===1&&staticTask(task)){
    stages[stage]={...stages[stage],title:"已回平板与舒适站姿",detail:"两侧小幅动作均已结束；原地能力还需另用实际单弯和连弯验证。"};
    state.phaseName=stages[stage].title;
  }
  return {state,stage,stages,task,moving:!staticTask(task)};
}
