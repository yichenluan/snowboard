import { applyStance, buildPose, type MotionState, type PoseOptions, type Route, type Stance, type Vec3 } from "../prototype/motion";
import type { LessonConfig, LessonFrame, Stage } from "./motion";

export interface RotationConfig extends LessonConfig {
  /** Same route, equipment and timing; only torso/pelvis orientation differs. */
  rotationComparison?: "natural" | "slightly-open";
}
type Task = "arms-traverse-stop" | "arms-linked-feedback" | "neutral-linked" | "orientation-progression" | "toe-orientation-stop" | "heel-baseline-stop" | "linked-rotation" | "heel-speed-check" | "counter-to-linked";
type Geometry = {
  heading:number; yaw:number; roll:number; speed:number;
  hipYaw:number; shoulderYaw:number;
  bendDelta?:number; pitchDelta?:number; cuffPitch?:number; armLift?:number; scan?:number;
};
const PI=Math.PI,TAU=2*PI,rad=(n:number)=>n*PI/180;
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const ease=(n:number)=>{const u=clamp(n);return u*u*u*(10+u*(-15+6*u));};
const ramp=(t:number,a:number,b:number)=>ease((t-a)/(b-a));
const mix=(a:number,b:number,u:number)=>a+(b-a)*u;
const hermite=(a:number,b:number,da:number,db:number,u:number)=>(2*u**3-3*u*u+1)*a+(u**3-2*u*u+u)*da+(-2*u**3+3*u*u)*b+(u**3-u*u)*db;
const pulse=(t:number,a:number,b:number)=>Math.sin(PI*clamp((t-a)/(b-a)))**2;
// A rigid board changes its grounded edge through flat. A nonzero roll rate
// there would make its required centre height |sin(roll)| kink, bouncing all
// joints. Keep the authored peak while easing the flat crossing itself.
const edgeWave=(w:number)=>{const e=.12;return (1+e*e)*w*w*w/(w*w+e*e);};
const taskTypes:Record<Task,string>={"arms-traverse-stop":"shoulder-coordination","arms-linked-feedback":"shoulder-coordination","neutral-linked":"shoulder-coordination","orientation-progression":"shoulder-coordination","toe-orientation-stop":"shoulder-coordination","heel-baseline-stop":"shoulder-coordination","linked-rotation":"rotation","heel-speed-check":"counter-rotation","counter-to-linked":"mixed-rotation"};
const taskVariants:Partial<Record<Task,string>>={"arms-traverse-stop":"arms-feedback","arms-linked-feedback":"arms-feedback","neutral-linked":"neutral","orientation-progression":"open-heel","toe-orientation-stop":"closed-toe"};
function resolveTask(c:LessonConfig):Task|undefined {
  const fallback=c.type==="rotation"?"linked-rotation":c.type==="counter-rotation"?"heel-speed-check":c.type==="mixed-rotation"?"counter-to-linked":c.variant==="arms-feedback"?"arms-linked-feedback":c.variant==="neutral"?"neutral-linked":c.variant==="open-heel"?"orientation-progression":c.variant==="closed-toe"?"toe-orientation-stop":"heel-baseline-stop";
  const candidate=(c.task??fallback) as Task;
  if(taskTypes[candidate]!==c.type||c.variant!==undefined&&taskVariants[candidate]!==c.variant)return;
  return candidate;
}
export const isRotationLesson=(c:LessonConfig)=>resolveTask(c)!==undefined;
export function rotationLessonTask(c:LessonConfig):Task {
  const task=resolveTask(c);if(!task)throw new Error("尚未实现的旋转任务："+c.type+"/"+(c.task??c.variant??"default"));return task;
}
const edgeSide=(c:LessonConfig)=>c.edgeSide==="heel"?-1:1;

