import {applyStance, buildPose, type MotionState, type PoseOptions, type Route, type Stance} from "../prototype/motion";
import type {LessonConfig, LessonFrame, Stage} from "./motion";

type Task = "expert-run-recovery" | "expert-steering-range";
type Edge = "toe" | "heel";
type CorridorSection = {width:number;start:number;end:number;label:string};
type SequenceFrame = LessonFrame & {corridorSections:CorridorSection[];routeWindow:{start:number;end:number}};
const PI=Math.PI,rad=(v:number)=>v*PI/180,clamp=(v:number)=>Math.max(0,Math.min(1,v));
const count=8,opposite=(e:Edge):Edge=>e==="toe"?"heel":"toe",edgeName=(e:Edge)=>e==="toe"?"前刃":"后刃";
const variants:Record<Task,readonly string[]>={
  "expert-run-recovery":["planned-recovery"],
  "expert-steering-range":["guided-slide","edge-guided"],
};
export function supportsExpertShortSequenceLesson(c:LessonConfig):boolean {
  return c.type==="expert-short-sequence"&&Object.hasOwn(variants,c.task??"")
    &&variants[c.task as Task].includes(c.variant??"")
    &&c.transition===undefined&&c.posture===undefined&&c.turnShape===undefined
    &&(c.fromEdge===undefined||c.fromEdge==="toe"||c.fromEdge==="heel");
}
export function expertShortSequenceDurationMs(c:LessonConfig):number {
  return Math.max(12000,c.duration??(c.task==="expert-run-recovery"?24000:28000));
}
export function expertShortSequenceVariants(c:LessonConfig) {
  if(!supportsExpertShortSequenceLesson(c))throw new Error("尚未实现的专家短弯完整滑段组合");
  return c.task==="expert-run-recovery"
    ?[{value:"planned-recovery",label:"宽弧入段—短弯—主动恢复"}]
    :[{value:"guided-slide",label:"策略：较多可控滑移"},{value:"edge-guided",label:"策略：较多刃引导"}];
}

