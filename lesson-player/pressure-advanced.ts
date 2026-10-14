import { applyStance, buildPose, type MotionState, type PoseOptions, type Route, type Stance, type Vec3 } from "../prototype/motion";
import type { LessonConfig, LessonFrame, Stage } from "./motion";

type Edge="toe"|"heel";
type Task="same-edge-extension"|"same-edge-absorption"|"lower-transition"|"retraction-transition"|"timing-study";
const PI=Math.PI,rad=(n:number)=>n*PI/180;
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const unitTime=(n:number)=>clamp(Number.isFinite(n)?n:0);
const ease=(n:number)=>{const u=clamp(n),f=(x:number)=>x*x*x*(10+x*(-15+6*x));return u<=.5?f(u):1-f(1-u);};
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const name=(e:Edge)=>e==="toe"?"前刃":"后刃";
const sign=(e:Edge):1|-1=>e==="toe"?1:-1;

export function advancedPressureTask(c:LessonConfig):Task|undefined {
  if(c.type==="pressure-extend"&&c.variant==="heel")return "same-edge-extension";
  if(c.type==="pressure-flex"&&c.variant==="toe")return "same-edge-absorption";
  if(c.type==="edge-change-down"&&c.variant==="lower-com")return "lower-transition";
  if(c.type==="edge-change-down"&&c.variant==="retraction-study")return "retraction-transition";
  if(c.type==="pressure-extend"&&c.variant==="timing-study")return "timing-study";
}
export const supportsAdvancedPressureLesson=(c:LessonConfig)=>advancedPressureTask(c)!==undefined;
function flexEnvelope(t:number){
  if(t<.1)return 0;
  if(t<.48)return ease((t-.1)/.38);
  if(t<.53)return 1;
  return 1-ease((t-.53)/.41);
}
const timingStart=(c:LessonConfig)=>({early:.12,baseline:.22,late:.32}[c.timing??"baseline"]);
function extensionPulse(t:number,start:number){
  const u=t-start;
  if(u<0)return 0;
  if(u<.18)return ease(u/.18);
  if(u<.26)return 1;
  return 1-ease((u-.26)/.20);
}
function edgeWave(t:number){
  const w=Math.cos(PI*t),eps=.12;
  return (1+eps*eps)*w*w*w/(w*w+eps*eps);
}
type Geometry={position:Vec3;travel:Vec3;heading:number;yaw:number;roll:number};
function transitionGeometry(t:number,from:Edge,retraction:boolean):Geometry {
  const s=sign(from),a=retraction?.35:.9,length=retraction?3.2:4.4;
  const dx=-s*a*PI*Math.sin(PI*t),heading=Math.atan2(dx,length);
  const roll=s*rad(retraction?26:13)*edgeWave(t);
  return {position:[s*a*(Math.cos(PI*t)-1),0,length*t],travel:[Math.sin(heading),0,Math.cos(heading)],heading,yaw:heading-PI/2,roll};
}
const ARC_N=600;
type PathPoint={p:Vec3;v:Vec3};
const arcPaths=new Map<number,PathPoint[]>();
function arcVelocity(t:number,s:number):Vec3 {
  const heading=-s*mix(.12,PI/2,ease(t/.9)),speed=5*(1-ease((t-.6)/.4));
  return [Math.sin(heading)*speed,0,Math.cos(heading)*speed];
}
function arcPath(s:number){
  const found=arcPaths.get(s);if(found)return found;
  const out:PathPoint[]=[{p:[0,0,0],v:arcVelocity(0,s)}],dt=1/ARC_N;
  for(let i=1;i<=ARC_N;i++){
    const a=(i-1)*dt,b=i*dt,va=out[i-1].v,vm=arcVelocity((a+b)/2,s),vb=arcVelocity(b,s);
    out.push({p:out[i-1].p.map((v,k)=>v+dt*(va[k]+4*vm[k]+vb[k])/6) as Vec3,v:vb});
  }
  arcPaths.set(s,out);return out;
}
function arcGeometry(t:number,s:number):Geometry {
  const ps=arcPath(s),i=Math.min(ARC_N-1,Math.floor(t*ARC_N));
  const a=i/ARC_N,dt=t-a,va=ps[i].v,vm=arcVelocity((a+t)/2,s),vb=arcVelocity(t,s);
  // Direct partial integration avoids reversal near a zero-speed endpoint.
  const position=ps[i].p.map((v,k)=>v+dt*(va[k]+4*vm[k]+vb[k])/6) as Vec3;
  const heading=-s*mix(.12,PI/2,ease(t/.9));
  const roll=s*rad(6+7*ease(t/.24)-(s<0?7*ease((t-.72)/.28):0));
  return {position,travel:t<1?[Math.sin(heading),0,Math.cos(heading)]:[0,0,0],heading,yaw:heading-PI/2-s*rad(8)*Math.sin(PI*t)**2,roll};
}
function asRoute(g:Geometry,t:number):Route{
  return {position:g.position,travel:g.travel,yaw:g.yaw,roll:g.roll,edgeLoad:Math.abs(g.roll)/rad(26),phase:0,half:g.roll<0?1:0,progress:t,holding:false,lean:g.roll/rad(26),extension:0,braking:0};
}
function poseOptions(g:Geometry,bend:number):PoseOptions {
  const toe=Math.max(0,g.roll/rad(26)),heel=Math.max(0,-g.roll/rad(26));
  return {legBend:bend,cuffPitch:14+4*toe-2*heel,rearCuffPitch:14+4*toe-2*heel,hipYaw:g.yaw+rad(6),shoulderYaw:g.yaw+rad(30),torsoPitch:.14+.012*(bend-32)+.2*heel-.25*toe,lookDirection:[Math.sin(g.heading),0,Math.cos(g.heading)]};
}
function bendAt(t:number,task:Task,c:LessonConfig):number{
  if(task==="lower-transition"||task==="retraction-transition"||task==="timing-study")return bendForLength(t,task,c);
  if(task==="same-edge-extension")return 48-10*(ease((t-.18)/.30)-ease((t-.58)/.26));
  return 40+14*ease((t-.24)/.38);
}
function geometry(t:number,task:Task,c:LessonConfig):Geometry{
  if(task==="same-edge-extension"||task==="same-edge-absorption")return arcGeometry(t,task==="same-edge-extension"?-1:1);
  return transitionGeometry(t,c.fromEdge??"heel",task==="retraction-transition");
}
export const meanLegLength=(st:MotionState)=>(
  Math.hypot(...st.joints.frontHip.map((v,i)=>v-st.joints.frontAnkle[i]))+
  Math.hypot(...st.joints.rearHip.map((v,i)=>v-st.joints.rearAnkle[i]))
)/2;
const lengthEndpoints=new Map<string,{first:number;compact:number;last:number}>();
function lengthTargets(task:Task,c:LessonConfig){
  const key=task+":"+(c.fromEdge??"heel"),cached=lengthEndpoints.get(key);if(cached)return cached;
  const retract=task==="retraction-transition";
  const at=(t:number,b:number)=>{const g=geometry(t,task,c);return meanLegLength(buildPose(asRoute(g,t),"correct",poseOptions(g,b)));};
  const result={first:at(0,retract?32:34),compact:at(.5,retract?52:62),last:at(1,retract?32:34)};
  lengthEndpoints.set(key,result);return result;
}
// Control actual mean hip-to-ankle distance; never move joints after solving.
function bendForLength(t:number,task:Task,c:LessonConfig){
  const g=geometry(t,task,c),r=asRoute(g,t);
  let target:number;
  if(task==="timing-study")target=.77+.025*extensionPulse(t,timingStart(c));
  else{
    const e=lengthTargets(task,c),q=flexEnvelope(t);
    target=t<=.5?mix(e.first,e.compact,q):mix(e.last,e.compact,q);
  }
  const length=(b:number)=>meanLegLength(buildPose(r,"correct",poseOptions(g,b)));
  let lo=20,hi=80;
  if(length(lo)<target||length(hi)>target)throw new Error("本例腿长超出骨架可达范围");
  for(let i=0;i<32;i++){const mid=(lo+hi)/2;if(length(mid)>target)lo=mid;else hi=mid;}
  return (lo+hi)/2;
}
const stopPitchCache=new Map<Task,number>();
function stopPitch(task:Task,c:LessonConfig):number{
  const cached=stopPitchCache.get(task);if(cached!==undefined)return cached;
  const g=geometry(1,task,c),r=asRoute(g,1),base=poseOptions(g,bendAt(1,task,c));
  const toe:Vec3=[Math.sin(g.yaw),0,Math.cos(g.yaw)];
  const f=(pitch:number)=>{
    const st=buildPose(r,"correct",{...base,torsoPitch:pitch});
    return (st.com[0]-st.contact[0])*toe[0]+(st.com[2]-st.contact[2])*toe[2];
  };
  let lo=-.25,hi=.85;
  if(f(lo)>0||f(hi)<0)throw new Error("停止姿态超出本例支撑范围");
  for(let i=0;i<40;i++){const mid=(lo+hi)/2;if(f(mid)<0)lo=mid;else hi=mid;}
  const result=(lo+hi)/2;stopPitchCache.set(task,result);return result;
}
function regularState(t:number,task:Task,c:LessonConfig):MotionState{
  const g=geometry(t,task,c),pose=poseOptions(g,bendAt(t,task,c));
  if(task==="same-edge-extension"||task==="same-edge-absorption")pose.torsoPitch=mix(pose.torsoPitch!,stopPitch(task,c),ease((t-.8)/.2));
  const state=buildPose(asRoute(g,t),"correct",pose);
  if(t===1&&(task==="same-edge-extension"||task==="same-edge-absorption"))state.metrics.skidAngle=0;
  return state;
}
const edgeEventCache=new Map<string,{enter:number;leave:number}>();
function edgeEvents(task:Task,c:LessonConfig){
  const key=task+":"+(c.fromEdge??"heel"),found=edgeEventCache.get(key);if(found)return found;
  const from=c.fromEdge??"heel",to=from==="toe"?"heel":"toe",edge=(t:number)=>regularState(t,task,c).edge;
  if(edge(0)!==from||edge(.5)!=="flat"||edge(1)!==to)throw new Error("转换起止刃不一致");
  let lo=0,hi=.5;
  for(let i=0;i<36;i++){const mid=(lo+hi)/2;if(edge(mid)===from)lo=mid;else hi=mid;}
  const enter=hi;lo=.5;hi=1;
  for(let i=0;i<36;i++){const mid=(lo+hi)/2;if(edge(mid)===to)hi=mid;else lo=mid;}
  const result={enter,leave:hi};edgeEventCache.set(key,result);return result;
}
let absorptionEvent:number|undefined;
function absorptionSpeedPeak(){
  if(absorptionEvent!==undefined)return absorptionEvent;
  const c:LessonConfig={type:"pressure-flex",variant:"toe"};
  const y=(t:number)=>regularState(t,"same-edge-absorption",c).com[1],h=1e-4;
  const acc=(t:number)=>(y(t+h)-2*y(t)+y(t-h))/(h*h);
  let lo=.25,hi=.61;
  if(acc(lo)>=0||acc(hi)<=0)throw new Error("吸收阶段需重新核验");
  for(let i=0;i<35;i++){const mid=(lo+hi)/2;if(acc(mid)<0)lo=mid;else hi=mid;}
  absorptionEvent=(lo+hi)/2;return absorptionEvent;
}
function stagesFor(task:Task,c:LessonConfig):Stage[]{
  if(task==="same-edge-extension")return [
    {at:0,title:"保持后刃弧线",detail:"从已建立的后刃进入，膝髋保留活动余量；先看板沿完整弧线转向。"},
    {at:.18,title:"弯中渐进伸腿",detail:"两腿只增加少量长度，骨盆与胸廓共同调整；伸腿启动不等于立即减压，图中不显示真实压力。"},
    {at:.48,title:"控制伸展末端",detail:"保留膝髋活动余量，不锁腿、不用后脚横踢板尾。"},
    {at:.58,title:"柔和收腿",detail:"在同一后刃上收回腿长，随后逐渐减小刃角；本次选择完成单弯并停止。"},
    {at:.8,title:"横坡渐停，保留后刃",detail:"保持后刃和完整出口，位移逐渐停止；不是自动放平接下一弯。"},
  ];
  if(task==="same-edge-absorption")return [
    {at:0,title:"建立前刃弧线",detail:"在已有前刃上逐渐增加小幅板角，确认弧线连续，不靠猛跪建立支撑。"},
    {at:.24,title:"弯中柔和屈腿",detail:"踝膝髋协调，让两腿逐渐缩短；仍保留前刃。本例只示意动作，不计算真实压力。"},
    {at:absorptionSpeedPeak(),title:"逐渐收住下沉",detail:"下降仍在继续，但速度逐渐降低；平顺控制末端并保留进一步活动余量，不蹲到底硬撑。"},
    {at:.62,title:"保留调整余量",detail:"结束本次屈腿，沿原弧线继续转向横坡，不突然放平或横踢板尾。"},
    {at:.8,title:"横坡渐停，保留前刃",detail:"位移逐渐停止，保持工作刃；实际练习随后另行连接下一弯。"},
  ];
  const from=c.fromEdge??"heel",to:Edge=from==="toe"?"heel":"toe",e=edgeEvents(task,c);
  if(task==="timing-study"){
    const start=timingStart(c),label={early:"提前",baseline:"基准",late:"稍后"}[c.timing??"baseline"],coincides=Math.abs(start+.18-.5)<1e-9;
    return [
      {at:0,title:"固定路线，比较启动时机",detail:"三档使用完全相同的板路径、刃角、行进方向和时间线；只平移同一腿长变化曲线。"},
      {at:start,title:label+"开始伸展",detail:"本次只改变启动时刻，两腿髋踝平均距离的变化幅度、持续时间和曲线形状不变；提前或稍后本身不代表更好。"},
      ...(coincides?[]:[{at:start+.18,title:"控制伸展末端",detail:"伸展停止在仍可继续屈曲的位置；此处不是由高度推算压力。"}]),
      {at:.5,title:coincides?"伸展末端与换刃重合":"固定的换刃位置",detail:"板在所有时机档都于同一位置过平板；比较此时双腿处于哪一阶段。"},
      {at:start+.26,title:"平顺屈回",detail:"按同一恢复时长收回腿长；既定板路径和刃角没有随动作时机移动。"},
      {at:start+.46,title:"恢复原来腿长",detail:"继续原来的新弧线；这段示意结束不表示已经停车。"},
    ].sort((a,b)=>a.at-b.at);
  }
  const retract=task==="retraction-transition";
  return [
    {at:0,title:"旧"+name(from)+"支撑",detail:"双腿保留可收短的长度，旧弧线仍连续；这是一种可选过渡方式。"},
    {at:.1,title:retract?"协调回收，板向身下靠近":"受控降低，身体向板靠近",detail:retract?"双腿缩短并减旧刃，板的横向路径比身体更明显；身体高度允许自然小幅变化，不把胸廓锁死。":"双腿协调屈曲，估计质心相对雪面明显降低，同时减小旧刃角；不是只折腰。"},
    {at:e.enter,title:retract?"收短通过近平板":"低位通过近平板",detail:"板持续贴雪、连续通过，双脚不离开固定器；低位或近平板都不等于零压力。"},
    {at:e.leave,title:"逐渐建立"+name(to),detail:"新刃开始建立，仍保持收短后的可活动关系，不向新弯猛踢后脚。"},
    {at:.53,title:"新弯中渐进伸腿",detail:retract?"板通过身体下方后继续向另一侧运行，双腿逐渐恢复长度，躯干路线较平顺。":"新刃逐渐建立后恢复腿长，继续完成新弧线；身体高度由整体关节关系共同决定，不要求伸腿开始就立即抬髋。"},
    {at:.94,title:"接续新弧线",detail:"已经恢复适合新刃的较舒展腿长，保持调整余量；这段结束仍在滑行，不是停车。"},
  ].sort((a,b)=>a.at-b.at);
}
export function sampleAdvancedPressureLesson(time:number,c:LessonConfig,stance:Stance="regular"):LessonFrame{
  const t=unitTime(time),task=advancedPressureTask(c);
  if(!task)throw new Error("尚未实现的压力进阶任务");
  const stages=stagesFor(task,c),stage=stages.reduce((n,s,i)=>t>=s.at?i:n,0);
  const state=applyStance(regularState(t,task,c),stance);
  const stopped=t===1&&(task==="same-edge-extension"||task==="same-edge-absorption");
  if(stopped)stages[stage]={...stages[stage],title:"已停住，保留"+name(task==="same-edge-extension"?"heel":"toe"),detail:"保持工作刃与活动余量，本次单弯已经结束。"};
  state.phase=Math.min(3,stage) as 0|1|2|3;
  if(task!=="same-edge-extension"&&task!=="same-edge-absorption")state.half=(c.fromEdge??"heel")==="toe"?1:0;
  state.phaseName=stages[stage].title;state.turnProgress=t;
  return {state,stage,stages,task,moving:true};
}
