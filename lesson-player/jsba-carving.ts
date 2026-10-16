import {applyStance, type PoseOptions, type Route, type Stance, type Vec3} from "../prototype/motion";
import {poseAtLegLength} from "./leg-length";
import type {LessonConfig, LessonFrame, Stage} from "./motion";

/** Authored kinematic tasks informed by JSBA's movement families. These are
 * not official demonstrations, a force solver or a model fitted to one coach. */
export type JsbaCarvingTask = "basic-linked-carve"|"dynamic-linked-carve"|"carve-load-exit"|"carved-short-turns"|"carve-size-change"|"low-linked-carve";
type Option={value:string;label:string};
const options:Record<JsbaCarvingTask,readonly Option[]>={
  "basic-linked-carve":[{value:"reference",label:"伸展过渡参考"},{value:"late-body",label:"对照：身体准备偏晚"}],
  "dynamic-linked-carve":[{value:"reference",label:"收腿过渡参考"},{value:"late-retraction",label:"对照：收腿准备偏晚"}],
  "carve-load-exit":[{value:"complete",label:"持续完成出口"},{value:"cut-exit",label:"对照：出口偏浅"}],
  "carved-short-turns":[{value:"reference",label:"连续刻滑短弯"},{value:"pivoted",label:"反例：弧中主动拧板"}],
  "carve-size-change":[{value:"large-to-short",label:"大 → 中 → 小 → 中"},{value:"short-to-large",label:"小 → 中 → 大 → 中"}],
  "low-linked-carve":[{value:"low-dynamic",label:"较低：收腿过渡"},{value:"normal-dynamic",label:"正常高度：收腿过渡"},{value:"low-basic",label:"较低：伸展过渡"},{value:"recover",label:"正常 → 较低 → 恢复"},{value:"chest-dive",label:"反例：前刃胸部先扑入"}],
};
const PI=Math.PI,rad=(n:number)=>n*PI/180,clamp=(x:number)=>Math.max(0,Math.min(1,x));
const smooth=(x:number)=>{const u=clamp(x);return u*u*u*(10-15*u+6*u*u);};
export function supportsJsbaCarvingLesson(c:LessonConfig):boolean {
  return c.type==="jsba-carving"&&Object.hasOwn(options,c.task??"")
    &&options[c.task as JsbaCarvingTask].some(o=>o.value===c.variant)
    &&(c.fromEdge===undefined||c.fromEdge==="toe"||c.fromEdge==="heel")
    &&c.transition===undefined&&c.posture===undefined&&c.turnShape===undefined
    &&c.timing===undefined&&c.rotationComparison===undefined&&c.twistTiming===undefined
    &&c.pressureDiagram!==true;
}
export function jsbaCarvingVariants(c:LessonConfig):readonly Option[]{
  if(!supportsJsbaCarvingLesson(c))throw new Error("尚未实现的 JSBA 刻滑任务/策略组合");
  return options[c.task as JsbaCarvingTask];
}
export function jsbaCarvingComparison(c:LessonConfig):{config:LessonConfig;label:string}|null {
  if(!supportsJsbaCarvingLesson(c))return null;
  const target=c.task==="low-linked-carve"?({"low-dynamic":"normal-dynamic","normal-dynamic":"low-dynamic","low-basic":"low-dynamic",recover:"normal-dynamic","chest-dive":"low-dynamic"}[c.variant!]):options[c.task as JsbaCarvingTask].find(o=>o.value!==c.variant)?.value;
  const option=options[c.task as JsbaCarvingTask].find(o=>o.value===target);
  return option?{config:{...c,variant:option.value},label:option.label}:null;
}
export const jsbaCarvingDurationMs=(c:LessonConfig)=>Math.max(12000,c.duration??(c.task==="carve-size-change"?30000:c.task==="carved-short-turns"?20000:24000));

