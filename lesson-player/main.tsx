import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { TeachingScene, type View } from "../prototype/scene";
import { boardToWorld, type MotionState, type Stance, type Vec3 } from "../prototype/motion";
import { LESSON_TYPES, canRenderLesson, lessonTrail, sampleLesson, type LessonConfig } from "./motion";
import { LessonDiagnostics } from "./diagnostics";

type PlayerApi = { destroy():void; play():void; pause():void; seek(t:number):void; setView(view:string):void; element:HTMLElement };
declare global { interface Window { SnowLesson3D: { types: readonly string[]; canRender(config:LessonConfig):boolean; mount(container: HTMLElement|string, config: LessonConfig):PlayerApi } } }
const edges={toe:"前刃 · 脚尖侧",heel:"后刃 · 脚跟侧",flat:"接近平板"};
const views: [View,string][]=[["follow","斜视"],["side","看前后平衡"],["front","看两刃成角"],["boots","雪靴近景"]];
function evidenceFor(c:LessonConfig):string {
  if(c.variant==="phase-study"&&c.type.startsWith("pressure-"))return "依据 CASI Reference Guide 的屈伸与压力管理（51–56 页）设计。原地平板示例分别显示加速、减速和保持；高度曲线是分段质心估计，不是压力曲线或测力数据。";
  if(c.type==="edge-change-up")return "依据 CASI Reference Guide 的屈伸（51–56 页）、转换与转弯任务（60–61、85、96 页）设计。固定雪面图显示板中心、骨盆和胸廓的同源坐标投影，骨盆不是质心；温和伸展只是本段选用的过渡策略。";
  if(["steering","garland","j-turn","gaze-control","rail-track"].includes(c.type))return "依据 CASI Reference Guide 的观察与下肢转向（43–48 页）、滑移和刻滑（60–61 页）、花环与 J 弯（86 页）、弯形（88 页）及独立浅弧（97–98 页）设计。刚体板只展示几何关系，尚无侧切受载变形和真实雪痕求解。";
  return "依据 CASI Reference Guide 的站姿与平衡（43–50 页）、两刃差异（155 页）、前后调整（173 页）及单弯任务（86–88 页）设计。";
}
const toView=(v?:string):View=>v==="width"?"front":v==="length"?"side":["side","front","boots"].includes(v??"")?v as View:"follow";
const bones: [keyof MotionState["joints"],keyof MotionState["joints"]][]=[
  ["frontAnkle","frontKnee"],["frontKnee","frontHip"],["frontHip","rearHip"],["rearHip","rearKnee"],["rearKnee","rearAnkle"],
  ["pelvis","chest"],["chest","neck"],["neck","head"],["frontShoulder","rearShoulder"],
  ["frontShoulder","frontElbow"],["frontElbow","frontHand"],["rearShoulder","rearElbow"],["rearElbow","rearHand"],
];
/** A projection of the exact same state. Also works when WebGL is unavailable. */
function PlanarDiagram({state,plane="width",supportRail}:{state:MotionState;plane?:"width"|"length";supportRail?:[Vec3,Vec3]}) {
  const b=state.board;
  const direction=plane==="width"?[Math.sin(b.yaw),0,Math.cos(b.yaw)]:[Math.cos(b.yaw),0,-Math.sin(b.yaw)];
  const point=(v:Vec3)=>[180+125*((v[0]-b.position[0])*direction[0]+(v[2]-b.position[2])*direction[2]),266-125*(v[1]-b.position[1])];
  const coords=(v:Vec3)=>point(v).join(",");
  const a=plane==="width"?[0,0,-b.width/2]:[-b.length/2,0,0];
  const z=plane==="width"?[0,0,b.width/2]:[b.length/2,0,0];
  return <svg viewBox="0 0 360 300" role="img" aria-label={plane==="width"?"沿板头看同一动作骨架":"沿板长看同一动作骨架"}>
    <path d="M10 269H350" stroke="#cedbd3"/>
    {supportRail&&<g stroke="#7c817a" strokeWidth="5"><polyline points={supportRail.map(coords).join(" ")}/>{supportRail.map((p,i)=><polyline key={i} points={[p,[p[0],0,p[2]] as Vec3].map(coords).join(" ")}/>)}</g>}
    <polyline points={[boardToWorld(a as Vec3,b),boardToWorld(z as Vec3,b)].map(coords).join(" ")} stroke="#b68143" strokeWidth="7"/>
    {bones.map(([a,b],i)=><polyline key={i} points={[state.joints[a],state.joints[b]].map(coords).join(" ")} fill="none" stroke={a.startsWith("front")?"#ba7149":a.startsWith("rear")?"#477c95":"#285e58"} strokeWidth="6" strokeLinecap="round"/>)}
    {(["frontAnkle","rearAnkle","frontKnee","rearKnee","pelvis","chest"] as const).map((key,i)=>{const [x,y]=point(state.joints[key]);return <g key={key}><circle cx={x} cy={y} r="5" fill="#fffdf6" stroke="#285e58" strokeWidth="2"/>{i>3&&<text x={x+12} y={y+3}>{i===4?"骨盆":"胸廓"}</text>}</g>;})}
    <circle cx={point(state.joints.head)[0]} cy={point(state.joints.head)[1]} r="13" fill="#285e58"/>
    <text x="15" y="22">{plane==="width"?"沿板头看 · 板宽方向":"沿板长看 · 前后位置"}</text>
    <text x="15" y="291">橙：原前脚侧　蓝：原后脚侧</text>
  </svg>;
}
function RouteDiagram({state,trail,time,config,stance}:{state:MotionState;trail:Vec3[];time:number;config:LessonConfig;stance:Stance}) {
  const traces=useMemo(()=>config.trackDiagnostics||config.type==="rail-track"?Array.from({length:201},(_,i)=>{const b=sampleLesson(i/200,config,stance).state.board;return [boardToWorld([b.length/2,0,0],b),boardToWorld([-b.length/2,0,0],b)];}):null,[config,stance]);
  const bounds=useMemo(()=>config.turnShape?lessonTrail({...config,turnShape:"closed"},stance):trail,[config,stance,trail]);
  const xs=bounds.map(v=>v[0]),zs=bounds.map(v=>v[2]);
  const x0=Math.min(...xs)-1.1,x1=Math.max(...xs)+1.1,z0=Math.min(...zs)-1,z1=Math.max(...zs)+1;
  const scale=Math.min(310/(x1-x0),160/(z1-z0));
  const p=(v:Vec3)=>[180+(v[0]-(x0+x1)/2)*scale,98+(v[2]-(z0+z1)/2)*scale];
  const path=(vs:Vec3[])=>vs.map(v=>p(v).join(",")).join(" ");
  const b=state.board;
  const board=[boardToWorld([-b.length/2,0,0],b),boardToWorld([b.length/2,0,0],b)];
  const end:Vec3=[b.position[0]+state.travel[0],0,b.position[2]+state.travel[2]];
  const [nx,ny]=p(board[1]);
  const traceEnd=Math.round(time*200)+1;
  const gazeEnd:Vec3=[b.position[0]+state.gaze[0]*1.6,0,b.position[2]+state.gaze[2]*1.6];
  return <><svg className="sl3-route" viewBox="0 0 360 205" role="img" aria-label="同一动作的俯视路线，圆点标出板头">
    <polyline points={path(trail)} fill="none" stroke="#ccd8cf" strokeDasharray="4 4"/>
    <polyline points={path(trail.slice(0,Math.max(1,Math.round(time*100)+1)))} fill="none" stroke="#3b7f72" strokeWidth="2"/>
    {traces&&[0,1].map(k=><polyline key={k} points={path(traces.slice(0,traceEnd).map(v=>v[k]))} fill="none" stroke={k===0?"#c27b45":"#95608c"} strokeWidth="1.6"/>)}
    <polyline points={path(board)} stroke="#b68143" strokeWidth="5" strokeLinecap="round"/><circle cx={nx} cy={ny} r="4" fill="#533b22"/>
    {Math.hypot(...state.travel)>.01&&<polyline points={path([b.position,end])} stroke="#477c95" strokeWidth="2"/>}
    {config.type==="gaze-control"&&<polyline points={path([b.position,gazeEnd])} stroke="#ac7132" strokeWidth="3"/>}
    <text x="12" y="19">俯视：板轴、移动方向、路线同源</text><text x="12" y="195">坡下 ↓　棕色：板轴　蓝色：移动方向</text>
  </svg>{traces&&<><p className="sl3-hint">橙线：板头；紫线：板尾。两条线是刚体端点路径，不是两脚各留一道雪痕，也不是板雪接触计算。</p><DirectionComparison state={state}/></>}{config.type==="gaze-control"&&<p className="sl3-hint">金色线：实际头部朝向；短暂扫描后回前方，板路线不变。</p>}{config.turnShape&&<p className="sl3-hint">开放／闭合使用相同图幅和最小弯径；播放时长随路线长度变化，不计算真实滑速。</p>}</>;
}
function DirectionComparison({state}:{state:MotionState}) {
  if(Math.hypot(...state.travel)<.01)return null;
  const b=state.board,nose=boardToWorld([b.length/2,0,0],b).map((v,i)=>v-b.position[i]);
  const norm=Math.hypot(nose[0],nose[2]),right=[state.travel[2],0,-state.travel[0]];
  const x=(nose[0]*right[0]+nose[2]*right[2])/norm,y=(nose[0]*state.travel[0]+nose[2]*state.travel[2])/norm;
  return <svg className="sl3-direction" viewBox="0 0 360 158" role="img" aria-label="同一时刻的板轴和行进方向局部放大对照">
    <text x="12" y="19">方向放大：板轴与行进方向</text>
    <polyline points={`${180-53*x},${91+53*y} ${180+53*x},${91-53*y}`} stroke="#b68143" strokeWidth="7" strokeLinecap="round"/>
    <circle cx={180+53*x} cy={91-53*y} r="5" fill="#533b22"/>
    <path d="M180 91V31m-5 9 5-9 5 9" fill="none" stroke="#477c95" strokeWidth="2"/>
    <text x="200" y="43">行进方向</text><text x="200" y="100">夹角 {state.metrics.skidAngle.toFixed(1)}°</text>
    <text x="12" y="153">方向随同一状态更新；角度不是练习目标值</text>
  </svg>;
}
function Player({config,api}:{config:LessonConfig;api:{current:Partial<PlayerApi>}}) {
  const [time,setTime]=useState(0),[playing,setPlaying]=useState(false),[speed,setSpeed]=useState(.65);
  const [stance,setStance]=useState<Stance>(config.stance??"regular");
  const [fromEdge,setFromEdge]=useState<"toe"|"heel">(config.fromEdge??"heel");
  const sampledConfig=useMemo(()=>({...config,fromEdge}),[config,fromEdge]);
  const [view,setView]=useState<View>(toView(config.view)),[reset,setReset]=useState(0);
  const [skeleton,setSkeleton]=useState(Boolean(config.jointLabels)),[touchRotate,setTouchRotate]=useState(false),[flat,setFlat]=useState(false);
  const [expanded,setExpanded]=useState(false);
  const root=useRef<HTMLDivElement>(null);
  const dialog=useRef<HTMLDialogElement>(null),expandButton=useRef<HTMLButtonElement>(null);
  const frame=useMemo(()=>sampleLesson(time,sampledConfig,stance),[time,sampledConfig,stance]);
  const trail=useMemo(()=>lessonTrail(sampledConfig,stance),[sampledConfig,stance]);
  const duration=Math.max(4000,config.duration??10000)*(config.turnShape==="closed"?80/35:1);
  const play=()=>{if(time>=1)setTime(0);setPlaying(true);};
  const seek=(t:number)=>{setPlaying(false);setTime(Math.max(0,Math.min(1,Number.isFinite(t)?t:0)));};
  api.current={...api.current,play,pause:()=>setPlaying(false),seek,setView:(v:string)=>{setView(toView(v));setReset(n=>n+1);}};
  useEffect(()=>{
    if(!playing)return;
    let last=performance.now(),id=0;
    const tick=(now:number)=>{const delta=Math.min(now-last,60);last=now;setTime(t=>{const next=t+delta*speed/duration;if(next>=1){setPlaying(false);return 1;}return next;});id=requestAnimationFrame(tick);};
    id=requestAnimationFrame(tick);return()=>cancelAnimationFrame(id);
  },[playing,speed,duration]);
  useEffect(()=>{
    const visibility=()=>{if(document.hidden)setPlaying(false);};
    document.addEventListener("visibilitychange",visibility);
    const observer=new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)setPlaying(false);});
    if(root.current)observer.observe(root.current);
    return()=>{observer.disconnect();document.removeEventListener("visibilitychange",visibility);};
  },[]);
  useEffect(()=>{
    if(expanded) dialog.current?.showModal();
    else if(dialog.current?.open) {dialog.current.close();expandButton.current?.focus();}
  },[expanded]);
  const fallback:ReactNode=<div className="sl3-fallback"><p>三维暂不可用，下面仍是同一时刻的动作骨架。可继续播放与逐段观察。</p><PlanarDiagram state={frame.state} supportRail={frame.supportRail}/></div>;
  const content=<section className={`sl3${expanded?" sl3-expanded":""}`} aria-label={config.title??"三维动作示意"}>
    <div className="sl3-heading"><div className="sl3-heading-bar"><span>三维动作 · 可自由观察</span><button ref={expanded?undefined:expandButton} onClick={()=>setExpanded(v=>!v)}>{expanded?"收起观察":"放大观察"}</button></div><h3>{config.title??config.type}</h3>{config.focus&&<p>{config.focus}</p>}</div>
    <div className="sl3-observe">
    <div className="sl3-views" role="group" aria-label="观察视角">{views.map(([v,label])=><button key={v} onClick={()=>{setView(v);setFlat(false);setReset(n=>n+1);}} aria-pressed={!flat&&view===v}>{label}</button>)}<button aria-pressed={flat} onClick={()=>setFlat(v=>!v)}>平面骨架</button></div>
    <div className="sl3-scene">{flat?<PlanarDiagram state={frame.state} plane={view==="side"?"length":"width"} supportRail={frame.supportRail}/>:<TeachingScene state={frame.state} trail={trail} time={time} mode="correct" stance={stance} hold={0} view={view} layer="posture" skeleton={skeleton} motion={false} reset={reset} touchRotate={touchRotate} fallback={fallback} supportRail={frame.supportRail}/>}</div>
    <div className="sl3-status"><strong>{edges[frame.state.edge]}</strong><span>{frame.moving?"示意路线":"原地观察"} · {Math.round(time*100)}%</span></div>
    <div className="sl3-play"><button onClick={()=>playing?setPlaying(false):play()}>{playing?"暂停":time>=1?"重新播放":"播放"}</button><input aria-label="动作进度" type="range" min="0" max="1000" value={Math.round(time*1000)} onChange={e=>seek(Number(e.target.value)/1000)}/><label>速度 <select aria-label="播放速度" value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value="0.35">慢放</option><option value="0.65">分解</option><option value="1">正常</option></select></label></div>
    <div className="sl3-options"><label><input type="checkbox" checked={skeleton} onChange={e=>setSkeleton(e.target.checked)}/>透视关节</label><label><input type="checkbox" checked={touchRotate} onChange={e=>setTouchRotate(e.target.checked)}/>触屏旋转</label><label>前脚 <select value={stance} onChange={e=>setStance(e.target.value as Stance)}><option value="regular">左脚</option><option value="goofy">右脚</option></select></label></div>
    {frame.task==="single-transition"&&!config.fromEdge&&<div className="sl3-options"><label>转换方向 <select value={fromEdge} onChange={e=>{setPlaying(false);setFromEdge(e.target.value as "toe"|"heel");}}><option value="heel">后刃 → 前刃</option><option value="toe">前刃 → 后刃</option></select></label></div>}
    <p className="sl3-hint sl3-input-help">鼠标拖动旋转、滚轮缩放；再次点视角复位。触屏旋转关闭时可滚动页面。</p>
    </div><div className="sl3-explain">
    <div className="sl3-stages" role="group" aria-label="动作阶段">{frame.stages.map((s,i)=><button key={i} aria-pressed={frame.stage===i} onClick={()=>seek(s.at)}><span>{i+1}</span>{s.title}</button>)}</div>
    <div className="sl3-cue"><strong>{frame.stages[frame.stage].title}</strong><p>{frame.stages[frame.stage].detail}</p></div>
    {config.type==="inclination"&&<p className="sl3-hint">本组比较身体与板的几何关系；实际组合仍需匹配速度、弯形和雪况。</p>}
    {frame.task==="static-edge"&&<p className="sl3-hint">双手扶稳护栏帮助感知动作；撤去支撑后的自主平衡需另行练习。</p>}
    {frame.moving&&<RouteDiagram state={frame.state} trail={trail} time={time} config={sampledConfig} stance={stance}/>}
    {(config.pressureDiagram||config.transitionReference==="snow")&&<LessonDiagnostics config={sampledConfig} stance={stance} time={time}/>}
    <details className="sl3-evidence"><summary>动作依据与示意边界</summary><p>{evidenceFor(config)}关节幅度、刃角与时长为作者编排，尚未经过教练实拍逐帧标定。</p><p>两脚、骨长与装备连接受约束；小腿的前倾和少量侧向活动是此示例的软靴假设，不是个人活动上限。圆点为分段质心估计，方向线不表示力或承重比例。</p><a href="https://members.casi-acms.com/documents/Ref_Guide.pdf" target="_blank" rel="noreferrer">阅读 CASI 原始教材 ↗</a></details>
    </div></section>;
  return <><div ref={root}>{!expanded&&content}</div><dialog className="sl3-dialog" ref={dialog} aria-label={`放大观察：${config.title??config.type}`} onCancel={()=>setExpanded(false)} onClose={()=>setExpanded(false)}>{expanded&&content}</dialog></>;
}
function mount(target:HTMLElement|string,config:LessonConfig):PlayerApi {
  const container=typeof target==="string"?document.querySelector<HTMLElement>(target):target;
  if(!container)throw new Error("找不到动作容器");
  const element=document.createElement("div");container.replaceChildren(element);
  const root=createRoot(element),ref:{current:Partial<PlayerApi>}={current:{}};
  let destroyed=false;
  root.render(<Player config={config} api={ref}/>);
  return {element,play:()=>ref.current.play?.(),pause:()=>ref.current.pause?.(),seek:t=>ref.current.seek?.(t),setView:v=>ref.current.setView?.(v),destroy:()=>{if(destroyed)return;destroyed=true;root.unmount();element.remove();}};
}
window.SnowLesson3D={types:LESSON_TYPES,canRender:canRenderLesson,mount};
