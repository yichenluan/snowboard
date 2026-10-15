import {applyStance, buildPose, type MotionState, type PoseOptions, type Route, type Stance, type Vec3} from "../prototype/motion";
import type {LessonConfig, LessonFrame, Stage} from "./motion";

export type ExpertCarvingTask = "expert-carve-arc" | "expert-carve-release" | "expert-carve-adaptation";
const variants:Record<ExpertCarvingTask, readonly string[]> = {
  "expert-carve-arc":["linked"],
  "expert-carve-release":["coordinated","late-flex"],
  "expert-carve-adaptation":["normal","lower-recover"],
};
const PI=Math.PI, rad=(n:number)=>n*PI/180, clamp=(n:number)=>Math.max(0,Math.min(1,n));
const arcs=6, arcAdvance=12, lateral=4, peakRoll=rad(28);
// An authored 10 m study inside the official 7–15 m corridor. Neither its
// playback duration nor these pose/edge values certify expert riding speed.
export const expertCarvingCorridor={width:10,start:0,end:arcs*arcAdvance} as const;
export const expertCarvingDurationMs=(c:LessonConfig)=>Math.max(12000,c.duration??24000);
export function supportsExpertCarvingLesson(c:LessonConfig):boolean {
  return c.type==="expert-carving" && Object.hasOwn(variants,c.task??"")
    && variants[c.task as ExpertCarvingTask].includes(c.variant??"")
    && c.transition===undefined && c.turnShape===undefined && c.posture===undefined
    && c.pressureDiagram!==true
    && (c.fromEdge===undefined || c.fromEdge==="toe" || c.fromEdge==="heel");
}
export function expertCarvingVariants(c:LessonConfig) {
  if(!supportsExpertCarvingLesson(c))throw new Error("尚未实现的专家刻滑任务或对照组合");
  if(c.task==="expert-carve-arc")return [{value:"linked",label:"连续完整弧线"}];
  if(c.task==="expert-carve-release")return [{value:"coordinated",label:"连续屈伸参考"},{value:"late-flex",label:"对照：屈腿调节偏晚"}];
  return [{value:"normal",label:"正常高度全段参考"},{value:"lower-recover",label:"正常 → 稍低 → 恢复"}];
}
function geometry(t:number,c:LessonConfig) {
  const p=arcs*t,index=t===1?arcs-1:Math.floor(p),u=t===1?1:p-index;
  const first=c.fromEdge??"toe",edge=index%2?(first==="toe"?"heel":"toe"):first,sign=edge==="toe"?1:-1;
  // Independent six-arc spatial curve. Analytic derivatives produce the
  // actual travel/board tangent; no duck sampler, copied trail, or yaw-only turn.
  const q=u-.12*Math.sin(2*PI*u)/(2*PI),dq=1-.12*Math.cos(2*PI*u);
  const x=sign*lateral*Math.sin(PI*q),dx=sign*lateral*PI*Math.cos(PI*q)*dq;
  const heading=Math.atan2(dx,arcAdvance),wave=Math.sin(PI*u);
  // C1 edge change avoids imposing a body-relative kink at the seam. The rigid
  // board still uses the shared geometric low-edge contact, never a force point.
  const roll=sign*peakRoll*wave**3*(1+.08**2)/(wave**2+.08**2);
  const timingShift=c.task==="expert-carve-release"&&c.variant==="late-flex"?.14:0;
  const shortening=Math.sin(PI*(p-timingShift))**2;
  // Both sides get one complete low arc in the middle pair. The added change
  // and its first derivative are zero at each pair boundary, so recovery is real.
  const lowered=c.task==="expert-carve-adaptation"&&c.variant==="lower-recover"&&index>=2&&index<4;
  const additionalShortening=lowered?(edge==="toe"?.070:.040)*Math.sin(PI*u)**2:0;
  const targetLength=.810-.055*shortening-additionalShortening;
  const route:Route={position:[x,0,arcAdvance*p],travel:[Math.sin(heading),0,Math.cos(heading)],yaw:heading-PI/2,roll,
    edgeLoad:Math.abs(roll)/peakRoll,phase:0,half:edge==="toe"?0:1,progress:u,holding:false,lean:roll/peakRoll,extension:0,braking:0};
  return {route,index,u,edge,heading,targetLength};
}
const length=(s:MotionState)=>["front","rear"].reduce((sum,leg)=>sum+Math.hypot(...s.joints[`${leg}Hip` as "frontHip"].map((v,i)=>v-s.joints[`${leg}Ankle` as "frontAnkle"][i])),0)/2;
function regularState(t:number,c:LessonConfig):MotionState {
  const g=geometry(t,c),toe=Math.max(0,g.route.roll/peakRoll)**2,heel=Math.max(0,-g.route.roll/peakRoll)**2;
  const options=(bend:number):PoseOptions=>({
    cuffPitch:14+4*toe-2*heel,rearCuffPitch:14+3*toe-2*heel,legBend:bend,
    hipYaw:g.route.yaw+rad(6),shoulderYaw:g.route.yaw+rad(25),
    // The torso coordinates with actual leg shortening; neither direction is
    // obtained by reflecting one squat. This is an authored movement solution.
    torsoPitch:.14+.0075*(bend-32)-.24*toe+.22*heel,lookDirection:g.route.travel,
  });
  const at=(bend:number)=>buildPose(g.route,"correct",options(bend));
  let lo=20,hi=85;
  if(length(at(lo))<g.targetLength || length(at(hi))>g.targetLength)throw new Error("专家刻滑示意腿长超出可达范围");
  for(let i=0;i<30;i++){const mid=(lo+hi)/2;if(length(at(mid))>g.targetLength)lo=mid;else hi=mid;}
  return at((lo+hi)/2);
}
const stageCache=new Map<string,Stage[]>();
function stagesFor(c:LessonConfig):Stage[] {
  const key=[c.task,c.variant,c.fromEdge].join(":"),cached=stageCache.get(key);if(cached)return cached;
  const stages:Stage[]=[];
  for(let i=0;i<arcs;i++) {
    const at=(u:number)=>(i+u)/arcs,g=geometry(at(.5),c),name=g.edge==="toe"?"前刃":"后刃";
    let lo=0,hi=.5;
    for(let j=0;j<45;j++){const mid=(lo+hi)/2;if(Math.abs(geometry(at(mid),c).route.roll)<.008)lo=mid;else hi=mid;}
    const enter=hi+1e-8,leave=1-hi+1e-8;
    const adaptation=c.task==="expert-carve-adaptation",late=c.task==="expert-carve-release"&&c.variant==="late-flex";
    const condition=adaptation?(c.variant==="normal"?"正常高度参考":i<2?"正常基线":i<4?"稍低应用":"恢复正常"):`第${i+1}弧`;
    stages.push(
      {at:at(0),title:`${condition}：过渡接${name}`,detail:"从旧弧连续过平板，身体保持活动。10米通道是作者取用的官方范围示例；播放时长不是专家速度测量，平板也不代表零压力。"},
      {at:at(enter),title:`${name}在落线前开始建立`,detail:g.edge==="toe"?"实际板角已越过近平板阈值，膝与骨盆共同进入脚尖侧，胸廓协调而不先扑入。继续观察方向沿弧线改变，不以最大刃角判断建立。":"实际板角已越过近平板阈值，膝髋折叠、骨盆进入脚跟侧，胸廓相对回板。后刃单独组织；脚跟侧不等于沿板长坐向后脚。"},
      {at:at(.25),title:late?"屈腿调节相对偏晚":adaptation&&c.variant==="lower-recover"&&i>=2&&i<4?"在原路线内逐渐稍低":"落线前持续形成新弧",detail:late?"同一板路径、板角、靴筒与释放时刻，仅把髋踝距离包络后移。腿长变化不测压力；不能称为旧刃滞留或模拟必然失控。":"板轴随路线切向，未用横扫板尾替代弧线。身体仍可继续屈伸；降低或增刃角不是本阶段的必然目标。"},
      {at:at(.5),title:`${name}通过落线`,detail:adaptation&&c.variant==="lower-recover"&&i>=2&&i<4?"本弧较低位置与正常参考保持同一路线、板角和靴筒；比较两侧膝髋、胸廓和后续恢复。较低不等于更大压力，也不是四级独立任务。":"此时实际路线切向朝坡下，前半弧已经在新工作刃上改向。继续看后半弧和出口；单帧较低、雪花或姿态角度都不能单独证明整段刻滑。"},
      {at:at(.76),title:`完成${name}出口，逐渐恢复余量`,detail:c.task==="expert-carve-release"?"继续完成方向变化并恢复腿长；参考与偏晚对照的板路径和减刃完全一致。这里显示调压相关动作线索，不显示真实压力、储能或回弹。":"路线已从坡下继续转向计划出口，旧刃逐渐减小，腿长仍可调整。携带动量不等于不断加速，也不把长横切停等当连接。"},
      {at:at(leave),title:`${name}已减到近平板`,detail:adaptation&&c.variant==="lower-recover"&&i===3?"两侧稍低应用已完成，附加降低正在归零，下一弧进入正常高度复测；不是只把标签改回正常。动作仍在滑行，不将播放器暂停当作雪上停止。":"继续跨侧接下一弧，双脚与装备保持连接；本图只演连续任务，不模拟主动搓雪停止。需要退出时用已掌握的安全控制方法。"},
    );
  }
  stages.push({at:1,replay:{from:5/6,label:"末弧完整衔接"},title:"完整六弧结束，仍在滑行",detail:c.task==="expert-carve-adaptation"?(c.variant==="lower-recover"?"正常—稍低—恢复任务在末段已回正常参考；完整弧线与腿长周期可接续。重播不是雪上停车，图中没有速度、压力或认证评分。":"六弧均保持正常高度参考，供同路线比较中间两弧降低及随后恢复；姿态与弧线可接续。重播不是雪上停车，也不提供速度或压力测量。"):"末态与起点姿态、方向和运动趋势连续，仅沿坡下平移；六弧可继续接续。重播不是雪上停车，图中没有速度、压力或认证评分。"});
  stageCache.set(key,stages);return stages;
}
export function sampleExpertCarvingLesson(time:number,c:LessonConfig,stance:Stance="regular"):LessonFrame {
  if(!supportsExpertCarvingLesson(c))throw new Error("尚未实现的专家刻滑任务或对照组合");
  const t=clamp(Number.isFinite(time)?time:0),stages=stagesFor(c),stage=stages.reduce((n,s,i)=>t>=s.at?i:n,0);
  const state=applyStance(regularState(t,c),stance);state.phase=Math.min(3,stage) as 0|1|2|3;state.phaseName=stages[stage].title;state.turnProgress=geometry(t,c).u;
  const index=geometry(t,c).index;
  return {state,stage,stages,task:c.task!,moving:true,corridor:expertCarvingCorridor,routeWindow:{start:Math.max(0,index-1)*arcAdvance,end:Math.min(arcs,index+1)*arcAdvance}};
}