type Plan={lengths:number[];angle:number;roll:number;labels:string[]};
function plan(c:LessonConfig):Plan {
  if(c.task==="carve-size-change"){
    const large=c.variant==="large-to-short";
    return {lengths:large?[17,17,12,12,7.5,7.5,12,12]:[7.5,7.5,12,12,17,17,12,12],angle:rad(51),roll:rad(30),labels:large?["大弯","大弯","中弯","中弯","小弯","小弯","恢复中弯","恢复中弯"]:["小弯","小弯","中弯","中弯","大弯","大弯","恢复中弯","恢复中弯"]};
  }
  if(c.task==="carved-short-turns")return {lengths:Array(8).fill(7.5),angle:rad(48),roll:rad(29),labels:Array(8).fill("刻滑短弯")};
  if(c.task==="carve-load-exit")return {lengths:Array(6).fill(16),angle:rad(c.variant==="cut-exit"?32:58),roll:rad(30),labels:Array(6).fill(c.variant==="cut-exit"?"出口较浅":"完成出口")};
  return {lengths:Array(6).fill(13),angle:rad(53),roll:rad(c.task==="basic-linked-carve"?24:29),labels:Array(6).fill(c.task==="basic-linked-carve"?"伸展过渡":c.task==="low-linked-carve"?"低位应用":"收腿过渡")};
}
// Gauss–Legendre quadrature integrates this task's heading, including partial
// arcs. Path and its analytic tangent agree without viewport fitting or the
// piecewise-linear derivative error of a sampled position lookup.
const gx=[.09501250983763744,.2816035507792589,.4580167776572274,.6178762444026438,.755404408355003,.8656312023878318,.9445750230732326,.9894009349916499];
const gw=[.1894506104550685,.1826034150449236,.16915651939500254,.14959598881657673,.12462897125553387,.09515851168249278,.06225352393864789,.027152459411754096];
function arcIntegral(u:number,angle:number,sign:number):Vec3 {
  let x=0,z=0;for(let i=0;i<gx.length;i++)for(const side of [-1,1]){const v=u*(1+side*gx[i])/2,h=sign*angle*Math.cos(PI*v);x+=gw[i]*Math.sin(h);z+=gw[i]*Math.cos(h);}
  return [u*x/2,0,u*z/2];
}
function geometry(t:number,c:LessonConfig){
  const p=plan(c),total=p.lengths.reduce((a,b)=>a+b,0),s=t*total;
  let index=0,offset=0,z=0;
  while(index<p.lengths.length-1&&s>=offset+p.lengths[index]){z+=p.lengths[index]*arcIntegral(1,p.angle,1)[2];offset+=p.lengths[index++];}
  const u=t===1?1:(s-offset)/p.lengths[index],first=c.fromEdge==="heel"?-1:1,sign=(index%2?-first:first),wave=Math.sin(PI*u);
  const heading=sign*p.angle*Math.cos(PI*u),point=arcIntegral(u,p.angle,sign),roll=sign*p.roll*wave*wave;
  const pivot=c.task==="carved-short-turns"&&c.variant==="pivoted"?-sign*rad(15)*wave**4:0;
  const route:Route={position:[point[0]*p.lengths[index],0,z+point[2]*p.lengths[index]],travel:[Math.sin(heading),0,Math.cos(heading)],yaw:heading-PI/2+pivot,roll,edgeLoad:wave*wave,phase:0,half:sign===1?0:1,progress:u,holding:false,lean:roll/p.roll,extension:0,braking:0};
  return {p,total,index,u,offset,sign,first,heading,route};
}
function pose(t:number,c:LessonConfig){
  const g=geometry(t,c),p=g.index+g.u,toe=Math.max(0,g.route.lean),heel=Math.max(0,-g.route.lean);
  const basic=c.task==="basic-linked-carve"||c.task==="low-linked-carve"&&c.variant==="low-basic";
  const shift=c.variant==="late-body"?.16:c.variant==="late-retraction"?.17:0;
  const wave=Math.sin(PI*(p-shift)),bodySide=wave*g.first,activity=wave*wave;
  const recover=c.variant==="recover"?smooth((p-2)/.5)*(1-smooth((p-3.5)/.5)):0;
  const low=c.task==="low-linked-carve"?(c.variant==="normal-dynamic"?0:c.variant==="recover"?recover:1):0;
  // Separate side amplitudes and transition direction. Shorter legs at exchange
  // define the retraction example; pelvis height alone does not define it.
  const sideAmount=bodySide>=0?1:.88;
  // At toe inclination, equal distance reductions do not produce equal snow-
  // relative lowering. Author each side's full-body low application separately;
  // keep the transition short without forcing symmetric pelvis heights.
  const target=basic
    ?.802-.069*activity*sideAmount-low*(.052+.061*toe-.05036*heel)
    :.715+.078*activity*sideAmount-low*(.114+.059*toe-.070*heel);
  const transitionDirection=g.first*Math.cos(PI*p);
  const makeOptions=(bend:number):PoseOptions=>({
    cuffPitch:14+4*toe-2*heel,rearCuffPitch:14+3*toe-2*heel,
    legBend:bend,hipYaw:g.route.yaw+rad(5+3*toe-2*heel),shoulderYaw:g.route.yaw+rad(16+3*toe+11*heel),
    // Toe–heel and heel–toe have different torso organization. A modest forward
    // trunk at heel–toe is allowed; neutral spine does not mean vertical trunk.
    torsoPitch:.18+.045*transitionDirection-.14*toe+.30*heel+.004*(bend-43)
      +(c.variant==="chest-dive"?.28*toe*toe:0),
    torsoAlong:.012*(toe-heel),lookDirection:g.route.travel,
  });
  return poseAtLegLength(g.route,target,makeOptions);
}

