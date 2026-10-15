import { applyStance, buildPose, sampleMotion, type MotionState, type Route, type Stance } from "../prototype/motion";
import type { LessonConfig, LessonFrame, Stage } from "./motion";

type WorkingEdge = "toe" | "heel";
type PressureTask = "pressure-phase-study" | "single-transition";
const clamp = (v:number) => Math.max(0,Math.min(1,v));
const ease = (v:number) => { const u=clamp(v); return u*u*u*(10+u*(-15+6*u)); };
const nameOf = (edge:WorkingEdge) => edge==="toe"?"前刃":"后刃";

/** Keep partial-type admission aligned with registry.partialVariants. */
export function supportsPressureLesson(c:LessonConfig):boolean {
  return c.type==="pressure-flex"||c.type==="pressure-extend" ? c.variant==="phase-study" : c.type==="edge-change-up";
}
export function pressureLessonTask(c:LessonConfig):PressureTask {
  if(!supportsPressureLesson(c)) throw new Error("此压力任务尚未接入三维");
  return c.type==="edge-change-up"?"single-transition":"pressure-phase-study";
}

/** Flat-ground authoring example, not measured joint or force data. */
function stationaryPose(flex:number,stance:Stance):MotionState {
  const p=clamp(flex);
  const route:Route={position:[0,0,0],travel:[0,0,0],yaw:0,roll:0,edgeLoad:0,phase:0,half:0,progress:0,holding:false,lean:0,extension:0,braking:0};
  const state=applyStance(buildPose(route,"correct",{
    cuffPitch:14+2*p,rearCuffPitch:14+2*p,legBend:32+18*p,
    hipYaw:.05,shoulderYaw:.09,torsoPitch:.14+.32*p,
    lookDirection:[Math.sin(.09),0,Math.cos(.09)],
  }),stance);
  state.metrics.skidAngle=0;
  return state;
}
function studyFlex(t:number,extending:boolean):number {
  const end=extending?.32:.38,first=extending?1:0,last=1-first;
  if(t<end)return first+(last-first)*ease(t/end);
  if(t<.65)return last;
  return last+(first-last)*ease((t-.65)/.35);
}

