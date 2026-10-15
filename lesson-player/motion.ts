import { applyStance, buildPose, type MotionState, type PoseOptions, type Route, type Stance, type Vec3 } from "../prototype/motion";
import registry from "./registry.json";
import { isRotationLesson, rotationLessonTask, sampleRotationLesson } from "./rotation";
import { supportsShortTurnLesson, shortTurnTask, sampleShortTurnLesson } from "./short-turns";
import { isTurningLesson, sampleTurningLesson } from "./turns";
import { supportsPressureLesson, pressureLessonTask, samplePressureLesson } from "./pressure";
import { supportsAdvancedPressureLesson, advancedPressureTask, sampleAdvancedPressureLesson } from "./pressure-advanced";
import { supportsCoordinationLesson, coordinationTask, sampleCoordinationLesson } from "./coordination";

const partialVariants:Record<string,string[]>=registry.partialVariants;
export const LESSON_TYPES: readonly string[] = [...registry.types,...Object.keys(partialVariants)];
const requiredTasks:Record<string,string[]>=registry.requiredTasks;
export const canRenderLesson=(config:LessonConfig)=>requiredTasks[config.type]
  ?requiredTasks[config.type].includes(config.task??"")&&(supportsCoordinationLesson(config)||isRotationLesson(config)||supportsShortTurnLesson(config))
  :registry.types.includes(config.type)||Boolean(partialVariants[config.type]?.includes(config.variant??""));
