import {applyStance,buildPose,type MotionState,type PoseOptions,type Route,type Stance,type Vec3} from "../prototype/motion";
import {surfaceRollAt,type SegmentRolls,type SurfaceBoard} from "../prototype/board-surface";
import type {LessonConfig,LessonFrame,Stage} from "./motion";

export type TwistTask="progressive-twist"|"twist-timing-compare";
export type TwistTiming="near-synchronous"|"front-earlier";
export interface TwistConfig extends LessonConfig {twistTiming?:TwistTiming}
export interface TwistFrame extends LessonFrame {segmentEdges:{front:"toe"|"heel"|"flat";rear:"toe"|"heel"|"flat"};twistTiming:TwistTiming}
const PI=Math.PI,rad=(n:number)=>n*PI/180,clamp=(n:number)=>Math.max(0,Math.min(1,n));
const smooth=(x:number)=>{const u=clamp(x);return u*u*u*(10+u*(-15+6*u));};
/** A short, monotone easing through the support exchange. Its zero roll rate at
 * the middle makes the max-height contact handoff C1 without floating the board
 * above the snow or independently translating its cross-sections. */
export function twistProgress(t:number):number {
  const span=.08,w=t-.5;if(Math.abs(w)>=span)return t;
  const u=Math.abs(w)/span,p=6*u**3-8*u**4+3*u**5;
  return .5+Math.sign(w)*span*p;
}
const eventAt=(progress:number)=>{let lo=0,hi=1;for(let i=0;i<40;i++){const m=(lo+hi)/2;if(twistProgress(m)<progress)lo=m;else hi=m;}return (lo+hi)/2;};
const edge=(roll:number):"toe"|"heel"|"flat"=>Math.abs(roll)<.008?"flat":roll>0?"toe":"heel";
export function twistTask(c:TwistConfig):TwistTask|undefined {
  if(c.type!=="twist"||c.variant||c.twistTiming&&!['near-synchronous','front-earlier'].includes(c.twistTiming))return;
  if(c.task==="progressive-twist"||c.task==="twist-timing-compare")return c.task;
}
export const supportsTwistLesson=(c:TwistConfig)=>twistTask(c)!==undefined;
export function twistGeometry(time:number,c:TwistConfig):{route:Route;pose:PoseOptions&{segmentRolls:SegmentRolls};timing:TwistTiming} {
  if(!supportsTwistLesson(c))throw new Error("Unsupported twist task");
  const t=clamp(Number.isFinite(time)?time:0),sign=c.fromEdge==="toe"?1:-1,timing=c.twistTiming??(c.task==="twist-timing-compare"?"near-synchronous":"front-earlier");
  const lag=timing==="front-earlier"?.025:0,progress=twistProgress(t),at=(shift:number)=>sign*rad(13)*(1-2*smooth((progress-.20+shift)/.60));
  const segmentRolls={front:at(lag),rear:at(-lag)},roll=(segmentRolls.front+segmentRolls.rear)/2;
  const a=.9,length=4.4,dx=-sign*a*PI*Math.sin(PI*t),heading=Math.atan2(dx,length),yaw=heading-PI/2-sign*rad(7)*Math.cos(PI*t),lean=roll/rad(13);
  const route:Route={position:[sign*a*(Math.cos(PI*t)-1),0,length*t],travel:[Math.sin(heading),0,Math.cos(heading)],yaw,roll,edgeLoad:Math.abs(lean),phase:0,half:sign>0?1:0,progress:t,holding:false,lean,extension:1-lean*lean,braking:0};
  // Each section crosses flat at a different time; a single smooth envelope
  // avoids a cuff-rate corner at either local zero crossing.
  const cuff=(r:number)=>{const lean=r/rad(13);return 14+3*lean+lean*lean;};
  const pose:PoseOptions&{segmentRolls:SegmentRolls}={segmentRolls,cuffPitch:cuff(segmentRolls.front),rearCuffPitch:cuff(segmentRolls.rear),legBend:32+12*lean*lean,hipYaw:yaw+.07,shoulderYaw:yaw+.27,torsoPitch:.13+.3*Math.max(0,-lean)-.15*Math.max(0,lean),lookDirection:route.travel};
  return {route,pose,timing};
}
function stagesFor(c:TwistConfig,timing:TwistTiming):Stage[] {
  const from=c.fromEdge==="toe"?"前刃":"后刃",to=c.fromEdge==="toe"?"后刃":"前刃";
  return [
    {at:0,title:"旧弯稳定支撑",detail:"本段是滑行换刃，原地分脚感知另见正文。前后段同为"+from+"，固定器与双脚位置不变。"},
    {at:timing==="front-earlier"?.175:.20,title:timing==="front-earlier"?"前段稍先减小旧刃角":"前后段基本同时减小刃角",detail:timing==="front-earlier"?"只给小幅动作先后差；膝跟随脚位，后段及时释放，不把动作做成夹膝或横甩。":"作为对照，前后段在同一时刻减小或增加刃角；路线与提前版本一致，不据动画推断哪一种一定更好。"},
    {at:timing==="front-earlier"?eventAt(.475):.5,title:timing==="front-earlier"?"前段经过近平板":"两段经过平板",detail:"观察原前脚与原后脚处各自的板面和垂直鞋底的方向线；整块雪板转向与前后段刃角差是不同变化。"},
    {at:timing==="front-earlier"?eventAt(.525):.55,title:timing==="front-earlier"?"后段接续经过近平板":"两段继续接续",detail:timing==="front-earlier"?"两段短暂不同刃角，不长时间保持相互冲突；绿线只显示每一段较低的一侧板刃，未计算局部压力或真实整刃接触。":"前后段基本同时立起新刃；这里只比较动作，不能推算压力大小，也不能证明某种先后顺序必然让滑行更好。"},
    {at:.825,title:"两段恢复同一"+to,detail:"前后段都已换到同一侧新刃。动画结束时仍在滑行，不固定保持扭转，也不代表停止。"},
  ];
}
/** Requires the optional board-surface extension in buildPose; fail closed until
 * that solver is installed, rather than presenting a rigid board as torsion. */
export function sampleTwistLesson(time:number,c:TwistConfig,stance:Stance="regular"):TwistFrame {
  const t=clamp(Number.isFinite(time)?time:0),g=twistGeometry(t,c),raw=buildPose(g.route,"correct",g.pose);
  const board=raw.board as SurfaceBoard;
  if(!board.segmentRolls)throw new Error("Twist task requires local board-surface support");
  const segmentEdges={front:edge(surfaceRollAt(.27,board)),rear:edge(surfaceRollAt(-.27,board))};
  const state:MotionState=applyStance(raw,stance),stages=stagesFor(c,g.timing),stage=stages.reduce((last,s,i)=>t>=s.at?i:last,0);
  state.phaseName=stages[stage].title;
  return {state,stage,stages,task:twistTask(c)!,moving:true,segmentEdges,twistTiming:g.timing};
}
