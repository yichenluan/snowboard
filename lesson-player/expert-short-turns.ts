import {applyStance, buildPose, type MotionState, type PoseOptions, type Route, type Stance, type Vec3} from "../prototype/motion";
import type {LessonConfig, LessonFrame, Stage} from "./motion";

export type ExpertShortTask = "expert-corridor-steering" | "expert-load-release";
type Edge = "toe" | "heel";
const PI = Math.PI, rad = (n:number) => n * PI / 180;
const clamp = (n:number) => Math.max(0, Math.min(1, n));
const opposite = (e:Edge):Edge => e === "toe" ? "heel" : "toe";
const edgeName = (e:Edge) => e === "toe" ? "前刃" : "后刃";
const variants:Record<ExpertShortTask, readonly string[]> = {
  "expert-corridor-steering": ["progressive", "late-steer"],
  "expert-load-release": ["continuous", "held-release"],
};
// All quantities below author a readable movement study. They are not measured
// expert riding speed, prescribed edge/joint angles, or a snow-force solution.
const halves = 4, amplitude = .84, halfDistance = 3.6, peakRoll = rad(24), slip = rad(9);
export const expertShortCorridor = {width:2.5, start:0, end:halves * halfDistance} as const;
export function supportsExpertShortLesson(c:LessonConfig):boolean {
  return c.type === "expert-short-turns" && Object.hasOwn(variants, c.task ?? "")
    && variants[c.task as ExpertShortTask].includes(c.variant ?? "")
    && c.transition === undefined && c.turnShape === undefined && c.posture === undefined
    && (c.fromEdge === undefined || c.fromEdge === "toe" || c.fromEdge === "heel");
}
export const expertShortDurationMs = (c:LessonConfig) => Math.max(8000, c.duration ?? 16000);
export function expertShortVariants(c:LessonConfig) {
  if (!supportsExpertShortLesson(c)) throw new Error("尚未实现的专家短弯任务或对照组合");
  return c.task === "expert-corridor-steering"
    ? [{value:"progressive",label:"全弯持续转向"},{value:"late-steer",label:"对照：转向集中在弯后段"}]
    : [{value:"continuous",label:"连续调节参考"},{value:"held-release",label:"对照：屈腿准备偏晚"}];
}
const rollWave = (w:number) => w*w*w*(1+.12*.12)/(w*w+.12*.12);
function geometry(t:number, c:LessonConfig) {
  const p = t * halves, index = t === 1 ? halves - 1 : Math.floor(p), u = t === 1 ? 1 : p-index;
  const from = index % 2 ? opposite(c.fromEdge ?? "heel") : c.fromEdge ?? "heel", sign = from === "toe" ? 1 : -1;
  // Delayed spatial steering redistributes a whole half-arc, including its
  // tangent and board heading. It is NOT a fake yaw change on the same path.
  const delayed = c.task === "expert-corridor-steering" && c.variant === "late-steer";
  const q = delayed ? u - .62 * Math.sin(PI*u)**2 / PI : u;
  const dq = delayed ? 1 - .62*Math.sin(2*PI*u) : 1;
  const w = Math.cos(PI*q), dx = -sign*amplitude*PI*Math.sin(PI*q)*dq;
  const heading = Math.atan2(dx,halfDistance), roll = sign*peakRoll*rollWave(w);
  const r:Route = {
    position:[sign*amplitude*w,0,halfDistance*p], travel:[Math.sin(heading),0,Math.cos(heading)],
    yaw:heading-PI/2-sign*slip*w, roll, edgeLoad:Math.abs(roll)/peakRoll,
    phase:0,half:from === "toe" ? 0 : 1,progress:u,holding:false,lean:roll/peakRoll,extension:0,braking:0,
  };
  // In the timing comparison the board, route, cuff and all orientation inputs
  // stay identical. Only the actual hip-to-ankle length envelope is shifted.
  // This does not delay the physical edge release, or model pressure/rebound.
  const recoveryPhase = p - (c.task === "expert-load-release" && c.variant === "held-release" ? .16 : 0);
  const targetLength = .800 - .055 * Math.sin(PI*recoveryPhase)**2;
  return {r,heading,index,u,from,targetLength};
}
const meanLength = (s:MotionState) => (Math.hypot(...s.joints.frontHip.map((v,i)=>v-s.joints.frontAnkle[i])) + Math.hypot(...s.joints.rearHip.map((v,i)=>v-s.joints.rearAnkle[i])))/2;
function regularState(t:number,c:LessonConfig) {
  const g=geometry(t,c),toe=Math.max(0,g.r.roll/peakRoll),heel=Math.max(0,-g.r.roll/peakRoll);
  const pose=(bend:number):PoseOptions=>({
    cuffPitch:14+4*toe-2*heel,rearCuffPitch:14+4*toe-2*heel,legBend:bend,
    hipYaw:g.r.yaw+.10,shoulderYaw:-PI/2+.24+.30*g.heading+.10*(g.r.yaw-(g.heading-PI/2)),
    // Torso follows the necessary flexion organisation; this is not an isolated
    // pelvis translation or a claim of identical real dynamic balance.
    torsoPitch:.14+.009*(bend-32)+.22*heel-.24*toe,lookDirection:g.r.travel,
  });
  const at=(bend:number)=>buildPose(g.r,"correct",pose(bend));
  let lo=20,hi=80;
  if(meanLength(at(lo))<g.targetLength || meanLength(at(hi))>g.targetLength) throw new Error("专家短弯示意腿长超出可达范围");
  for(let i=0;i<32;i++){const m=(lo+hi)/2;if(meanLength(at(m))>g.targetLength)lo=m;else hi=m;}
  const state=at((lo+hi)/2),a=state.joints.frontShoulder,b=state.joints.rearShoulder;
  // A C1 display limit, using the actual world shoulder line. The shared
  // renderer and body solver are unchanged; gaze never snaps at a hard clamp.
  const shoulder=Math.atan2(-(a[2]-b[2]),a[0]-b[0]);
  const requested=Math.atan2(Math.sin(g.heading-shoulder),Math.cos(g.heading-shoulder));
  const magnitude=Math.abs(requested),u=clamp((magnitude-rad(45))/rad(30));
  const turn=magnitude<=rad(45)?magnitude:rad(45)+rad(30)*(u-u*u/2);
  const heading=shoulder+Math.sign(requested)*turn;
  state.gaze=[Math.sin(heading),0,Math.cos(heading)];
  return state;
}
const stageCache=new Map<string,Stage[]>();
function stagesFor(c:LessonConfig):Stage[] {
  const key=[c.task,c.variant,c.fromEdge].join(":"),saved=stageCache.get(key);if(saved)return saved;
  const steering=c.task==="expert-corridor-steering",late=c.variant==="late-steer",held=c.variant==="held-release";
  const stages:Stage[]=[];
  for(let i=0;i<halves;i++){
    const from=i%2?opposite(c.fromEdge??"heel"):c.fromEdge??"heel",to=opposite(from),at=(u:number)=>(i+u)/halves;
    // Bisect the actual roll used by buildPose; the near-flat threshold is the
    // renderer's .008 radians. Stages follow geometry, never assumed quarters.
    let lo=0,hi=1;
    for(let n=0;n<45;n++){const m=(lo+hi)/2;if(Math.sign(geometry(at(m),c).r.roll)===(from==="toe"?1:-1))lo=m;else hi=m;}
    const zero=(lo+hi)/2;
    lo=0;hi=zero;
    for(let n=0;n<45;n++){const m=(lo+hi)/2;if(Math.abs(geometry(at(m),c).r.roll)>=.008)lo=m;else hi=m;}
    const enter=hi+1e-8;
    lo=zero;hi=1;
    for(let n=0;n<45;n++){const m=(lo+hi)/2;if(Math.abs(geometry(at(m),c).r.roll)<.008)lo=m;else hi=m;}
    const leave=hi+1e-8;
    stages.push(
      {at:at(0),title:`${edgeName(from)}弧内继续引导`,detail:steering?"比较同一2.5米示意走廊内的完整弯形、雪板朝向和实际移动方向；滑行走廊宽度取自官方2–3米任务范围，播放时长不代表实测滑速。":"观察髋到脚踝的距离、胸部与骨盆的协调。压力管理是雪上任务目标；本图只显示动作线索，没有板材储能或真实回弹。"},
      {at:at(.18),title:steering?(late?"较多转向留到弯后段":"整个弯都在持续转向"):(held?"屈腿准备相对偏晚":"逐渐屈腿，准备换刃"),detail:steering?(late?"本对照把较多转向留到弯后段，弯的形状也会变化；路线没有保持相同，也没有计算真实减速度。":"这一段一直在转向，肩髋仍自然顺应；不用锁住上身或踢尾制造短弯外观。"):(held?"与参考保持同一板路径、板角和释放时刻，只把屈伸动作整体延后，髋到脚踝的距离变化幅度和周期不变。不能称作实际旧刃滞留，也不能从画面读出压力。":"髋到脚踝的距离连续变化，胸部随双腿的屈伸自然调整；这是一种可观察策略，不把回收定为每个专家短弯的唯一方法。")},
      {at:at(enter),title:"实际进入近平板",detail:"按实际板角标出旧刃减至近平板；滑行仍连续，低刃角不是零压力。完整画面中同时观察雪板和双腿怎样换侧、上身怎样跟随。"},
      {at:at(leave),title:`连续接上${edgeName(to)}`,detail:held?"新刃建立时刻与参考完全相同；比较双腿屈得最多的时刻怎样延后，不冒充延迟放刃或失控模拟。":"在连续换侧中建立新工作刃，腿长仍可调；前刃和后刃各有不同的膝髋与胸部配合，不能把一侧姿态直接翻过来。"},
      {at:at(leave+(1-leave)*.72),title:`${edgeName(to)}弧内恢复活动余量`,detail:"继续观察完整弧线与下一次释放准备。路线与人物动作同步，供观察对照，不证明真实板雪接触、反作用力或高级滑速。"},
    );
  }
  stages.push({at:1,title:"仍在滑行，接续下一弯",detail:"动画结束后可继续接下一组连弯，重播不是雪上停车。雪上退出需先放宽节奏，按已掌握的受控搓雪弯转向横坡并停稳；本动画没有模拟该独立停止任务。"});
  stageCache.set(key,stages);return stages;
}
export function sampleExpertShortLesson(time:number,c:LessonConfig,stance:Stance="regular"):LessonFrame {
  if(!supportsExpertShortLesson(c))throw new Error("尚未实现的专家短弯任务或对照组合");
  const t=clamp(Number.isFinite(time)?time:0),stages=stagesFor(c),stage=stages.reduce((n,s,i)=>t>=s.at?i:n,0);
  const state=applyStance(regularState(t,c),stance);
  state.phase=Math.min(3,stage) as 0|1|2|3;state.phaseName=stages[stage].title;state.turnProgress=t;
  return {state,stage,stages,task:c.task!,moving:true,corridor:expertShortCorridor};
}