export interface LessonConfig {
  type: string;
  title?: string;
  focus?: string;
  variant?: string;
  task?: string;
  path?: string;
  edgeSide?: string;
  view?: string;
  stance?: Stance;
  side?: "left" | "right";
  rotationComparison?: "natural" | "slightly-open";
  transition?: "extend" | "flex" | "retract";
  duration?: number;
  autoplay?: boolean;
  jointLabels?: boolean;
  turnShape?: "open" | "closed";
  skid?: boolean;
  trackDiagnostics?: boolean;
  fromEdge?: "toe" | "heel";
  timing?: "early" | "baseline" | "late";
  pressureDiagram?: boolean;
  legLengthDiagram?: boolean;
  transitionReference?: string;
}
export interface Stage { at: number; title: string; detail: string }
export interface LessonFrame {
  state: MotionState;
  stage: number;
  stages: Stage[];
  task: string;
  moving: boolean;
  supportRail?: [Vec3, Vec3];
}
const PI = Math.PI;
const rad = (n: number) => n * PI / 180;
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const smooth = (n: number) => { const x = clamp(n); return x*x*(3-2*x); };
const lerp = (a: number,b: number,t: number) => a+(b-a)*t;
// Authoring envelopes; these are neither measured timing nor prescribed angles.
const plateau = (t: number) => t < .35 ? smooth(t/.35) : t < .68 ? 1 : 1-smooth((t-.68)/.32);
const rise = (t: number) => t < .4 ? smooth(t/.4) : t < .6 ? 1 : 1-smooth((t-.6)/.4);
const range = (t: number) => {
  const i = Math.min(3, Math.floor(t*4));
  return lerp([0,1,0,-1][i], [1,0,-1,0][i], smooth(t*4-i));
};
export function lessonTask(c: LessonConfig): string {
  if(supportsShortTurnLesson(c))return shortTurnTask(c)!;
  if(isRotationLesson(c))return rotationLessonTask(c);
  if(supportsCoordinationLesson(c))return coordinationTask(c)!;
  if(supportsAdvancedPressureLesson(c))return advancedPressureTask(c)!;
  if(supportsPressureLesson(c))return pressureLessonTask(c);
  if(isTurningLesson(c)) return c.task ?? ({steering:"linked-steering", "rail-track":"linked-rails", garland:"same-edge-garland", "j-turn":"j-turn-stop", "gaze-control":"traverse-observation"}[c.type]!);
  return c.task ?? (c.type === "center-low" || c.type === "fore-aft" && !["rear-heel","front-return-toe"].includes(c.variant ?? "") ? "stationary" : c.type === "center-high" || c.type === "fore-aft" ? "single-arc" : c.path === "j-turn" ? "single-turn-stop" : "edge-release-study");
}
function side(c: LessonConfig): 1|-1 {
  return c.type === "heel-edge" || c.edgeSide === "heel" || ["heel","rear-heel"].includes(c.variant ?? "") ? -1 : 1;
}
function stagesFor(c: LessonConfig, task: string): Stage[] {
  if (c.type === "center-low") return [
    {at:0,title:"舒适中立",detail:"双脚固定，踝、膝、髋都保留活动余量；骨盆位于双脚之间。"},
    {at:.15,title:"小幅屈曲",detail:"膝髋共同调整、骨盆略降低；鞋底留在固定器内，不用折腰代替屈腿。"},
    {at:.4,title:"保留余量",detail:"暂留在较低位置，仍能继续屈伸；此处不演示蹲到最低。"},
    {at:.68,title:"平顺恢复",detail:"回到舒适高度，膝不锁直；高度不是压力大小。"},
  ];
  if (c.type === "center-high") return [
    {at:0,title:"同刃中低位",detail:"同一工作刃、同一条示意路线；先观察膝髋的舒适屈曲。"},
    {at:.12,title:"适量伸展",detail:"膝髋关系平顺变化，升高骨盆，仍保留再伸与再屈的余量。"},
    {at:.4,title:"较高但不锁腿",detail:"板刃保持，双脚仍固定。不能由站得高低推算真实压力。"},
    {at:.65,title:"回到中低位",detail:"重新屈腿，胸廓配合平衡；不把头肩扑向弯内。"},
  ];
  if (c.type === "fore-aft") {
    if(c.variant === "rear-heel" || c.variant === "front-return-toe") return [
      {at:0,title:"两脚之间",detail:"先在当前工作刃上保持两腿可活动；这里展示位置关系，不显示压力比例。"},
      {at:.15,title:c.variant === "rear-heel"?"小幅向后脚侧":"小幅向前脚侧",detail:"两腿分别配合，骨盆和胸廓沿板长适量移动；双脚不离开固定器。"},
      {at:.45,title:"观察双腿配合",detail:"观察前后膝和髋的变化，不靠前伸手臂或探头制造重心移动。"},
      {at:.68,title:"回到两脚之间",detail:"恢复可向两侧调整的位置；这不是每一弯都必须做的前后摆动。"},
    ];
    return [
      {at:0,title:"居中 → 前脚侧",detail:"从双脚之间小幅向板头侧调整；骨盆与躯干一起移动，脚位保持。"},
      {at:.25,title:"前脚侧 → 回中",detail:"两腿协调屈伸，回到两脚之间，不将前脚长期压死。"},
      {at:.5,title:"居中 → 后脚侧",detail:"只作小幅范围感知；不把长期坐板尾当作普通滑行姿态。"},
      {at:.75,title:"后脚侧 → 回中",detail:"恢复双腿都能调整的位置。图中质心为分段估计，不等于足底压力中心。"},
    ];
  }
  const edge = side(c)>0?"前刃":"后刃";
  const relation = side(c)>0?"膝与骨盆共同移向脚尖侧，胸廓相对下肢更直立；脚跟留在靴内。":"膝髋共同折叠，骨盆向脚跟侧，胸廓相对回板；看小腿与高背支持关系。";
  if(task === "single-turn-stop") return [
    {at:0,title:"受控进入",detail:"示意短入口接一个完整单弯；实际先确认坡面、速度和可见停止空间。"},
    {at:.16,title:`渐建${edge}`,detail:relation},
    {at:.45,title:"继续圆弧",detail:"持续引导板头和板尾转向横坡，膝髋仍可活动；不把短保持变成僵直定格。"},
    {at:.8,title:"转向横坡、渐停",detail:`继续转向横坡并逐渐停止，保留${edge}。单弯结束不自动放平，也不自动接下一弯。`},
  ];
  return [
    {at:0,title:task === "static-edge"?"扶稳，小幅感知":"进入前的参考",detail:task === "static-edge"?"双手扶稳护栏，在平缓处小幅感知关节与板的关系；手部支撑参与平衡，不是无辅助站立示范。":"本段只分解一次建刃与释放，具体速度和幅度需匹配雪况与弯形。"},
    {at:.16,title:`逐渐建立${edge}`,detail:relation},
    {at:.35,title:c.type === "inclination"?"比较内倾与成角":"短保持并观察",detail:c.variant === "inclination-focused"?"肩髋更多同向移入；对照相同板角下身体各段的位置。动态内倾需要相应弯形和速度支持。":c.variant === "angulation-focused"?"下肢与躯干形成更多角度；对照相同板角下胸廓相对骨盆的位置。成角不等于腰椎过伸。":relation},
    {at:.68,title:"逐渐减刃并恢复",detail:"板角连续减少，髋与胸廓回到可调整的关系；没有切换到另一刃。"},
  ];
}