/** Independent lower/upper-body phases. Angles and radii are authoring choices. */
function linked(u:number,cycles=1,amplitude=45):Geometry {
  const p=TAU*u,a=rad(amplitude),wave=Math.sin(p),heading=a*Math.cos(p);
  return {
    heading,yaw:heading-PI/2-rad(9)*wave,roll:rad(13)*edgeWave(wave),speed:cycles*TAU*3.2*a,
    hipYaw:-PI/2+rad(9)+.96*a*Math.cos(p-.025)-rad(8)*wave,
    shoulderYaw:-PI/2+rad(34)+.82*a*Math.cos(p-.065)-rad(6)*wave,
  };
}
function traverse(t:number,c:RotationConfig):Geometry {
  const s=edgeSide(c),end=ramp(t,.8,1),heading=-s*rad(60+30*end);
  const yaw=heading-PI/2-s*rad(6)*(1-end);
  return {heading,yaw,roll:s*rad(9-3*end),speed:6*(1-end),
    hipYaw:yaw+rad(9),shoulderYaw:yaw+rad(40),
    armLift:ramp(t,0,.1)*(1-ramp(t,.36,.46)),
    scan:-rad(25)*(pulse(t,.18,.32)+pulse(t,.54,.68))};
}
function singleArc(t:number,s:number,open=false):Geometry {
  const u=ramp(t,.1,.9),heading=-s*PI/2*u,slip=rad(9)*Math.sin(PI*u)**2;
  const yaw=heading-PI/2-s*slip,amount=ramp(t,.06,.4);
  return {heading,yaw,roll:s*rad(13*amount-7*ramp(t,.8,1)),speed:8*(1-ramp(t,.62,1)),
    hipYaw:yaw+rad(open?13:9),shoulderYaw:yaw+rad(open?42:34)};
}
const lowerShape=(g:Geometry)=>({toe:(Math.max(0,g.roll)/rad(13))**2,heel:(Math.max(0,-g.roll)/rad(13))**2});
function finishStop(g:Geometry,start:Geometry,t:number):Geometry {
  if(t<.8)return g;
  const u=ramp(t,.8,1),a=lowerShape(start),b=lowerShape(g),toe=g.roll>0;
  // Stopping has its own lower-body arrangement. Reducing board angle must not
  // automatically straighten the heel-side legs or carry a turning lean into
  // a stationary pose. These are authored equipment/posture choices.
  g.bendDelta=mix(32+10*a.toe+14*a.heel,toe?34:46,u)-(32+10*b.toe+14*b.heel);
  g.cuffPitch=mix(14+4*a.toe-2*a.heel,toe?18:12,u);
  return g;
}
/** One heel-side speed check. Restore board/hips first, then shoulders, so
 * recovery does not silently add a second simultaneous counter-rotation. */
