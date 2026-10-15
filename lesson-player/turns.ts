import { applyStance, buildPose, type Route, type Stance, type Vec3 } from "../prototype/motion";
import type { LessonConfig, LessonFrame, Stage } from "./motion";

const PI=Math.PI,rad=(n:number)=>n*PI/180;
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const smooth=(n:number)=>{const x=clamp(n);return x*x*(3-2*x);};
const hermite=(a:number,b:number,da:number,db:number,u:number)=>(2*u**3-3*u*u+1)*a+(u**3-2*u*u+u)*da+(-2*u**3+3*u*u)*b+(u**3-u*u)*db;
const types=["steering","garland","j-turn","gaze-control","rail-track"];
export const isTurningLesson=(c:LessonConfig)=>types.includes(c.type);
const side=(c:LessonConfig)=>c.variant==="heel"||c.edgeSide==="heel"?-1:1;
const task=(c:LessonConfig)=>c.task??({steering:"linked-steering","rail-track":"linked-rails",garland:"same-edge-garland","j-turn":"j-turn-stop","gaze-control":"traverse-observation"}[c.type]!);
type Geometry={heading:number;yaw:number;roll:number;speed:number;scan:number};

// Route dimensions, timing and angles are authoring choices, not measured snow
// dynamics. A common heading/radius construction keeps the paired comparisons
// in the same world coordinates; the route is never fitted to the viewport.
function geometry(t:number,c:LessonConfig):Geometry {
  const s=side(c),kind=task(c);
  if(c.type==="gaze-control") {
    const heading=rad(-60),scan=rad(-36)*Math.sin(PI*clamp((t-.25)/.35))**2;
    return {heading,yaw:heading-PI/2,roll:rad(8),speed:3.5,scan};
  }
  if(c.type==="garland") {
    const cycle=t===1?1:(t*2)%1, wave=Math.sin(PI*cycle)**2;
    const heading=-s*rad(75-50*wave),roll=s*rad(12-8*wave);
    return {heading,yaw:heading-PI/2-s*rad(7+5*wave),roll,speed:7,scan:0};
  }
  if(c.type==="j-turn") {
    const turn=smooth((t-.12)/.76),heading=-s*PI/2*turn;
    const slip=rad(c.skid?14:4)*Math.sin(PI*turn)**2;
    return {heading,yaw:heading-PI/2-s*slip,roll:s*rad(13)*smooth((t-.1)/.35),speed:5*(1-smooth((t-.6)/.4)),scan:0};
  }
  const rail=c.type==="rail-track"||c.path==="rail";
  const amplitude=rad(rail?25:c.turnShape==="open"?35:c.turnShape==="closed"?80:60);
  const length=2*PI*(rail?6.4:3.2)*amplitude;
  const stop=kind==="rails-then-stop",join=.72,cut=.93;
  if(stop&&t>join) {
    const v=(t-join)/(1-join),start=amplitude*Math.cos(2*PI*cut);
    const headingRate=-2*PI*amplitude*Math.sin(2*PI*cut)*cut/join;
    const heading=hermite(start,PI/2,headingRate*(1-join),0,v);
    const initialRoll=rad(8)*Math.sin(2*PI*cut);
    const rollRate=rad(8)*2*PI*Math.cos(2*PI*cut)*cut/join;
    return {heading,yaw:heading-PI/2+rad(13)*Math.sin(PI*v)**2,roll:hermite(initialRoll,-rad(13),rollRate*(1-join),0,v),speed:length*cut/join*(1-smooth(v)),scan:0};
  }
  const u=stop?t*cut/join:t,wave=Math.sin(2*PI*u),heading=amplitude*Math.cos(2*PI*u);
  return {heading,yaw:heading-PI/2-(c.type==="steering"?rad(10)*wave:0),roll:rad(rail?8:13)*wave,speed:length*(stop?cut/join:1),scan:0};
}