export function sampleLesson(time: number, c: LessonConfig, stance: Stance = "regular"): LessonFrame {
  if(!canRenderLesson(c)) throw new Error(`尚未实现的三维动作：${c.type}/${c.variant??"default"}`);
  if(supportsShortTurnLesson(c))return sampleShortTurnLesson(time,c,stance);
  if(isRotationLesson(c))return sampleRotationLesson(time,c,stance);
  if(supportsCoordinationLesson(c))return sampleCoordinationLesson(time,c,stance);
  if(supportsAdvancedPressureLesson(c))return sampleAdvancedPressureLesson(time,c,stance);
  if(supportsPressureLesson(c))return samplePressureLesson(time,c,stance);
  if(isTurningLesson(c)) return sampleTurningLesson(time,c,stance);
  const t=clamp(Number.isFinite(time)?time:0), task=lessonTask(c), s=side(c);
  const moving=!["stationary","static-edge"].includes(task);
  const stages=stagesFor(c,task);
  const stage=stages.reduce((last,p,i)=>t>=p.at?i:last,0);
  let amount=plateau(t), fore=0;
  let roll=s*rad(task === "static-edge"?5:13)*amount;
  let bend=32+(s>0?10:14)*amount;
  let cuff=14+(s>0?4:-2)*amount;
  let torso=.14+(s>0?-.17:.34)*amount;
  if(c.type === "center-low") {roll=0; bend=32+8*amount; cuff=14+2*amount; torso=.14+.13*amount;}
  if(c.type === "center-high") {
    roll=s*rad(12); bend=(s>0?53:48)-(s>0?22:12)*rise(t); cuff=(s>0?18:12)+(s>0?-2:1)*rise(t); torso=(s>0?.01:.48)-.1*rise(t);
  }
  if(c.type === "fore-aft") {
    const sided=c.variant === "rear-heel" || c.variant === "front-return-toe";
    fore=sided?(c.variant === "rear-heel"?-1:1)*plateau(t):range(t);
    amount=sided?1:0;roll=sided?s*rad(11):0;
    bend=sided?(s>0?40:45):36; cuff=sided?(s>0?17:12):15;torso=sided?(s>0?.02:.4):.2;
  }
  if(task === "static-edge") {
    // Reduced range for stationary awareness, independently of the dynamic pose.
    bend=32+(s>0?3:6)*amount;torso=.14+(s>0?-.02:.2)*amount;
  }
  if(task === "single-turn-stop") {
    amount=smooth(t/.5);roll=s*rad(13)*amount; bend=32+(s>0?10:14)*amount;cuff=14+(s>0?4:-2)*amount;torso=.14+(s>0?-.17:.34)*amount;
  }
  if(c.type === "inclination") {
    if(c.variant === "inclination-focused") {bend=31+4*amount;torso=.14+s*.24*amount;}
    if(c.variant === "angulation-focused") {bend=32+(s>0?12:17)*amount;torso=.14+(s>0?-.22:.4)*amount;}
  }
  let position:Vec3=[0,0,0],travel:Vec3=[0,0,0],lookDirection:Vec3|undefined,yaw=0;
  if(moving) {
    const angle=(task === "single-turn-stop"?PI/2:1.1)*smooth(t);
    const r=task === "single-turn-stop"?3.2:4.2;
    position=[s*r*(Math.cos(angle)-1),0,r*Math.sin(angle)];
    travel=[-s*Math.sin(angle),0,Math.cos(angle)];
    lookDirection=travel;
    yaw=-PI/2-s*angle-s*.1*Math.sin(PI*t);
    if(t===0 || t===1) travel=[0,0,0];
  }
  const route:Route={position,travel,yaw,roll,edgeLoad:amount,phase:stage as 0|1|2|3,half:s>0?0:1,progress:t,holding:false,lean:s*amount,extension:0,braking:0};
  const pose:PoseOptions={cuffPitch:cuff,rearCuffPitch:cuff,legBend:bend,hipYaw:yaw+.05,shoulderYaw:yaw+.09,torsoPitch:torso,shinSide:rad(4)*fore,hipTilt:rad(4)*fore,torsoAlong:.025*fore,lookDirection};
  // Stationary edge awareness uses an actual external hand support. It must not
  // borrow the turn's dynamic support or claim unsupported static equilibrium.
  if(task === "static-edge") {pose.frontHand=[.24,1.04,.34];pose.rearHand=[-.24,1.04,.34];}
  const state=applyStance(buildPose(route,"correct",pose),stance);
  if(task === "single-turn-stop" && t===1) stages[stage]={...stages[stage],title:`已停住，保留${s>0?"前刃":"后刃"}`,detail:"保留工作刃和关节活动余量；本次单弯已经结束，可停留观察或主动重新播放。"};
  state.phaseName=stages[stage].title;
  // An absent direction at rest is not a 90-degree skid.
  if(!moving || t===0 || t===1) state.metrics.skidAngle=0;
  return {state,stage,stages,task,moving,supportRail:task==="static-edge"?[[-.9,1.04,.34],[.9,1.04,.34]]:undefined};
}
export function lessonTrail(c: LessonConfig, stance: Stance): Vec3[] {
  return Array.from({length:101},(_,i)=>{const p=sampleLesson(i/100,c,stance).state.board.position;return [p[0],.008,p[2]];});
}
