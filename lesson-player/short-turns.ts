import {applyStance,buildPose,type MotionState,type PoseOptions,type Route,type Stance,type Vec3} from "../prototype/motion";
import type {LessonConfig,LessonFrame,Stage} from "./motion";

export type ShortTransition="extend"|"flex"|"retract";
export type ShortTask="round-linked-skid"|"easy-linked-check"|"side-slip-link"|"size-ladder"|"tail-brake-study"|"asymmetric-rhythm-study"|"shoulder-led-study"|"late-edge-release-study"|"low-flexion-study"|"inclination-comparison"|"centered-pivot-study"|"nose-pivot-study"|"back-seat-study";
export type ShortLessonConfig=LessonConfig & {transition?:ShortTransition};
type Config=ShortLessonConfig;
type Edge="toe"|"heel";
const PI=Math.PI,TAU=2*PI,rad=(x:number)=>x*PI/180;
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const ease=(x:number)=>{const u=clamp(x);return u*u*u*(10+u*(-15+6*u));};
const dease=(u:number)=>30*u*u*(1-u)*(1-u);
const mix=(a:number,b:number,q:number)=>a+(b-a)*q;
const opposite=(e:Edge):Edge=>e==="toe"?"heel":"toe";
const sign=(e:Edge)=>e==="toe"?1:-1;
const edgeName=(e:Edge)=>e==="toe"?"前刃":"后刃";
const meanLength=(s:MotionState)=>(Math.hypot(...s.joints.frontHip.map((v,i)=>v-s.joints.frontAnkle[i]))+Math.hypot(...s.joints.rearHip.map((v,i)=>v-s.joints.rearAnkle[i])))/2;
const wave=(w:number)=>w*w*w*(1+.12*.12)/(w*w+.12*.12);
const extraTasks:Record<string,Record<string,ShortTask>>={
  "short-turns":{"tail-brake":"tail-brake-study",asymmetric:"asymmetric-rhythm-study","shoulder-led":"shoulder-led-study","edge-locked":"late-edge-release-study","low-stuck":"low-flexion-study","over-inclined":"inclination-comparison"},
  "short-turn-progression":{"medium-to-short":"size-ladder","short-steady":"size-ladder","short-to-medium":"size-ladder"},
  "short-turn-balance":{centered:"centered-pivot-study","nose-pivot":"nose-pivot-study","back-seat":"back-seat-study"},
};

