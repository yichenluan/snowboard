import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { TeachingScene, type View } from "../prototype/scene";
import { boardToWorld, type MotionState, type Stance, type Vec3 } from "../prototype/motion";
import { LESSON_TYPES, lessonTrail, sampleLesson, type LessonConfig } from "./motion";

type PlayerApi = { destroy():void; play():void; pause():void; seek(t:number):void; setView(view:string):void; element:HTMLElement };
declare global { interface Window { SnowLesson3D: { types: readonly string[]; mount(container: HTMLElement|string, config: LessonConfig):PlayerApi } } }
const edges={toe:"前刃 · 脚尖侧",heel:"后刃 · 脚跟侧",flat:"接近平板"};
const views: [View,string][]=[["follow","斜视"],["side","看前后平衡"],["front","看两刃成角"],["boots","雪靴近景"]];
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
function RouteDiagram({state,trail,time}:{state:MotionState;trail:Vec3[];time:number}) {
  const xs=trail.map(v=>v[0]),zs=trail.map(v=>v[2]);
  const x0=Math.min(...xs)-1.1,x1=Math.max(...xs)+1.1,z0=Math.min(...zs)-1,z1=Math.max(...zs)+1;
  const scale=Math.min(310/(x1-x0),160/(z1-z0));
  const p=(v:Vec3)=>[180+(v[0]-(x0+x1)/2)*scale,98+(v[2]-(z0+z1)/2)*scale];
  const path=(vs:Vec3[])=>vs.map(v=>p(v).join(",")).join(" ");
  const b=state.board;
  const board=[boardToWorld([-b.length/2,0,0],b),boardToWorld([b.length/2,0,0],b)];
  const end:Vec3=[b.position[0]+state.travel[0],0,b.position[2]+state.travel[2]];
  const [nx,ny]=p(board[1]);
  return <svg className="sl3-route" viewBox="0 0 360 205" role="img" aria-label="同一动作的俯视路线，圆点标出板头">
    <polyline points={path(trail)} fill="none" stroke="#ccd8cf" strokeDasharray="4 4"/>
    <polyline points={path(trail.slice(0,Math.max(1,Math.round(time*100)+1)))} fill="none" stroke="#3b7f72" strokeWidth="2"/>
    <polyline points={path(board)} stroke="#b68143" strokeWidth="5" strokeLinecap="round"/><circle cx={nx} cy={ny} r="4" fill="#533b22"/>
    {Math.hypot(...state.travel)>.01&&<polyline points={path([b.position,end])} stroke="#477c95" strokeWidth="2"/>}
    <text x="12" y="19">俯视：板轴、移动方向、路线同源</text><text x="12" y="195">坡下 ↓　棕色：板轴　蓝色：移动方向</text>
  </svg>;
}
function Player({config,api}:{config:LessonConfig;api:{current:Partial<PlayerApi>}}) {
  const [time,setTime]=useState(0),[playing,setPlaying]=useState(false),[speed,setSpeed]=useState(.65);
  const [stance,setStance]=useState<Stance>(config.stance??"regular");
  const [view,setView]=useState<View>(toView(config.view)),[reset,setReset]=useState(0);
  const [skeleton,setSkeleton]=useState(Boolean(config.jointLabels)),[touchRotate,setTouchRotate]=useState(false),[flat,setFlat]=useState(false);
  const [expanded,setExpanded]=useState(false);
  const root=useRef<HTMLDivElement>(null);
  const dialog=useRef<HTMLDialogElement>(null),expandButton=useRef<HTMLButtonElement>(null);
  const frame=useMemo(()=>sampleLesson(time,config,stance),[time,config,stance]);
  const trail=useMemo(()=>lessonTrail(config,stance),[config,stance]);
  const duration=Math.max(4000,config.duration??10000);
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
    <p className="sl3-hint">鼠标拖动旋转、滚轮缩放；再次点视角复位。触屏旋转关闭时可滚动页面。</p>
    </div><div className="sl3-explain">
    <div className="sl3-stages" role="group" aria-label="动作阶段">{frame.stages.map((s,i)=><button key={i} aria-pressed={frame.stage===i} onClick={()=>seek(s.at)}><span>{i+1}</span>{s.title}</button>)}</div>
    <div className="sl3-cue"><strong>{frame.stages[frame.stage].title}</strong><p>{frame.stages[frame.stage].detail}</p></div>
    {config.type==="inclination"&&<p className="sl3-hint">本组比较身体与板的几何关系；实际组合仍需匹配速度、弯形和雪况。</p>}
    {frame.task==="static-edge"&&<p className="sl3-hint">双手扶稳护栏帮助感知动作；撤去支撑后的自主平衡需另行练习。</p>}
    {frame.moving&&<RouteDiagram state={frame.state} trail={trail} time={time}/>}
    <details className="sl3-evidence"><summary>动作依据与示意边界</summary><p>依据 CASI Reference Guide 的站姿与平衡（43–50 页）、两刃差异（155 页）、前后调整（173 页）及单弯任务（86–88 页）设计。关节幅度、刃角与时长为作者编排，尚未经过教练实拍逐帧标定。</p><p>两脚、骨长与装备连接受约束；小腿的前倾和少量侧向活动是此示例的软靴假设，不是个人活动上限。圆点为分段质心估计，方向线不表示力或承重比例。</p><a href="https://members.casi-acms.com/documents/Ref_Guide.pdf" target="_blank" rel="noreferrer">阅读 CASI 原始教材 ↗</a></details>
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
window.SnowLesson3D={types:LESSON_TYPES,mount};
