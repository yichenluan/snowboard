import { applyStance, buildPose, type Route, type Stance, type Vec3 } from "../prototype/motion";
import type { LessonConfig, LessonFrame, Stage } from "./motion";

// Independent duck-stance teaching task. Values describe this authored example,
// not a snow-contact solver, measured motion or prescribed joint/edge angles.
export type CarvePosture = "normal" | "low" | "reach";
export const supportsCarvingLesson = (c: LessonConfig) => c.type === "duck-carve" && c.task === "linked-duck-carve" && (!c.posture || ["normal", "low", "reach"].includes(c.posture));
const PI = Math.PI, rad = (n: number) => n * PI / 180;
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const amplitude = rad(52), distance = 24, peakRoll = rad(26);
function geometry(t: number) {
  const wave = Math.sin(2 * PI * t), heading = amplitude * Math.cos(2 * PI * t);
  return {wave, heading, yaw: heading - PI / 2, roll: peakRoll * wave};
}
const N = 1600, path: Vec3[] = [[0, 0, 0]];
for (let i = 1; i <= N; i++) {
  const {heading} = geometry((i - .5) / N), p = path[i - 1];
  path.push([p[0] + distance * Math.sin(heading) / N, 0, p[2] + distance * Math.cos(heading) / N]);
}
function position(t: number): Vec3 {
  const i = Math.min(N - 1, Math.floor(t * N)), f = t * N - i;
  return path[i].map((v, k) => v + f * (path[i + 1][k] - v)) as Vec3;
}
// Use the renderer's actual near-flat threshold, not a guessed phase caption.
const flatLeave = Math.asin(.008 / peakRoll) / (2 * PI);
// Put seek targets just inside the named state; sin/asin rounding at an exact
// threshold otherwise labels the button and the rendered edge differently.
const eventInset = 1e-7;
function stages(posture: CarvePosture): Stage[] {
  const lower = posture !== "normal";
  return [
    {at:0,title:"后刃已释放，连续过平板",detail:"本段从两弯之间开始；双脚仍连接固定器，身体不在平板位置停住。较低姿态仍为后续屈伸留余量，平板不代表零压力。"},
    {at:flatLeave+eventInset,title:"渐建前刃",detail:"前后踝膝随各自脚向协调，骨盆随下肢进入脚尖侧。两腿共同带板，前腿不能独自扛住，也不规定固定承重比例。"},
    {at:.13,title:lower?"前刃弧中：观察较低姿态":"正常高度完成前刃弧",detail:posture === "reach"?"反例只改变胸廓：胸先向脚尖侧探出，腿长与低姿态参考相同。相同路线是比较条件，不证明这种姿态也能维持刻滑。":lower?"在已有稳定弧线内进入并离开较低位置；膝髋协调，骨盆与胸廓共同调整而不先扑胸，两腿仍可继续屈伸。降低身体与增加刃角是不同变量。":"保留舒适屈曲，不刻意蹲低。板轴跟随路线切向；这是几何参考，不是实测雪痕。"},
    {at:.32,title:"完成前刃弧、准备释放",detail:"继续形成出口，再逐渐减旧刃；本例温和恢复腿长，髋与胸廓重新组织。伸腿不等于立即减压，不必用回收才算正确。"},
    {at:.5-flatLeave+eventInset,title:"前刃减到近平板",detail:"身体和板连续换侧，旧刃释放与身体调整有重叠；不在这里横甩肩，也不暂停等下一刃。"},
    {at:.5+flatLeave+eventInset,title:"渐建后刃",detail:"骨盆进入脚跟侧，膝髋逐渐折叠，胸廓相对骨盆回板；小腿与高背关系保留。不是把前刃姿态左右翻转，也不是沿板长坐向板尾。"},
    {at:.63,title:lower?"后刃弧中：观察较低姿态":"正常高度完成后刃弧",detail:lower?"两腿在各自固定脚向下协调进入并离开较低位置，后腿续接而不被踢出。髋的脚跟侧位置与胸廓配合平衡；不靠腰塌下或伸手找雪。":"膝髋保留舒适屈曲，胸廓相对回板。比较两刃的髋胸关系，不要求两侧外观相同。"},
    {at:.82,title:"完成后刃弧、恢复余量",detail:"继续弧线、渐减旧刃，温和恢复腿长，髋不滞留在脚跟侧；为下一次前刃建立留出空间。"},
    {at:1-flatLeave+eventInset,title:"接回下一次前刃转换",detail:"已减到近平板，动作与下一周期相接；动画末帧仍在滑行，暂停播放不是停车。雪上需要时先恢复正常高度，以熟悉的搓雪方式结束。"},
  ];
}
export function sampleCarvingLesson(time: number, c: LessonConfig, stance: Stance = "regular"): LessonFrame {
  if (!supportsCarvingLesson(c)) throw new Error("需要明确的 duck 连续刻滑任务与姿态");
  const t = clamp(Number.isFinite(time) ? time : 0), g = geometry(t), posture = c.posture ?? "low";
  const toe = Math.max(0, g.wave) ** 2, heel = Math.max(0, -g.wave) ** 2;
  // Extra flexion develops inside the new turn, then is released before the
  // next transition. It never scales the board's route or edge-angle envelope.
  const lowering = posture === "normal" ? 0 : 30 * toe + 18 * heel;
  const ss = stages(posture), stage = ss.reduce((last, s, i) => t >= s.at ? i : last, 0);
  const route: Route = {position:position(t),travel:[Math.sin(g.heading),0,Math.cos(g.heading)],yaw:g.yaw,roll:g.roll,edgeLoad:Math.abs(g.wave),phase:(stage%4) as 0|1|2|3,half:g.wave<0?1:0,progress:t,holding:false,lean:g.wave,extension:0,braking:0};
  const state = applyStance(buildPose(route, "correct", {
    cuffPitch:14+4*toe-2*heel, rearCuffPitch:14+3*toe-2*heel,
    legBend:32+10*toe+14*heel+lowering,
    hipYaw:g.yaw+rad(6), shoulderYaw:g.yaw+rad(25),
    torsoPitch:.14-.20*toe+.34*heel+lowering*(.005*toe+.009*heel)+(posture === "reach" ? .32*toe**2 : 0),
    lookDirection:route.travel,
  }), stance);
  state.phaseName = ss[stage].title;
  return {state,stage,stages:ss,task:"linked-duck-carve",moving:true};
}