const paths=new Map<string,Vec3[]>(),N=800;
function positions(c:LessonConfig):Vec3[] {
  const key=JSON.stringify([c.type,c.path,c.turnShape,task(c),Boolean(c.skid),side(c)]);
  const found=paths.get(key);if(found)return found;
  const out:Vec3[]=[[0,0,0]];
  for(let i=1;i<=N;i++) {
    const g=geometry((i-.5)/N,c),last=out[i-1];
    out.push([last[0]+Math.sin(g.heading)*g.speed/N,0,last[2]+Math.cos(g.heading)*g.speed/N]);
  }
  paths.set(key,out);return out;
}
function position(t:number,c:LessonConfig):Vec3 {
  const ps=positions(c),i=Math.min(N-1,Math.floor(t*N)),f=t*N-i;
  return ps[i].map((v,k)=>v+(ps[i+1][k]-v)*f) as Vec3;
}
function stages(c:LessonConfig):Stage[] {
  if(c.type==="gaze-control")return [
    {at:0,title:"先建立短斜滑",detail:"先看清前方，保持前刃和简单斜滑路线；这段示范尚未包含停止。"},
    {at:.25,title:"短暂转头观察",detail:"头部小幅扫描，肩髋和雪板保持原来任务；不靠甩肩改变方向。"},
    {at:.425,title:"及时看回前方",detail:"观察幅度随即缩小，前方视野恢复；不延长回头时间。"},
    {at:.6,title:"继续原来的路线",detail:"头部已经回到原朝向，仍保留同一工作刃。实际练习按预留区域结束。"},
  ];
  if(c.type==="j-turn")return [
    {at:0,title:"短距离直滑入弯",detail:"先短直滑，关节保留余量；计划的单弧出口在横坡。"},
    {at:.12,title:`逐渐立起${side(c)>0?"前刃":"后刃"}`,detail:c.skid?"双腿持续带动雪板转向，逐渐加入可控滑移；肩不突然抢转。":"踝膝髋共同建立工作刃，减少主动转板；不伸手扑雪或用膝撞雪。"},
    {at:.5,title:"完成单个圆弧",detail:c.skid?"搓雪分布在弧线中，板头板尾连续转向；不把最后横甩当作完成弯。":"保持弧线连续，需要时允许小幅滑移；不能为守窄痕放弃可控出口。"},
    {at:.8,title:"转向横坡、渐停",detail:"位移逐渐停止，保留工作刃和屈伸余量，不自动放平或衔接下一弯。"},
  ];
  if(c.type==="garland")return [
    {at:0,title:"同刃斜滑",detail:"保持当前工作刃，确认横向空间；另一刃需要单独练。"},
    {at:.08,title:"减小刃角，接近落线",detail:"减小原刃角，踝膝髋连续引导板头接近落线；仍在同一刃。"},
    {at:.25,title:"原刃转回横坡",detail:"在越过落线之前重新增加原刃角，完成同侧半弯。此处允许滑移。"},
    {at:.5,title:"同刃重复",detail:"继续向同一侧横穿并逐段下降；不是回到起点，也没有换刃。"},
    {at:.75,title:"再次完成半弯",detail:"持续转回横坡，仍保留当前工作刃；这段动画结束不表示已经停住。"},
  ];
  const rail=c.type==="rail-track",stop=task(c)==="rails-then-stop",k=stop?.72/.93:1;
  const out:Stage[]=[
    {at:0,title:"小幅换刃，准备第一弯",detail:rail?"用小幅立刃开始浅弧，减少多余的转板；图中两条线分别标出这块雪板的板头和板尾经过的位置。":"先减旧刃，在过渡位置开始下一条圆弧；看雪板朝向与行进方向的区别。"},
    {at:.12*k,title:"前刃建立",detail:"膝与髋共同移向脚尖侧，胸部相对下肢更直立；下肢引导，上身自然跟随。"},
    {at:.35*k,title:"完成前刃弧并释放",detail:rail?"持续完成浅弧，逐渐减旧刃；板头板尾路径按各自经过的位置比较。":"持续转向并减小旧刃；用完整弧线形成出口，避免末段踢后脚。"},
    {at:.5*k,title:"过平板，开始换刃",detail:"旧刃减到近平板后开始接新刃，身体和雪板经过过渡；板放平时仍可能承受压力。"},
    {at:.52*k,title:"后刃逐渐建立",detail:"逐渐增加后刃角，膝髋与胸部协调调整；已经离开近平板位置。"},
    {at:.62*k,title:"后刃弧中",detail:"膝髋折叠，骨盆向脚跟侧，胸部相对骨盆更靠近雪板上方；不靠把踝关节大幅后折。"},
    {at:.85*k,title:stop?"完成第二条浅弧":"完成后刃弧并释放",detail:stop?"一对浅弧即将完成，接下来按计划进入搓雪退出段。":"出口由弧线逐渐形成；示范段结束后可继续换刃，不把播放暂停当作停车。"},
  ];
  if(stop)out.push({at:.72,title:"计划搓雪退出",detail:"在原后刃上逐渐加入滑移，继续转向横坡并减速；这一段有意增加搓雪，用来主动结束滑行。"},{at:.9,title:"保留后刃、渐停",detail:"继续完成出口，位移逐渐停止；停住后再从安全位置查看雪痕。"});
  return out;
}

export function sampleTurningLesson(time:number,c:LessonConfig,stance:Stance):LessonFrame {
  const t=clamp(Number.isFinite(time)?time:0),g=geometry(t,c),ss=stages(c);
  const stage=ss.reduce((last,p,i)=>t>=p.at?i:last,0),amount=Math.min(1,Math.abs(g.roll)/rad(13));
  const toe=Math.max(0,g.roll)/rad(13),heel=Math.max(0,-g.roll)/rad(13);
  const lookHeading=g.heading+g.scan,lookDirection:Vec3=[Math.sin(lookHeading),0,Math.cos(lookHeading)];
  // Open naturally toward travel, leaving room for a visible finite head scan.
  // Shoulders follow the turn with a continuously changing board-relative angle.
  const opening=c.type==="gaze-control"?rad(40):rad(34);
  const shoulderYaw=g.yaw+opening+(c.type==="steering"||c.type==="rail-track"?rad(5)*Math.sin(2*PI*t):0);
  const route:Route={position:position(t,c),travel:g.speed>1e-9?[Math.sin(g.heading),0,Math.cos(g.heading)]:[0,0,0],yaw:g.yaw,roll:g.roll,edgeLoad:amount,phase:(stage%4) as 0|1|2|3,half:g.roll<0?1:0,progress:t,holding:false,lean:toe-heel,extension:0,braking:0};
  const state=applyStance(buildPose(route,"correct",{cuffPitch:14+4*toe-2*heel,rearCuffPitch:14+4*toe-2*heel,legBend:32+10*toe+14*heel,hipYaw:g.yaw+rad(9)+rad(2)*Math.sin(2*PI*t),shoulderYaw,torsoPitch:.14-.17*toe+.34*heel,lookDirection}),stance);
  if(t===1&&g.speed===0){ss[stage]={at:ss[stage].at,title:`已停住，保留${g.roll>0?"前刃":"后刃"}`,detail:"本次练习已结束；保留工作刃与关节余量，主动重新播放才开始下一次。"};state.metrics.skidAngle=0;}
  state.phaseName=ss[stage].title;
  return {state,stage,stages:ss,task:task(c),moving:true};
}