// Finite route authored in turn phase p. These values are demonstration
// geometry and observation time, not measured expert speed or snow forces.
// The C3 profile and its integral also keep curvature-driven edge velocity
// continuous at the boundaries between the three authored route sections.
function change(p:number,start:number,end:number) {
  const span=end-start,u=clamp((p-start)/span);
  const value=u**4*(35+u*(-84+u*(70-20*u)));
  return {
    value,
    first:p<=start||p>=end?0:140*u**3*(1-u)**3/span,
    second:p<=start||p>=end?0:420*u*u*(1-u)**2*(1-2*u)/(span*span),
    integral:p<=start?0:p>=end?p-(start+end)/2:span*(7*u**5-14*u**6+10*u**7-2.5*u**8),
  };
}
function routeProfile(p:number) {
  const enter=change(p,.25,2),recover=change(p,6,7.75);
  return {
    a:1.52+(.78-1.52)*enter.value+(1.72-.78)*recover.value,
    da:(.78-1.52)*enter.first+(1.72-.78)*recover.first,
    dda:(.78-1.52)*enter.second+(1.72-.78)*recover.second,
    d:5.4+(3.6-5.4)*enter.value+(5.8-3.6)*recover.value,
    dd:(3.6-5.4)*enter.first+(5.8-3.6)*recover.first,
    z:5.4*p+(3.6-5.4)*enter.integral+(5.8-3.6)*recover.integral,
    narrow:enter.value-recover.value,
  };
}
const sections:CorridorSection[]=[
  {width:4.8,start:0,end:routeProfile(2).z,label:"较宽入段 · 作者练习区段"},
  {width:2.5,start:routeProfile(2).z,end:routeProfile(6).z,label:"短弯稳定段 · 2.5米示意通道"},
  {width:5.2,start:routeProfile(6).z,end:routeProfile(count).z,label:"主动回宽恢复 · 作者练习区段"},
];
const wave=(w:number)=>w*w*w*(1+.12*.12)/(w*w+.12*.12);
function geometry(t:number,c:LessonConfig) {
  const p=t*count,profile=routeProfile(p),initial=c.fromEdge??"heel",sign=initial==="toe"?1:-1;
  const cos=Math.cos(PI*p),sin=Math.sin(PI*p);
  const x=sign*profile.a*cos,dx=sign*(profile.da*cos-profile.a*PI*sin);
  const ddx=sign*(profile.dda*cos-2*profile.da*PI*sin-profile.a*PI*PI*cos);
  const heading=Math.atan2(dx,profile.d);
  const headingDerivative=(profile.d*ddx-dx*profile.dd)/(dx*dx+profile.d*profile.d);
  // Edge/slip follow the real route's turn direction, including A'(p), A''(p)
  // and D'(p). A scaled old cosine would change edge on the wrong side in ramps.
  const bendDirection=-headingDerivative/(profile.a*PI*PI/profile.d);
  const curve=Math.tanh(1.4*bendDirection)/Math.tanh(1.4),turn=wave(curve);
  const range=c.task==="expert-steering-range",edgeGuided=range&&c.variant==="edge-guided";
  const edgeDegrees=edgeGuided?25:range?17:21,slipDegrees=edgeGuided?4:range?15:10;
  const roll=rad(edgeDegrees)*turn,slip=rad(slipDegrees)*turn;
  const index=Math.min(count-1,Math.floor(p)),u=t===1?1:p-index;
  const from=index%2?opposite(initial):initial;
  const q=sin*sin;
  // Independent movement phase: do not derive leg length from edge magnitude.
  // These are coordinated strategies, not a one-variable pressure experiment.
  const shortChange=edgeGuided?-.035:range?.013:-.022;
  const targetLength=.785+(1-profile.narrow)*.018*q+profile.narrow*shortChange*q;
  const r:Route={position:[x,0,profile.z],travel:[Math.sin(heading),0,Math.cos(heading)],yaw:heading-PI/2-slip,roll,
    edgeLoad:Math.abs(roll)/rad(edgeDegrees),phase:0,half:from==="toe"?0:1,progress:u,holding:false,lean:roll/rad(edgeDegrees),extension:0,braking:0};
  return {r,heading,targetLength,index,from};
}
const meanLength=(s:MotionState)=>(Math.hypot(...s.joints.frontHip.map((v,i)=>v-s.joints.frontAnkle[i]))+Math.hypot(...s.joints.rearHip.map((v,i)=>v-s.joints.rearAnkle[i])))/2;
function regularState(t:number,c:LessonConfig):MotionState {
  const g=geometry(t,c),toe=Math.max(0,g.r.lean),heel=Math.max(0,-g.r.lean);
  const pose=(bend:number):PoseOptions=>({
    cuffPitch:14+3.5*toe-1.8*heel,rearCuffPitch:14+3.5*toe-1.8*heel,legBend:bend,
    hipYaw:g.r.yaw+.10,shoulderYaw:-PI/2+.24+.30*g.heading+.10*(g.r.yaw-(g.heading-PI/2)),
    torsoPitch:.14+.009*(bend-32)+.22*heel-.24*toe,lookDirection:g.r.travel,
  });
  const at=(bend:number)=>buildPose(g.r,"correct",pose(bend));
  let lo=20,hi=80;
  if(meanLength(at(lo))<g.targetLength||meanLength(at(hi))>g.targetLength)throw new Error("完整短弯示意腿长超出可达范围");
  for(let i=0;i<30;i++){const m=(lo+hi)/2;if(meanLength(at(m))>g.targetLength)lo=m;else hi=m;}
  const state=at((lo+hi)/2),a=state.joints.frontShoulder,b=state.joints.rearShoulder;
  const shoulder=Math.atan2(-(a[2]-b[2]),a[0]-b[0]);
  const requested=Math.atan2(Math.sin(g.heading-shoulder),Math.cos(g.heading-shoulder));
  const magnitude=Math.abs(requested),q=clamp((magnitude-rad(45))/rad(30));
  const gazeTurn=magnitude<=rad(45)?magnitude:rad(45)+rad(30)*(q-q*q/2),heading=shoulder+Math.sign(requested)*gazeTurn;
  state.gaze=[Math.sin(heading),0,Math.cos(heading)];
  return state;
}
const stageCache=new Map<string,Stage[]>();
function stagesFor(c:LessonConfig):Stage[] {
  const key=[c.task,c.variant,c.fromEdge].join(":"),cached=stageCache.get(key);if(cached)return cached;
  const stages:Stage[]=[],initial=c.fromEdge??"heel";
  for(let i=0;i<count;i++){
    const from=i%2?opposite(initial):initial,to=opposite(from),at=(u:number)=>(i+u)/count;
    let lo=0,hi=1;
    for(let n=0;n<45;n++){const m=(lo+hi)/2;if(Math.sign(geometry(at(m),c).r.roll)===(from==="toe"?1:-1))lo=m;else hi=m;}
    const zero=(lo+hi)/2;
    lo=0;hi=zero;
    for(let n=0;n<45;n++){const m=(lo+hi)/2;if(Math.abs(geometry(at(m),c).r.roll)>=.008)lo=m;else hi=m;}
    const enter=hi+1e-8;
    lo=zero;hi=1;
    for(let n=0;n<45;n++){const m=(lo+hi)/2;if(Math.abs(geometry(at(m),c).r.roll)<.008)lo=m;else hi=m;}
    const leave=hi+1e-8;
    const region=i<2?"较宽入段":i<6?"短弯稳定段":"主动回宽恢复";
    const strategy=c.task==="expert-run-recovery"?"比较入口、中段与恢复，身体仍可调；不是把同一两弯机械重复当作完整任务。":c.variant==="guided-slide"?"本策略保留较多板轴与移动方向夹角，配合较缓的立刃和腿长组织；可控滑移不是错误。":"本策略减小板轴与移动方向夹角，配合更多立刃与另一种腿长组织；它不是对所有雪面更优的模板。";
    stages.push(
      {at:at(0),title:i===0?"较宽弧线入段 · 已在滑行":i===2?"建立短弯稳定段":i===6?"主动放宽，恢复出口选择":`${region} · ${edgeName(from)}继续引导`,detail:strategy+" 灰线为固定世界区段参照；中段2.5米取自官方范围，入口和恢复宽度是作者编排。"},
      {at:at(enter),title:`${region} · ${edgeName(from)}进入近平板`,detail:"按实际曲线路向和板角标出释放；改变弧线尺度时事件会相应移动。低刃角不等于零压力，也不在这里停住。"},
      {at:at(leave),title:`${region} · 接上${edgeName(to)}`,detail:i>=6?"新弧实际比稳定段更宽，腿髋继续组织两侧转换；这是主动恢复路线，不是假定疲劳或雪况已被模拟。":"两腿与骨盆跨侧，前后刃分别组织胸廓；板轴、移动方向与实际路线同时观察，不以更少滑移判优劣。"},
    );
  }
  stages.push({at:1,replay:{from:6/8,label:"主动回宽恢复完整段"},title:"已回宽，仍在滑行 · 本次示意结束",detail:"末态保留较宽弧和继续选择出口的能力，没有演示停车。播放循环是重新观看这一有限滑段，不是末态无缝接回入口；雪上仍须在预留区域用已掌握方式结束。"});
  stageCache.set(key,stages);return stages;
}
export function sampleExpertShortSequenceLesson(time:number,c:LessonConfig,stance:Stance="regular"):SequenceFrame {
  if(!supportsExpertShortSequenceLesson(c))throw new Error("尚未实现的专家短弯完整滑段组合");
  const t=clamp(Number.isFinite(time)?time:0),stages=stagesFor(c),stage=stages.reduce((n,s,i)=>t>=s.at?i:n,0);
  const state=applyStance(regularState(t,c),stance);
  state.phase=Math.min(3,stage) as 0|1|2|3;state.phaseName=stages[stage].title;state.turnProgress=t;
  const index=geometry(t,c).index;
  const routeWindow={start:routeProfile(Math.max(0,index-1)).z,end:routeProfile(Math.min(count,index+1)).z};
  return {state,stage,stages,task:c.task!,moving:true,corridorSections:sections,routeWindow};
}
