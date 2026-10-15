import {applyStance,buildPose,type MotionState,type Route,type Stance,type Vec3} from "../prototype/motion";
import type {LessonConfig,LessonFrame,Stage} from "./motion";

/** Foot identities and hardware nose/tail never change during switch riding. */
export interface SwitchFrame extends LessonFrame {rideDirection:-1}
const PI=Math.PI,TAU=2*PI,rad=(n:number)=>n*PI/180;
export const supportsSwitchLesson=(c:LessonConfig)=>c.type==="switch"&&c.task==="switch-linked-skid"&&!c.variant;
export const rideLeadingAxis=(state:MotionState,direction:1|-1):Vec3=>[direction*Math.cos(state.board.yaw),0,-direction*Math.sin(state.board.yaw)];

function stateAt(t:number):MotionState {
  const phi=TAU*t,a=1.8,length=14,dx=-a*TAU*Math.sin(phi),heading=Math.atan2(dx,length),rawWave=Math.cos(phi),e=.12;
  // Let roll rate pass through zero at flat: the snow-height absolute value
  // must not turn a smooth yaw/route into a vertical velocity discontinuity.
  const wave=(1+e*e)*rawWave**3/(rawWave*rawWave+e*e);
  // This is a separate switch route. Adding pi alone to a forward sample would
  // invert the board's toe-side normal relative to the curvature of that route.
  const roll=-rad(14)*wave,yaw=heading+PI/2-rad(8)*rawWave,lean=-wave;
  const route:Route={position:[a*Math.cos(phi),0,length*t],travel:[Math.sin(heading),0,Math.cos(heading)],yaw,roll,edgeLoad:Math.abs(wave),phase:0,half:t<.5?0:1,progress:t<.5?t*2:(t-.5)*2,holding:false,lean,extension:1-wave*wave,braking:0};
  const toe=Math.max(0,lean),heel=Math.max(0,-lean);
  const state=buildPose(route,"correct",{
    rideDirection:-1,
    cuffPitch:14+4*toe-2*heel,rearCuffPitch:14+4*toe-2*heel,
    legBend:36+8*Math.abs(wave),hipYaw:yaw-.08,
    // Comfortable authoring orientation toward the original tail. The gaze
    // reaches the new route without saturating the common neck-turn limit.
    shoulderYaw:heading+.95,torsoPitch:.12+.30*heel-.15*toe,
    lookDirection:route.travel,
  });
  return state;
}
const stages:Stage[]=[
  {at:0,title:"从首帧就是反脚",detail:"原后脚在行进前方，原板尾领行；原前脚、固定器角度和硬件鼻尾名称都不交换。旧后刃仍是脚跟侧。"},
  {at:.10,title:"先完成旧后刃弧线",detail:"身体位于两脚之间，按新路线组织视线；不把全身重量猛压到新的行进前脚。"},
  {at:.25,title:"释放后刃，经过平板",detail:"双脚保持原固定位置，踝膝髋共同过渡。反脚不是播放过程中转身或脚在固定器内旋转。"},
  {at:.37,title:"前刃继续搓雪圆弯",detail:"脚趾侧仍叫前刃，两腿协同带动原板尾领先的路线；允许可控滑移，不强求立即纯刻滑。"},
  {at:.60,title:"完成前刃，再准备另一侧",detail:"不用惯用一侧急刹代替另一侧完整弧线；上身允许自然调整，不把原前肩强扭到视野末端。"},
  {at:.75,title:"释放前刃，经过平板",detail:"原后脚仍在行进前方；两侧转换分别可观察，没有交换脚的身份。"},
  {at:.87,title:"后刃接续，保持可调",detail:"膝髋共同折叠、胸廓配合，完成第二侧搓雪弧线。本段末态仍在滑行，独立停止是正文的前置练习，未在此示范。"},
];
export function sampleSwitchLesson(time:number,c:LessonConfig,stance:Stance="regular"):SwitchFrame {
  if(!supportsSwitchLesson(c))throw new Error("Unsupported switch task");
  const t=Math.max(0,Math.min(1,Number.isFinite(time)?time:0)),stage=stages.reduce((last,s,i)=>t>=s.at?i:last,0);
  const state=applyStance(stateAt(t),stance);state.phaseName=stages[stage].title;
  return {state,stage,stages,task:"switch-linked-skid",moving:true,rideDirection:-1};
}