export function shortTurnTask(c:Config):ShortTask|undefined{
  if(c.type==="short-turns"&&c.variant==="round"){
    if(c.transition&&!["extend","flex","retract"].includes(c.transition))return undefined;
    if(c.task==="easy-linked-check")return !c.transition||c.transition==="extend"?"easy-linked-check":undefined;
    if(c.task&&c.task!=="round-linked-skid")return undefined;
    return "round-linked-skid";
  }
  if(c.type==="short-turn-progression"&&["side-slip","side-slip-shorter","linked"].includes(c.variant??"")){
    if(c.transition&&c.transition!=="extend")return undefined;
    if(c.task&&c.task!=="side-slip-link")return undefined;
    return "side-slip-link";
  }
  const task=extraTasks[c.type]?.[c.variant??""];
  if(task&&(!c.task||c.task===task)&&(!c.transition||c.transition==="extend"))return task;
}
export const supportsShortTurnLesson=(c:Config)=>shortTurnTask(c)!==undefined;
// The tail-brake example uses extension. Keep flexion/retraction lessons on
// their own strategy instead of offering an incompatible comparison config.
export function supportsShortTurnComparison(c:Config):boolean {
  const task=shortTurnTask(c);
  return (task==="round-linked-skid"||task==="tail-brake-study")&&(!c.transition||c.transition==="extend");
}
/** Authored real timeline. The turn itself always lasts 4000 ms in this ladder. */
export function shortTurnTiming(c:Config){
  if(shortTurnTask(c)!=="side-slip-link")return null;
  const waitMs=c.variant==="side-slip"?3000:c.variant==="side-slip-shorter"?1200:0;
  const turnMs=4000,halfMs=waitMs+turnMs,totalMs=2*halfMs;
  return {waitMs,turnMs,halfMs,totalMs};
}
export function shortTurnDurationMs(c:Config){
  return shortTurnTiming(c)?.totalMs??Math.max(4000,c.duration??14000);
}
type Geometry={r:Route;heading:number;u:number;halfIndex:number;from:Edge;targetLength:number;linked:boolean};
function makeRoute(position:Vec3,travel:Vec3,yaw:number,roll:number,u:number,from:Edge,holding=false):Route{
  return {position,travel,yaw,roll,edgeLoad:Math.abs(roll)/rad(26),phase:0,half:from==="toe"?1:0,progress:u,holding,lean:roll/rad(26),extension:0,braking:0};
}
function roundGeometry(t:number,c:Config,task:ShortTask):Geometry{
  // Four apex-to-apex half-cycles. Start and finish are moving control phases.
  const cycles=2,from=c.fromEdge??"heel",s=sign(from),p=t*cycles,phi=TAU*p,w=Math.cos(phi);
  const retraction=c.transition==="retract",easy=task==="easy-linked-check";
  const amplitude=retraction?.42:easy?2.4:1.3,length=retraction?6.4:easy?17:9;
  const maxRoll=rad(retraction?26:easy?11:14),skid=rad(retraction?7:easy?10:13);
  const dx=-s*amplitude*TAU*Math.sin(phi),heading=Math.atan2(dx,length);
  const yaw=heading-PI/2-s*skid*w,roll=s*maxRoll*wave(w);
  const halfIndex=t===1?3:Math.floor(t*4),u=t===1?1:t*4-halfIndex;
  const halfFrom=halfIndex%2===0?from:opposite(from);
  const mode=c.transition??"extend",q=1-w*w;
  // Control actual geometric hip-to-ankle distance, never pelvis height.
  const targetLength=mode==="extend"?.77+.04*q:mode==="flex"?.81-.06*q:.81-.05*q;
  return {r:makeRoute([s*amplitude*w,0,length*p],[Math.sin(heading),0,Math.cos(heading)],yaw,roll,u,halfFrom),heading,u,halfIndex,from:halfFrom,targetLength,linked:false};
}
// Retain the reviewed side-slip connector geometry, but give it a real clock.
// Changing waiting never changes this curve or its 4000 ms turn interval.
function sideTurn(v:number,s:number){
  const e=ease(v),dx=-s*.65*PI*Math.cos(PI*e)*dease(v),heading=Math.atan2(dx,3.6);
  const w=v/(v+.36*(1-v)),yawProgress=w*w*(3-2*w);
  const yaw=-PI/2-s*PI/2+s*PI*yawProgress,slip=yaw-(heading-PI/2);
  return {x:-s*.65*Math.sin(PI*e),heading,yaw,slip,roll:-rad(15)*wave(Math.sin(slip))};
}
const SIDE_FLAT=(()=>{
  let lo=0,hi=1;
  for(let i=0;i<40;i++){const mid=(lo+hi)/2;if(sideTurn(mid,-1).slip>0)lo=mid;else hi=mid;}
  return (lo+hi)/2;
})();
function sideGeometry(t:number,c:Config):Geometry{
  const timing=shortTurnTiming(c)!,ms=t*timing.totalMs;
  const halfIndex=t===1?1:Math.floor(ms/timing.halfMs),local=ms-halfIndex*timing.halfMs;
  const initial=c.fromEdge??"heel",from=halfIndex===0?initial:opposite(initial),s=sign(from);
  const holding=timing.waitMs>0&&local<timing.waitMs,v=holding?0:clamp((local-timing.waitMs)/timing.turnMs);
  const turnDistance=3.6,speed=turnDistance/(timing.turnMs/1000);
  const waitDistance=speed*timing.waitMs/1000,halfDistance=waitDistance+turnDistance;
  const g=sideTurn(v,s),z=halfIndex*halfDistance+(holding?speed*local/1000:waitDistance+turnDistance*v);
  const first=from==="heel"?.78:.775,last=from==="heel"?.775:.78;
  const targetLength=v<SIDE_FLAT?mix(first,.815,ease(v/SIDE_FLAT)):mix(.815,last,ease((v-SIDE_FLAT)/(1-SIDE_FLAT)));
  return {r:makeRoute([g.x,0,z],[Math.sin(g.heading),0,Math.cos(g.heading)],g.yaw,g.roll,v,from,holding),heading:g.heading,u:v,halfIndex,from,targetLength,linked:true};
}
// Scale changes are authored in route phase p, then timed by downhill distance.
// Both derivatives of A(p) cos(2πp) are included in the tangent. This keeps the
// heading honest while the route shrinks, and shorter arcs take less time.
const scaleEase=(p:number)=>ease((p-.5)/2);
const scaleEaseDerivative=(p:number)=>p<=.5||p>=2.5?0:dease((p-.5)/2)/2;
const scaleEaseIntegral=(p:number)=>p<=.5?0:p>=2.5?p-1.5:(()=>{const u=(p-.5)/2;return 2*(2.5*u**4-3*u**5+u**6);})();
function sizeScale(p:number,c:Config){
  const reverse=c.variant==="short-to-medium",steady=c.variant==="short-steady";
  const a=steady?1:reverse?1:1.85,b=steady?1:reverse?1.85:1;
  return {value:mix(a,b,scaleEase(p)),derivative:(b-a)*scaleEaseDerivative(p),distance:9*(a*p+(b-a)*scaleEaseIntegral(p))};
}
// p counts apex-to-apex halves. Flat is at the half-integers, so this smooth
// density gives complete flat-to-flat working-edge arcs of 3.6 m / 6.4 m.
// Timing by this same distance gives those arcs 36% / 64% of each cycle.
const asymmetricDistance=(p:number)=>5*p+.7*Math.sin(PI*p);
const asymmetricTangent=(p:number)=>5+.7*PI*Math.cos(PI*p);
function halfTime(c:Config,task:ShortTask,index:number,u:number){
  if(task==="size-ladder")return sizeScale((index+u)/2,c).distance/sizeScale(3,c).distance;
  if(task==="asymmetric-rhythm-study")return asymmetricDistance(index+u)/20;
  return (index+u)/4;
}
function halfClock(t:number,c:Config,task:ShortTask){
  const count=task==="size-ladder"?6:4;
  let halfIndex=count-1;
  for(let i=0;i<count;i++)if(t<halfTime(c,task,i,1)){halfIndex=i;break;}
  const start=halfTime(c,task,halfIndex,0),end=halfTime(c,task,halfIndex,1);
  if(task==="asymmetric-rhythm-study"){
    let lo=halfIndex,hi=halfIndex+1;
    for(let i=0;i<40;i++){const p=(lo+hi)/2;if(asymmetricDistance(p)/20<t)lo=p;else hi=p;}
    return {halfIndex,u:clamp((lo+hi)/2-halfIndex)};
  }
  if(task!=="size-ladder")return {halfIndex,u:clamp((t-start)/(end-start))};
  let lo=halfIndex/2,hi=(halfIndex+1)/2;
  for(let i=0;i<36;i++){const p=(lo+hi)/2;if(sizeScale(p,c).distance/sizeScale(3,c).distance<t)lo=p;else hi=p;}
  return {halfIndex,u:clamp((lo+hi)-halfIndex)};
}
function sizeGeometry(t:number,c:Config):Geometry{
  const clock=halfClock(t,c,"size-ladder"),p=(clock.halfIndex+clock.u)/2,phi=TAU*p;
  const initial=c.fromEdge??"heel",s=sign(initial),scale=sizeScale(p,c),w=Math.cos(phi);
  const x=s*1.3*scale.value*w,dx=s*1.3*(scale.derivative*w-scale.value*TAU*Math.sin(phi));
  const heading=Math.atan2(dx,9*scale.value),yaw=heading-PI/2-s*rad(13)*w,roll=s*rad(14)*wave(w);
  const from=clock.halfIndex%2?opposite(initial):initial;
  return {r:makeRoute([x,0,scale.distance],[Math.sin(heading),0,Math.cos(heading)],yaw,roll,clock.u,from),heading,...clock,from,targetLength:.77+.04*(1-w*w),linked:false};
}
function authoredPhase(u:number,task:ShortTask){
  const delay=task==="tail-brake-study"?.42:task==="shoulder-led-study"?.32:task==="back-seat-study"?.25:0;
  if(task==="late-edge-release-study"){
    const first=u<.5,local=first?u/.5:(u-.5)/.5,amount=first?.18:.82;
    return {q:(first?0:.18)+amount*ease(local),dq:amount*dease(local)/.5};
  }
  const v=clamp((u-delay)/(1-delay));
  return {q:ease(v),dq:u<=delay?0:dease(v)/(1-delay)};
}
function exampleGeometry(t:number,c:Config,task:ShortTask):Geometry{
  if(["centered-pivot-study","low-flexion-study","inclination-comparison"].includes(task)){
    const g=roundGeometry(t,c,"round-linked-skid");
    if(task==="low-flexion-study")g.targetLength=.705+.004*Math.sin(PI*g.u)**2;
    return g;
  }
  const {halfIndex,u}=halfClock(t,c,task),initial=c.fromEdge??"heel",from=halfIndex%2?opposite(initial):initial,s=sign(from);
  const {q,dq}=authoredPhase(u,task),w=Math.cos(PI*q);
  const length=4.5,prior=halfIndex*length;
  const amplitude=task==="tail-brake-study"?.82:1.3;
  let x=s*amplitude*w,z=prior+length*u,dx=-s*amplitude*PI*Math.sin(PI*q)*dq,dz=length;
  if(task==="asymmetric-rhythm-study"){z=asymmetricDistance(halfIndex+u);dz=asymmetricTangent(halfIndex+u);}
  let heading=Math.atan2(dx,dz),yaw=heading-PI/2-s*rad(task==="tail-brake-study"?27:13)*w;
  let roll=s*rad(14)*wave(w);
  if(task==="nose-pivot-study"){
    // Constrain the nose path directly, then derive the centre and its tangent.
    // The nose glides 1.5 m per half-cycle; it is never a pinned snow contact.
    yaw=-PI/2-s*rad(48)*w;
    const dyaw=s*rad(48)*PI*Math.sin(PI*q)*dq;
    x=-.79*Math.cos(yaw);z=1.5*(halfIndex+u)+.79*Math.sin(yaw);
    dx=.79*Math.sin(yaw)*dyaw;dz=1.5+.79*Math.cos(yaw)*dyaw;
    heading=Math.atan2(dx,dz);
    const slip=yaw-(heading-PI/2);
    roll=-rad(14)*wave(Math.sin(slip));
  }
  return {r:makeRoute([x,0,z],[Math.sin(heading),0,Math.cos(heading)],yaw,roll,u,from),heading,u,halfIndex,from,targetLength:.77+.04*(1-w*w),linked:false};
}
// The shoulder leads the first sweep, waits for the board to catch up, then
// returns with it. A separate sine wave would start returning before the board
// had even begun its sweep. Find the peak of the actual authored board signal.
const SHOULDER_SWEEP_PEAK=(()=>{
  const c:Config={type:"short-turns",variant:"shoulder-led",fromEdge:"heel"};
  const yaw=(u:number)=>exampleGeometry(u/4,c,"shoulder-led-study").r.yaw;
  let lo=.32,hi=1;
  for(let i=0;i<60;i++){const a=(2*lo+hi)/3,b=(lo+2*hi)/3;if(yaw(a)<yaw(b))lo=a;else hi=b;}
  return (lo+hi)/2;
})();
function geometry(t:number,c:Config,task:ShortTask){
  if(task==="side-slip-link")return sideGeometry(t,c);
  if(task==="size-ladder")return sizeGeometry(t,c);
  if(task!=="round-linked-skid"&&task!=="easy-linked-check")return exampleGeometry(t,c,task);
  return roundGeometry(t,c,task);
}
function pose(g:Geometry,bend:number,c:Config):PoseOptions{
  const toe=Math.max(0,g.r.roll/rad(26)),heel=Math.max(0,-g.r.roll/rad(26));
  const shoulderYaw=g.linked?-PI/2+.3+.72*(g.r.yaw+PI/2):-PI/2+.28+(c.transition==="retract"?.28:.55)*g.heading+.15*(g.r.yaw-(g.heading-PI/2));
  const result:PoseOptions={cuffPitch:14+4*toe-2*heel,rearCuffPitch:14+4*toe-2*heel,legBend:bend,hipYaw:g.r.yaw+.1,shoulderYaw,torsoPitch:.14+.012*(bend-32)+.2*heel-.25*toe,lookDirection:g.r.travel};
  const task=shortTurnTask(c);
  if(task==="shoulder-led-study"){
    const lead=g.u<SHOULDER_SWEEP_PEAK?Math.min(g.u+.24,SHOULDER_SWEEP_PEAK):g.u;
    const boardYaw=exampleGeometry((g.halfIndex+lead)/4,c,task).r.yaw;
    const desired=-PI/2+.28+.55*(boardYaw+PI/2);
    // buildPose projects the shoulder axis perpendicular to the trunk. Invert
    // its horizontal projection so the *visible world shoulder line* follows
    // this timing, including the catch-up pause, while the trunk can still bend.
    const correction=Math.tan(result.torsoPitch!)**2*Math.sin(g.r.yaw-desired);
    result.shoulderYaw=Math.atan2(Math.sin(desired)-correction*Math.cos(g.r.yaw),Math.cos(desired)+correction*Math.sin(g.r.yaw));
  }
  if(task==="inclination-comparison")result.torsoPitch!+=g.r.roll*1.3;
  if(task==="nose-pivot-study"||task==="back-seat-study"){
    const fore=task==="nose-pivot-study"?1:-1;
    result.shinSide=rad(7)*fore;result.hipTilt=rad(5)*fore;result.torsoAlong=.08*fore;
  }
  return result;
}
function regularState(t:number,c:Config,task:ShortTask):MotionState{
  const g=geometry(t,c,task),at=(b:number)=>buildPose(g.r,"correct",pose(g,b,c));
  let lo=20,hi=80;
  if(meanLength(at(lo))<g.targetLength||meanLength(at(hi))>g.targetLength)throw new Error("本小回转任务腿长超出可达范围");
  for(let i=0;i<32;i++){const m=(lo+hi)/2;if(meanLength(at(m))>g.targetLength)lo=m;else hi=m;}
  const state=at((lo+hi)/2),a=state.joints.frontShoulder,b=state.joints.rearShoulder;
  // Use the visible shoulder line, keeping exact route following in the middle
  // 45°. Between 45° and 75° of requested turn, reduce the derivative smoothly
  // from 1 to 0; the displayed neck turn reaches 60° and then stays bounded.
  // This local C1 limit avoids buildPose's hard-clamp velocity step without
  // changing the shared model, route, or body. These are authored display limits.
  const shoulder=Math.atan2(-(a[2]-b[2]),a[0]-b[0]);
  const requested=Math.atan2(Math.sin(g.heading-shoulder),Math.cos(g.heading-shoulder));
  const magnitude=Math.abs(requested),u=clamp((magnitude-rad(45))/rad(30));
  const turn=magnitude<=rad(45)?magnitude:rad(45)+rad(30)*(u-u*u/2);
  const heading=shoulder+Math.sign(requested)*turn;
  state.gaze=[Math.sin(heading),0,Math.cos(heading)];
  return state;
}
const edgeEventCache=new Map<string,{enter:number;leave:number}>();
function edgeEvents(c:Config,task:ShortTask,from:Edge){
  const key=[task,c.variant,c.transition,from].join(":"),found=edgeEventCache.get(key);if(found)return found;
  const conf={...c,fromEdge:from};
  const state=(u:number)=>task==="side-slip-link"?regularState((shortTurnTiming(conf)!.waitMs+u*shortTurnTiming(conf)!.turnMs)/shortTurnTiming(conf)!.totalMs,conf,task):regularState(u/4,conf,task);
  const flat=task==="side-slip-link"?SIDE_FLAT:.5;
  if(state(0).edge!==from||state(flat).edge!=="flat"||state(1).edge!==opposite(from))throw new Error("小回转实际刃事件与任务不符");
  let lo=0,hi=flat;
  for(let i=0;i<36;i++){const m=(lo+hi)/2;if(state(m).edge===from)lo=m;else hi=m;}
  const enter=hi;lo=flat;hi=1;
  for(let i=0;i<36;i++){const m=(lo+hi)/2;if(state(m).edge===opposite(from))hi=m;else lo=m;}
  const result={enter,leave:hi};edgeEventCache.set(key,result);return result;
}
const exampleStagesCache=new Map<string,Stage[]>();
function exampleStages(c:Config,task:ShortTask):Stage[]{
  const key=[c.type,c.variant,c.transition,task,c.fromEdge].join(":"),saved=exampleStagesCache.get(key);if(saved)return saved;
  const descriptions:Partial<Record<ShortTask,{title:string;detail:string}>>={
    "size-ladder":{title:c.variant==="medium-to-short"?"弯的宽度和下降距离一起缩小":c.variant==="short-to-medium"?"弯的宽度和下降距离一起放大":"保持连续小弯",detail:c.variant==="short-steady"?"本组连续小弯保持同一弯的宽度与下降距离，也保持相同的单弯用时。具体宽度、下降距离和用时是示意设置，无需照着动画规定自己的练习。":"同时观察弯的宽度与下降距离；本示例较短的弯用时也较短。具体宽度、下降距离和用时是示意设置，无需照着动画规定自己的练习。"},
    "tail-brake-study":{title:"识别前段较直、后段集中转向",detail:"前段路线较直，随后雪板朝向和路线集中改变；看整弯的分配，不把所有滑移都当错误。这里只展示运动，不计算真实减速度。"},
    "asymmetric-rhythm-study":{title:"比较两侧用时与弯形",detail:"一侧沿坡更长、用时更久，另一侧更短更急；同一表现可能有不同原因，不能仅凭动画判定肩部是原因。"},
    "shoulder-led-study":{title:"肩部先动，髋与板稍后追转",detail:"先看两肩连线相对雪道怎样转动，再看髋与雪板什么时候跟着转；识别先后关系，不照着反例练习。"},
    "late-edge-release-study":{title:"旧刃保留较久，随后集中释放",detail:"旧侧弯段延长后才释放；图中使用的板刃仍适合当时的滑移方向，没有用强行翻到迎雪一侧板刃来夸大错误。"},
    "low-flexion-study":{title:"一直屈腿，几乎没有屈伸",detail:"观察髋到脚踝的距离持续较短，转换活动较少；与回收策略的先缩短、再恢复区分，不由低姿态推断压力。"},
    "inclination-comparison":{title:"比较更多整体内倾的姿态",detail:"同一路线和板角下，胸部更多随身体移向工作刃一侧；图中没有计算雪板与雪面的实际受力，不能据此声称已经模拟滑出或必然失控。"},
    "centered-pivot-study":{title:"板头板尾都持续移动",detail:"双脚仍固定，板头板尾随路线共同转向；居中是可调整的位置关系，不是固定雪上转轴或50/50压力。"},
    "nose-pivot-study":{title:"板头滑动较少，板尾集中扫动",detail:"本段直接约束板头路径：板头仍沿坡滑动，局部位移比板尾扫幅小。图中同时出现身体略偏前与板尾扫动，不能据此认定前脚压力有多大，或一定是身体偏前造成了板尾扫动。"},
    "back-seat-study":{title:"身体偏向后脚，转向开始较晚",detail:"骨盆和胸部实际向后脚侧偏移，双脚仍固定；动画将这一姿态与迟转配对，图中没有测量前脚受力是否减少。"},
  };
  const description=descriptions[task]!;
  const count=task==="size-ladder"?6:4,initial=c.fromEdge??"heel",stages:Stage[]=[];
  for(let index=0;index<count;index++){
    const from=index%2?opposite(initial):initial,to=opposite(from),at=(u:number)=>halfTime(c,task,index,u);
    const edge=(u:number)=>regularState(at(u),c,task).edge;
    let enter=-1,leave=-1,previous=edge(0);
    if(previous!==from)throw new Error("示例起始工作刃与阶段不符");
    for(let i=1;i<=240;i++){
      const current=edge(i/240);
      if(current!==previous){
        if(previous===from&&current==="flat"&&enter<0||previous==="flat"&&current===to&&enter>=0&&leave<0){
          let lo=(i-1)/240,hi=i/240;
          for(let k=0;k<30;k++){const m=(lo+hi)/2;if(edge(m)===previous)lo=m;else hi=m;}
          if(enter<0)enter=hi;else leave=hi;
        }else throw new Error("示例单次换侧出现多余或逆向刃事件");
        previous=current;
      }
    }
    if(enter<0||leave<0||previous!==to)throw new Error("示例未完成一次旧刃—平板—新刃转换");
    stages.push(
      {at:at(0),title:edgeName(from)+"控制段",detail:description.detail},
      {at:at(Math.min(.08,enter/2)),title:description.title,detail:description.detail},
      {at:at(enter),title:"实际进入近平板",detail:"此标签来自实际板角；持续经过转换，不把低刃角称为无压力。"},
      {at:at(leave),title:"逐渐接上"+edgeName(to),detail:"新刃的选择仍配合当前移动方向；双脚仍固定，继续比较雪板朝向、路线与身体怎样配合。"},
      {at:at(leave+(1-leave)*.72),title:edgeName(to)+"控制段继续滑行",detail:task==="size-ladder"?(c.variant==="short-steady"?"继续完成本侧弧线；本组小弯保持相同大小，结束时仍在滑行。":"继续完成本侧弧线；逐渐改变弯形大小后，结束时仍在滑行，重播是重看整组，不代表首尾弯宽相同。") :"本段仍在滑行，结束进度不表示已经停车。"},
    );
  }
  exampleStagesCache.set(key,stages);return stages;
}
function stagesFor(c:Config,task:ShortTask):Stage[]{
  if(!["round-linked-skid","easy-linked-check","side-slip-link"].includes(task))return exampleStages(c,task);
  const initial=c.fromEdge??"heel",timing=shortTurnTiming(c);
  if(timing)return [0,1].flatMap(i=>{
    const from=i===0?initial:opposite(initial),to=opposite(from),e=edgeEvents(c,task,from);
    const at=(v:number)=>(i*timing.halfMs+timing.waitMs+v*timing.turnMs)/timing.totalMs;
    return [
      ...(timing.waitMs?[{at:i*timing.halfMs/timing.totalMs,title:"稳住"+edgeName(from)+"侧滑",detail:"横板沿坡下侧滑；此段是等待，不是停车。三档侧滑速度与单次换侧用时保持一致。"}]:[]),
      {at:at(0),title:"释放"+edgeName(from)+"，开始完整换侧",detail:"本次换侧固定为4秒的示意时间；逐渐减小旧刃的刃角，腿长温和增加，不能抢翻迎雪刃。"},
      {at:at(e.enter),title:"连续通过近平板",detail:"按实际雪板朝向与移动方向释放旧刃；保持接触，不在这里停住等待。"},
      {at:at(e.leave),title:"渐进接上"+edgeName(to),detail:"新侧仍为适合当前滑移方向的工作刃；膝髋协调调整，不猛踢板尾。"},
      {at:at(.88),title:"完成换侧，恢复"+edgeName(to)+"侧滑",detail:timing.waitMs?"完成同一个转弯后再进入等待；少等多久只影响等待段，不压缩单弯。":"不增加等待，下一次换侧连续接上；仍保留侧滑接单弯的路线，区别于另一组普通连续圆弯。"},
    ];
  });
  const mode=c.transition??"extend";
  return [0,1,2,3].flatMap(i=>{
    const from=i%2===0?initial:opposite(initial),to=opposite(from),e=edgeEvents(c,task,from);
    const at=(u:number)=>(i+u)/4;
    return [
      {at:at(0),title:edgeName(from)+"控制段",detail:task==="easy-linked-check"?"使用较宽、下降距离较长的圆弯作首趟检查；本段不替代此前的两刃停止检查。":"保留完整弯形和可控滑移；双腿继续有活动余量，上身平顺但不锁住。"},
      {at:at(.12),title:mode==="extend"?"减旧刃，温和伸腿":mode==="flex"?"减旧刃，协调屈腿":"减旧刃，协调回收",detail:mode==="extend"?"髋到脚踝的距离逐渐增加；屈伸与调刃共同衔接，伸腿不等于即时卸压。":mode==="flex"?"髋到脚踝的距离逐渐缩短，身体向板降低；板路线与伸展示例保持一致。":"髋到脚踝的距离缩短，雪板相对身体横向运行更明显；不把肩膀强行固定朝向雪道的某一个方向，不把身体高度强行固定。"},
      {at:at(e.enter),title:"连续经过近平板",detail:"这里雪板的刃角已经很小；不是没有压力，也不是停在平板等下一弯。"},
      {at:at(e.leave),title:"逐渐建立"+edgeName(to),detail:mode==="extend"?"温和恢复屈腿，按新弯调节膝髋与胸部；不锁腿或横踢后脚。":"逐渐恢复腿长，允许上身自然随路线调整；不把恢复腿长做成踢板。"},
      {at:at(.88),title:"进入"+edgeName(to)+"控制段",detail:"板头和板尾持续移动，仍在滑行；这组结束不表示已经停车。"},
    ];
  });
}
export function sampleShortTurnLesson(time:number,c:Config,stance:Stance="regular"):LessonFrame{
  const t=clamp(Number.isFinite(time)?time:0),task=shortTurnTask(c);
  if(!task)throw new Error("尚未实现的小回转变体或过渡组合");
  const stages=stagesFor(c,task),stage=stages.reduce((n,s,i)=>t>=s.at?i:n,0),state=applyStance(regularState(t,c,task),stance);
  state.phase=Math.min(3,stage) as 0|1|2|3;state.phaseName=stages[stage].title;state.turnProgress=t;
  return {state,stage,stages,task,moving:true};
}