function speedCheck(t:number):Geometry {
  const pivot=ramp(t,.22,.42)*(1-ramp(t,.64,.82));
  const shoulder=-rad(8)*ramp(t,.22,.42)+rad(8)*ramp(t,.84,.98);
  const heading=rad(60),base=heading-PI/2+rad(8);
  const angle=10-5*ramp(t,.08,.2)+7*ramp(t,.42,.58)-7*ramp(t,.62,.7)+5*ramp(t,.83,.97);
  return {heading,yaw:base+rad(12)*pivot,roll:-rad(angle),
    speed:5*(1-.32*ramp(t,.42,.6)),hipYaw:base+rad(9)+rad(11)*pivot,
    shoulderYaw:base+rad(34)+shoulder,
    bendDelta:8*ramp(t,.08,.2)*(1-ramp(t,.42,.58))};
}
function geometry(t:number,c:RotationConfig):Geometry {
  const task=rotationLessonTask(c);
  if(task==="arms-traverse-stop")return finishStop(traverse(t,c),traverse(.8,c),t);
  if(task==="toe-orientation-stop")return finishStop(singleArc(t,1,c.rotationComparison==="slightly-open"),singleArc(.8,1,c.rotationComparison==="slightly-open"),t);
  if(task==="heel-baseline-stop")return finishStop(singleArc(t,-1),singleArc(.8,-1),t);
  if(task==="heel-speed-check")return speedCheck(t);
  if(task==="counter-to-linked"){
    const join=.36,start=.46,target=linked(0,1/.54,60);
    if(t<=join){const g=speedCheck(t/join);return {...g,speed:g.speed/5*target.speed};}
    if(t<start){
      const a=speedCheck(1),u=(t-join)/(start-join),k=ease(u),h=1e-5;
      const next=linked(h/(1-start),1/(1-start),60),previous=linked(-h/(1-start),1/(1-start),60);
      const bridge=(key:"heading"|"yaw"|"roll"|"hipYaw"|"shoulderYaw")=>
        hermite(a[key],target[key],0,(next[key]-previous[key])/(2*h)*(start-join),u);
      return {heading:bridge("heading"),yaw:bridge("yaw"),roll:bridge("roll"),
        speed:mix(a.speed/5*target.speed,target.speed,k),hipYaw:bridge("hipYaw"),
        shoulderYaw:bridge("shoulderYaw")};
    }
    return linked((t-start)/(1-start),1/(1-start),60);
  }
  if(task==="orientation-progression"){
    const group=Math.min(4,Math.floor(t*5)),u=t*5-group,g=linked(u,5),gate=Math.sin(PI*u)**2;
    if(group===1){g.hipYaw+=rad(3)*gate;g.shoulderYaw+=rad(7)*gate;}
    if(group===2){
      const p=TAU*u,shift=.16*gate;
      const bend=(phase:number)=>{const w=edgeWave(Math.sin(phase));return 10*Math.max(0,w)**2+14*Math.max(0,-w)**2;};
      g.bendDelta=bend(p-shift)-bend(p);
    }
    if(group===3){g.bendDelta=-3*Math.sin(TAU*u)**2;g.pitchDelta=.06*Math.sin(TAU*u)*gate;}
    return g;
  }
  if(task==="arms-linked-feedback"){
    const g=linked(t*2,2);g.armLift=1-ramp(t,.43,.5);return g;
  }
  // Neutral validates both edges with a smaller range; rotation shows two
  // independently phased world headings rather than a fixed open-shoulder pose.
  return linked(t,1,task==="neutral-linked"?36:50);
}

type PathPoint={p:Vec3;v:Vec3};
const paths=new Map<string,PathPoint[]>(),N=1200;
function pathKey(c:RotationConfig):string {return JSON.stringify([rotationLessonTask(c),edgeSide(c)]);}
function velocity(t:number,c:RotationConfig):Vec3 {
  const g=geometry(t,c);return [Math.sin(g.heading)*g.speed,0,Math.cos(g.heading)*g.speed];
}
function position(t:number,c:RotationConfig):Vec3 {
  const key=pathKey(c);let ps=paths.get(key);
  if(!ps){ps=[{p:[0,0,0],v:velocity(0,c)}];for(let i=1;i<=N;i++){
    const a=ps[i-1],vm=velocity((i-.5)/N,c),vb=velocity(i/N,c);
    ps.push({p:a.p.map((v,k)=>v+(a.v[k]+4*vm[k]+vb[k])/(6*N)) as Vec3,v:vb});
  }paths.set(key,ps);}
  const i=Math.min(N-1,Math.floor(t*N)),a=i/N,dt=t-a,va=ps[i].v,vm=velocity((a+t)/2,c),vb=velocity(t,c);
  // Integrate the final partial interval instead of linearly interpolating
  // cached positions, so stopping and join velocities remain continuous.
  return ps[i].p.map((v,k)=>v+dt*(va[k]+4*vm[k]+vb[k])/6) as Vec3;
}
/** buildPose projects shoulder axis perpendicular to the trunk. Invert that
 * projection so authored world yaw also equals the visible shoulder-line yaw. */