const cache=new Map<string,Stage[]>();
function stages(c:LessonConfig):Stage[]{
  const key=[c.task,c.variant,c.fromEdge].join(":"),found=cache.get(key);if(found)return found;
  const p=plan(c),total=p.lengths.reduce((a,b)=>a+b,0),out:Stage[]=[];let offset=0;
  // State labels use the exact renderer threshold. Stage IDs survive rewording.
  const enter=Math.asin(Math.sqrt(.008/p.roll))/PI+1e-7;
  p.lengths.forEach((length,i)=>{
    const first=c.fromEdge==="heel"?"heel":"toe",edge=i%2?(first==="toe"?"heel":"toe"):first,name=edge==="toe"?"前刃":"后刃",old=edge==="toe"?"后刃":"前刃";
    const at=(u:number)=>(offset+u*length)/total;
    const basic=c.task==="basic-linked-carve"||c.variant==="low-basic",late=c.variant==="late-body"||c.variant==="late-retraction";
    const low=c.task==="low-linked-carve",short=c.task==="carved-short-turns",size=c.task==="carve-size-change";
    const condition=low&&c.variant==="recover"?(i<2?"正常参考":i<4?"降低与恢复":"恢复正常"):p.labels[i];
    out.push(
      {at:at(0),event:"edge-flat",arc:i,title:`${condition}：${old}换${name}过渡`,detail:basic?`旧${old}已接近平板，适量伸腿跨侧。膝仍可屈伸，髋和胸部连续调整；伸腿与减压不等价。`:`旧${old}已接近平板，腿部收短让雪板从身下换侧，随后在新弧中逐渐伸出。${old}换${name}按自身髋胸关系组织，身体不必保持同一高度或始终竖直。`},
      {at:at(enter),event:"edge-engage",arc:i,title:`第${i+1}弧：逐渐建立${name}`,detail:edge==="toe"?"双膝与骨盆一起进入脚尖侧，胸部协调并允许适量前俯，避免髋仍在旧侧而胸先扑入。双脚与固定器连接，前后腿各自配合。":"骨盆进入脚跟侧，膝髋折叠、胸部相对骨盆回到板上方。不能把前刃姿态直接镜像，也不沿板长坐到板尾；看靴后部与高背的关系。"},
      {at:at(.27),event:"arc-build",arc:i,title:late?"身体调节相对偏晚":short&&c.variant==="pivoted"?"主动拧板偏离行进切线":low&&c.variant==="chest-dive"&&edge==="toe"?"前刃反例：胸先扑向弯内":`${condition}：持续形成新弧`,detail:late?"板路线、刃角、换刃时刻与参考相同，只延后身体腿部伸缩包络；请比较真实髋踝距离。它不是放刃延迟，也没有模拟必然失控。":short&&c.variant==="pivoted"?"这组有意让板轴偏离实际行进方向，弧中出现滑移线索；路线、板角和腿长与纯刻滑参考相同。它说明主动拧板改变的方向关系，没有计算真实搓雪阻力。":low&&c.variant==="chest-dive"&&edge==="toe"?"与较低收腿参考保持相同雪板和下肢，只让躯干链先向脚尖侧探出。不能由同一路线推断这种姿态在真实雪面也能保持抓地。":basic?"在新弧中逐渐屈腿，继续形成弧线；身体降低、板角增加和实际压力是三个不同变量。":"在新刃弧中逐渐伸出双腿，膝不锁直。髋、胸部与工作刃共同组织；不是先蹲到底、再把整个人向上顶起。"},
      {at:at(.5),event:"fall-line",arc:i,title:`${name}通过落线`,detail:short?"这是独立编排的纯刻滑短弯路线，弧形更紧凑；正例板轴沿中心路线切线连续改变，没有主动扫板尾。播放秒数不是实际滑速，短弯也不套用 CASI 搓雪走廊。":size?"当前弧的实际空间尺寸已改变，下一弧的大小来自路线本身；不是缩放俯视图或只加快播速。两种顺序使用同一组作者弧长。":"继续观察前半弧与后半弧的方向变化、腿部余量和出口。这里不画真实载荷、板弯曲、储能或回弹；腿长曲线只反映身体动作。"},
      {at:at(.77),event:"arc-exit",arc:i,title:c.variant==="cut-exit"?`${name}出口偏浅`:`完成${name}出口，准备换侧`,detail:c.task==="carve-load-exit"?(c.variant==="cut-exit"?"相同作者弧长下，这组出弯方向更朝坡下，整条路线也相应不同。它对比出口控制，没有模拟因此产生的实际加速度。":"继续在原工作刃上完成计划的方向变化，再逐渐释放。观察身体仍可活动和出口接下一弧；不将最大刃角或最低姿态当加载成功。"):(basic?"随旧刃减少，身体逐渐伸展并跨向下一侧，仍完成当前出口。":"随旧刃减少，开始为下一次收腿跨侧准备；躯干保持配合，后刃髋不滞留脚跟侧。")},
      {at:at(1-enter+2e-7),event:"edge-release",arc:i,title:`${name}已减到近平板`,detail:"工作刃已按几何阈值接近平放，下一弧继续换侧；接近平板不代表零压力。前后刃阶段、路线、身体与腿长曲线使用同一状态。"},
    );offset+=length;
  });
  out.push({at:1,event:"sequence-end",arc:p.lengths.length-1,replay:{from:(total-p.lengths.at(-1)!)/total,label:"末弧完整衔接"},title:"完整滑段结束，仍在滑行",detail:c.variant==="recover"?"最后两弧已实际恢复正常高度参考，比较下肢和躯干，而不只看标签。动画重播不是雪上停车；需要退出时采用已掌握的安全控制。":"本段两向转换都已在内部出现。最后一弧可接下一组；动画重播不是雪上停车，实际退出采用已掌握的安全控制。"});
  cache.set(key,out);return out;
}
export function sampleJsbaCarvingLesson(time:number,c:LessonConfig,stance:Stance="regular"):LessonFrame{
  if(!supportsJsbaCarvingLesson(c))throw new Error("尚未实现的 JSBA 刻滑任务/策略组合");
  const t=clamp(Number.isFinite(time)?time:0),g=geometry(t,c),ss=stages(c),stage=ss.reduce((n,s,i)=>t>=s.at?i:n,0);
  const state=applyStance(pose(t,c),stance);state.phaseName=ss[stage].title;
  state.phase=ss[stage].event==="edge-flat"?0:ss[stage].event==="edge-engage"||ss[stage].event==="arc-build"?1:ss[stage].event==="fall-line"?2:3;
  const sections=g.p.lengths.map((length,i)=>{const start=g.p.lengths.slice(0,i).reduce((a,b)=>a+b,0)*arcIntegral(1,g.p.angle,1)[2];return {width:Math.ceil(20*(length*Math.abs(arcIntegral(.5,g.p.angle,1)[0])+1))/10,start,end:start+length*arcIntegral(1,g.p.angle,1)[2],label:g.p.labels[i]};});
  return {state,stage,stages:ss,task:c.task!,moving:true,routeWindow:{start:sections[Math.max(0,g.index-1)].start,end:sections[Math.min(sections.length-1,g.index+1)].end},...(c.task==="carve-size-change"?{corridorSections:sections}:{} )};
}