// COM height is nonlinear in joint parameters. Locate the speed peak from the
// actual height, rather than labelling the joint envelope midpoint as deceleration.
// This identifies a motion phase; it does not estimate force.
const studyEvents=new Map<boolean,number>();
function studySpeedPeak(extending:boolean):number {
  const cached=studyEvents.get(extending);if(cached!==undefined)return cached;
  const end=extending?.32:.38,h=end*1e-4;
  const height=(t:number)=>stationaryPose(studyFlex(t,extending),"regular").com[1];
  const acceleration=(t:number)=>(height(t+h)-2*height(t)+height(t-h))/(h*h);
  const sign=extending?1:-1;let lo=end*.03,hi=end*.97;
  if(acceleration(lo)*sign<=0||acceleration(hi)*sign>=0)throw new Error("原地屈伸阶段已改变，需要重新核验质心运动");
  for(let i=0;i<35;i++){const mid=(lo+hi)/2;if(acceleration(mid)*sign>0)lo=mid;else hi=mid;}
  const result=(lo+hi)/2;studyEvents.set(extending,result);return result;
}
function phaseStudy(t:number,c:LessonConfig,stance:Stance):LessonFrame {
  const extending=c.type==="pressure-extend",end=extending?.32:.38;
  const stages:Stage[]=[
    {at:0,title:extending?"开始上升":"开始下降",detail:extending?"平地平板示意：踝膝髋协调伸展，向上加速的阶段可暂时增加支撑力；不锁膝。":"平地平板示意：踝膝髋协调屈曲，向下加速的阶段可暂时减轻支撑力；不只折腰。"},
    {at:studySpeedPeak(extending),title:extending?"减速收住上升":"减速收住下降",detail:extending?"上升仍在继续，但速度逐渐降低；仅看这个上下动作，它会暂时减轻脚下的支撑力。":"下降仍在继续，但速度逐渐降低；仅看这个上下动作，它会暂时增加脚下的支撑力。"},
    {at:end,title:extending?"高位保持":"低位保持",detail:"高度保持不变后，就没有这次上下加速带来的压力变化。曲线按身体各部分的位置估算整体重心（质心）的高度，不是压力曲线；真实雪上还受弯形、坡度与地形影响。"},
    {at:.65,title:"平顺恢复起始位置",detail:"受控恢复到起始的舒适屈曲关系，仍保留活动余量；本段不解释恢复过程的压力变化。"},
  ];
  const stage=stages.reduce((last,s,i)=>t>=s.at?i:last,0);
  const state=stationaryPose(studyFlex(t,extending),stance);
  state.phase=stage as 0|1|2|3;state.turnProgress=t;
  if(t===1)stages[stage]={...stages[stage],title:"已恢复起始位置",detail:"本次原地屈伸已经结束；双脚和雪板位置保持，关节仍可继续调整。"};
  state.phaseName=stages[stage].title;
  return {state,stage,stages,task:"pressure-phase-study",moving:false};
}
function transitionState(t:number,from:WorkingEdge,stance:Stance):MotionState {
  return sampleMotion((from==="toe"?.34:.84)+.5*t,"correct",stance);
}
const transitionEvents=new Map<WorkingEdge,{enter:number;leave:number}>();
function edgeEvents(from:WorkingEdge) {
  const cached=transitionEvents.get(from);if(cached)return cached;
  const edge=(t:number)=>transitionState(t,from,"regular").edge;
  const to:WorkingEdge=from==="toe"?"heel":"toe";
  if(edge(0)!==from||edge(.5)!=="flat"||edge(1)!==to)throw new Error("原型转换窗口已改变，需要重新核验起止刃");
  let lo=0,hi=.5;
  for(let i=0;i<36;i++){const mid=(lo+hi)/2;if(edge(mid)===from)lo=mid;else hi=mid;}
  const enter=hi;lo=.5;hi=1;
  for(let i=0;i<36;i++){const mid=(lo+hi)/2;if(edge(mid)===to)hi=mid;else lo=mid;}
  const result={enter,leave:hi};transitionEvents.set(from,result);return result;
}
function singleTransition(t:number,c:LessonConfig,stance:Stance):LessonFrame {
  const from:WorkingEdge=c.fromEdge??"heel",to:WorkingEdge=from==="toe"?"heel":"toe",events=edgeEvents(from);
  const stages:Stage[]=[
    {at:0,title:`释放${nameOf(from)}、适量伸展`,detail:"从旧弯的可控支撑开始，适量伸膝并减小旧刃角；同时调整髋与胸部关系，伸展启动不等于立即减压。本段只选用温和伸展过渡。"},
    {at:events.enter,title:"经过近平板位置",detail:"板角已经很小并连续经过平板；身体与板重新接近可调整的关系，不停顿，也不代表零压力。"},
    {at:events.leave,title:`新${nameOf(to)}逐渐建立`,detail:to==="toe"?"膝与髋共同进入脚尖侧，胸部相对下肢更直立；不把前肩先扑进弯内。":"膝髋共同折叠，骨盆进入脚跟侧，胸部相对骨盆更靠近雪板上方；不靠大幅折踝完成后刃。"},
    {at:.8,title:`接续${nameOf(to)}弧线`,detail:"在新弯继续柔和屈腿并保持调整余量。这是滑行片段的结束，不是停车；仍按计划继续或另行结束。"},
  ];
  const stage=stages.reduce((last,s,i)=>t>=s.at?i:last,0),state=transitionState(t,from,stance);
  state.phase=t<events.enter?0:t<events.leave?1:t<.8?2:3;
  state.phaseName=stages[stage].title;state.half=to==="toe"?0:1;state.turnProgress=t;
  return {state,stage,stages,task:"single-transition",moving:true};
}
export function samplePressureLesson(time:number,c:LessonConfig,stance:Stance="regular"):LessonFrame {
  const t=clamp(Number.isFinite(time)?time:0);
  return pressureLessonTask(c)==="pressure-phase-study"?phaseStudy(t,c,stance):singleTransition(t,c,stance);
}