function shoulderInput(yaw:number,pitch:number,target:number):number {
  const vx=Math.sin(yaw)*Math.sin(pitch),vz=Math.cos(yaw)*Math.sin(pitch);
  const ax=Math.cos(target),az=-Math.sin(target),k=(vx*ax+vz*az)/(Math.cos(pitch)**2);
  return Math.atan2(-(az+vz*k),ax+vx*k);
}
function pose(g:Geometry,route:Route):MotionState {
  const {toe,heel}=lowerShape(g);
  const pitch=.14-.17*toe+.34*heel+(g.pitchDelta??0);
  const cuff=g.cuffPitch??14+4*toe-2*heel;
  const options:PoseOptions={cuffPitch:cuff,rearCuffPitch:cuff,
    legBend:32+10*toe+14*heel+(g.bendDelta??0),hipYaw:g.hipYaw,
    shoulderYaw:shoulderInput(g.yaw,pitch,g.shoulderYaw),torsoPitch:pitch,
    lookDirection:[Math.sin(g.heading+(g.scan??0)),0,Math.cos(g.heading+(g.scan??0))]};
  const state=buildPose(route,"correct",options),lift=g.armLift??0;
  if(lift<=0)return state;
  const axis:Vec3=[Math.cos(g.shoulderYaw),0,-Math.sin(g.shoulderYaw)];
  const facing:Vec3=[Math.sin(g.shoulderYaw),0,Math.cos(g.shoulderYaw)];
  for(const side of ["front","rear"] as const){
    const sign=side==="front"?1:-1,shoulder=state.joints[side==="front"?"frontShoulder":"rearShoulder"];
    const old=state.joints[side==="front"?"frontHand":"rearHand"];
    const target=shoulder.map((v,i)=>v+sign*.37*axis[i]+.1*facing[i]+(i===1?-.15:0)) as Vec3;
    options[side==="front"?"frontHand":"rearHand"]=old.map((v,i)=>mix(v,target[i],lift)) as Vec3;
  }
  return buildPose(route,"correct",options);
}
const stopPitches=new Map<string,number>();
function stopPitchDelta(c:RotationConfig):number {
  const key=JSON.stringify([rotationLessonTask(c),edgeSide(c),c.rotationComparison??"natural"]),cached=stopPitches.get(key);
  if(cached!==undefined)return cached;
  const g=geometry(1,c),route=asRoute(g,[0,0,0],1,0),toe:Vec3=[Math.sin(g.yaw),0,Math.cos(g.yaw)];
  const f=(delta:number)=>{const state=pose({...g,pitchDelta:delta},route);return state.com.reduce((n,v,i)=>n+(v-state.contact[i])*toe[i],0);};
  let lo=-.45,hi=.45;
  if(f(lo)>0||f(hi)<0)throw new Error("旋转任务停止姿态超出本例支撑范围");
  for(let i=0;i<40;i++){const mid=(lo+hi)/2;if(f(mid)<0)lo=mid;else hi=mid;}
  const value=(lo+hi)/2;stopPitches.set(key,value);return value;
}
function asRoute(g:Geometry,position:Vec3,t:number,stage:number):Route {
  return {position,travel:g.speed>1e-8?[Math.sin(g.heading),0,Math.cos(g.heading)]:[0,0,0],
    yaw:g.yaw,roll:g.roll,edgeLoad:Math.abs(g.roll)/rad(13),phase:(stage%4) as 0|1|2|3,
    half:g.roll<0?1:0,progress:t,holding:false,lean:g.roll/rad(13),extension:0,braking:0};
}
function linkedStages():Stage[] {return [
  {at:0,title:"过渡处仍可调整",detail:"双脚固定，下肢准备引导下一弧；肩、髋和雪板各有自己的连续朝向，不规定统一肩角。"},
  {at:.12,title:"前刃弧中自然协调",detail:"膝与髋共同进入脚尖侧，胸廓相对更直立；主要转弯段肩、髋和板总体同向，幅度与时机并不完全相同。"},
  {at:.35,title:"持续到前刃出口",detail:"下肢持续引导，肩部自然接续；不先把肩甩到末端，再让雪板追赶。"},
  {at:.5,title:"经过平板换侧",detail:"旧刃减小，髋胸重新接近可调整关系；不是锁肩，也不是每弯必须回某个固定角度。"},
  {at:.52,title:"后刃逐渐建立",detail:"膝髋折叠、骨盆进入脚跟侧，胸廓相对回板；双腿和肩髋继续自然配合。"},
  {at:.85,title:"后刃完成并释放",detail:"继续形成出口、逐渐减旧刃，仍在移动；片段结束不代表已经停住。"},
];}
function counterStages():Stage[] {return [
  {at:0,title:"已有后刃斜行基线",detail:"先具备可控的后刃调速能力；本段从同一后刃开始，不换刃、不腾空。"},
  {at:.08,title:"先小幅减后刃角",detail:"保留后刃，柔和屈腿并减少刃角，给熟悉的枢转留余量；模型不计算板上压力。"},
  {at:.22,title:"板髋与肩同时反向",detail:"双腿带板略多转向横坡，髋线与板轴同向，肩线在世界坐标中同时反向；不是只把肩板夹角画大。"},
  {at:.42,title:"渐进恢复同后刃",detail:"同一后刃逐渐接住，保留有限滑移；示意速度平顺降低，不据此推算真实刹车力。"},
  {at:.64,title:"先让板髋回原方向",detail:"小幅减后刃角，板与髋平顺回到原斜行朝向，肩先少动；不追加一次同时反拧。"},
  {at:.84,title:"肩部回自然、继续斜行",detail:"板髋已回原方向，肩部再轻松恢复原来的相对朝向；仍用后刃移动，这段没有停车。"},
];}
function stages(c:RotationConfig):Stage[] {
  const task=rotationLessonTask(c);
  if(task==="heel-speed-check")return counterStages();
  if(task==="counter-to-linked")return [
    ...counterStages().map(s=>({...s,at:s.at*.36})),
    {at:.36,title:"解除分离后释放后刃",detail:"先恢复可调整关系，再连续减小旧后刃角；不从扭紧的位置直接硬拧到另一边。"},
    {at:.46,title:"经过平板接自然前刃",detail:"这一处才从旧后刃换到前刃，肩髋已恢复协调；后续不重复专项反向动作。"},
    {at:.4708,title:"前刃逐渐建立",detail:"下肢持续引导新的圆弧，上身自然跟随；保留正常的前后刃姿态差异。"},
    {at:.65,title:"完成自然前刃弧线",detail:"继续形成完整弯形，没有第二次甩肩；专项工具已经退出。"},
    {at:.73,title:"自然换向到后刃",detail:"减前刃，经过平板后再接后刃；这次转换仍按自然连弯组织。"},
    {at:.7408,title:"后刃建立并继续圆弧",detail:"膝髋折叠、胸廓相对回板，肩髋和板总体同向；不重复专项反向动作。"},
    {at:.919,title:"完成后刃弧并释放",detail:"自然完成后刃弧线，再逐渐减旧刃回过渡；片段末态仍在滑行，不是停车。"},
  ];
  if(task==="arms-traverse-stop")return [
    {at:0,title:"短斜滑、轻架双臂",detail:"在同一工作刃上轻抬双臂作为肩线参考，肘保持弯曲；手臂不负责带板转向。"},
    {at:.18,title:"短暂转头观察",detail:"头部作小幅侧向观察，肩髋和板保持原来的路线；本段只是有限侧看，不示范完整上坡观察。"},
    {at:.25,title:"及时看回前方",detail:"头部正在回原朝向，肩线和板轴未被带走。"},
    {at:.36,title:"放下双臂",detail:"撤掉手臂参考，保留同一工作刃和斜行方向。"},
    {at:.54,title:"自然手臂再观察一次",detail:"放松手臂重复短暂侧看并回前方，核对路线仍保持；不要依赖僵直架臂。"},
    {at:.8,title:"独立完成停止",detail:"观察已经结束；下肢引导板逐渐朝横坡，平顺减速并调整板角，始终保留工作刃；停止不由转头或甩臂触发。"},
  ];
  if(task==="arms-linked-feedback")return [
    {at:0,title:"轻架双臂作参考",detail:"先做一组自然圆弯，双臂舒适微弯；手的位置只帮助观察肩线。"},
    {at:.12,title:"观察肩线的连续变化",detail:"下肢持续引导板，肩部顺着路线协调；本段展示可控基线，不故意制造突然抢肩。"},
    {at:.43,title:"逐渐撤掉手臂参考",detail:"放低双臂，保持原有下肢编排和弯形；不反向拉扯手臂纠正。"},
    {at:.5,title:"自然双臂复测同样两弯",detail:"第二组重复同一弯形与关节编排，手臂已经放松；比较两组连续过程。"},
    {at:.85,title:"保持控制，继续路线",detail:"没有手臂参考仍按计划完成弯形；动画结束表示片段结束，不表示停车。"},
  ];
  if(task==="orientation-progression")return [
    {at:0,title:"第一组：自然连弯基线",detail:"先记录同一弯形下的自然肩髋、屈伸与身体倾斜；角度均为作者示意，不是标准姿态。"},
    {at:.2,title:"第二组：只改肩髋朝向",detail:"保持同样路线与板角，只小幅调整肩髋朝向；固定脚位下两腿会随之配合。下一组先回基线。"},
    {at:.4,title:"第三组：只改屈伸时机",detail:"肩髋回基线，只小幅移动屈伸时机；保持弯形和板角，不能由高度推出压力效果。"},
    {at:.6,title:"第四组：只比较身体倾斜",detail:"朝向和时机回基线，在相同板角下小幅改变下肢与胸廓的成角关系；同路线不证明更抓地。"},
    {at:.8,title:"第五组：回自然连弯",detail:"撤掉全部刻意变化，重做基线；根据真实滑行结果决定是否保留某项调整。"},
  ];
  if(task==="toe-orientation-stop"||task==="heel-baseline-stop"){
    const toe=task==="toe-orientation-stop",edge=toe?"前刃":"后刃";
    return [
      {at:0,title:"同脚位、短入口",detail:toe?"用对照按钮选择自然朝向或略多开放，整条路线、脚位、板角与时间完全相同；不证明某个肩角更优。":"这是自然朝向下的后刃可控基线，不复现板尾乱甩的全部成因。"},
      {at:.1,title:"逐渐建立"+edge,detail:toe?"双腿持续引导单弧，减少过量开放不等于强扣肩或硬扭固定脚位。":"膝髋折叠、骨盆进入脚跟侧，胸廓相对回板；不靠猛折踝或踢后脚转向。"},
      {at:.4,title:"持续完成单个圆弧",detail:"肩髋随板连续转向，两腿始终保留活动余量；这是同源几何示意，没有计算两脚压力比例。"},
      {at:.8,title:"同出口、渐停保刃",detail:"板逐渐朝横坡，位移平顺停止，保留"+edge+"；不把暂停播放当作停车。"},
    ];
  }
  return linkedStages();
}
export function sampleRotationLesson(time:number,c:RotationConfig,stance:Stance="regular"):LessonFrame {
  if(!isRotationLesson(c))throw new Error("不是旋转课程："+c.type);
  const t=clamp(Number.isFinite(time)?time:0),g=geometry(t,c),ss=stages(c);
  const stage=ss.reduce((last,s,i)=>t>=s.at?i:last,0),task=rotationLessonTask(c);
  if(task.endsWith("-stop"))g.pitchDelta=stopPitchDelta(c)*ramp(t,.8,1);
  const route=asRoute(g,position(t,c),t,stage);
  const state=applyStance(pose(g,route),stance);
  if(g.speed<=1e-8)state.metrics.skidAngle=0;
  if(t===1&&g.speed===0){ss[stage]={...ss[stage],title:"已停住，保留"+(state.edge==="toe"?"前刃":"后刃"),detail:"本次单次任务已经结束，工作刃和关节余量保留；重新播放才开始下一次。"};}
  state.phaseName=ss[stage].title;
  return {state,stage,stages:ss,task:rotationLessonTask(c),moving:true};
}
