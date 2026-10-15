import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { TeachingScene, type View } from "../prototype/scene";
import { BODY, boardToWorld, type MotionState, type Stance, type Vec3 } from "../prototype/motion";
import { surfaceHalfWidthAt } from "../prototype/board-surface";
import { LESSON_TYPES, canRenderLesson, lessonTrail, sampleLesson, type LessonConfig } from "./motion";
import { LessonDiagnostics } from "./diagnostics";
import { usePlayback, PlaybackControls, type PlayerApi } from "./player-controls";
import { DrylandPlayer, canRenderDryland } from "./dryland-player";
import { isRotationLesson } from "./rotation";
import { supportsShortTurnLesson, shortTurnDurationMs, shortTurnTiming } from "./short-turns";
import { supportsSwitchLesson } from "./switch";
import { supportsTwistLesson, type TwistTiming } from "./twist";
import { TwistSectionDiagram } from "./twist-diagram";
import registry from "./registry.json";

declare global { interface Window { SnowLesson3D: { types: readonly string[]; canRender(config:LessonConfig):boolean; mount(container: HTMLElement|string, config: LessonConfig):PlayerApi } } }
const edges={toe:"前刃 · 脚尖侧",heel:"后刃 · 脚跟侧",flat:"接近平板"};
const views: [View,string][]=[["follow","斜视"],["side","看前后平衡"],["front","看两刃成角"],["boots","雪靴近景"]];
function evidenceFor(c:LessonConfig):string {
  if(supportsSwitchLesson(c))return "依据 CASI Reference Guide 第101–102页的反脚入门与基本搓雪连弯设计。原后脚从首帧领行，硬件鼻尾、固定器角度和脚的身份不交换；左右惯用脚只是镜像选择。本段不替代此前的独立停止与单弯练习。";
  if(supportsTwistLesson(c))return "依据 CASI Reference Guide 第59页的前后脚协调与板体扭转设计。前后段刃角与固定器局部姿态同源，时序差为作者示例；此处没有板材刚度、局部压力或真实雪面接触求解，不据此判定哪种时差更好。";
  if(supportsShortTurnLesson(c))return "依据 CASI Reference Guide 第49–50页的调刃与成角、第59页的上下身协调、第155–156页的两刃差异、第178页的侧滑接单弯，Level 2 第7、9页、Level 3 第13页与 AASI Performance Guide 第14页设计。普通圆弯、回收策略、侧滑衔接及各反例按不同任务编排；滑移并非全是错误。真实板头板尾路径、腿长与肩髋方向用于观察关系，不证明真实压力、减速度或某一原因。";
  if(isRotationLesson(c))return "依据 CASI Reference Guide 第47–48页的旋转与反向旋转、第59页的转向与上下身分离，以及第43–50页的站姿/调刃，以及第155页的两刃差异设计。肩、髋、板的实际朝向分别生成；架臂只是反馈，反向调速是有限专项工具。路线、角度与速度为作者编排，同路线的姿态对照不证明抓地或压力改善。";
  if(c.type==="retraction-turns")return "依据 CASI Level 3 Guide 第13页、SBINZ 手册 B/06 的回收过渡，以及 CASI Reference Guide 第59页的上下身配合设计。转换先收短实际髋踝距离，再在新弯逐渐恢复；上身允许自然运动。回收是可选策略，不是所有搓雪小回转的必要条件。";
  if(c.type==="knee-edge-change")return "依据 CASI Reference Guide 第43–50页的站姿、关节协调与调刃，以及第52页的屈曲过渡设计。膝是观察点，仍由踝膝髋共同完成；此例不演示膝独立扭板，也未计算真实压力。";
  if(c.type==="hip-edge-change")return c.task==="hip-transition"?"依据 CASI Reference Guide 第43–50页的站姿、调刃和关节协调设计。本例在滑行转换中观察髋与板的关系，采用温和伸展过渡；髋不是独立发动机。":"依据 CASI Reference Guide 第43–50页的站姿与调刃关系设计。本段为平地原地感知：先在平板支撑范围内调整，再立小刃并回平板；不代表坡面自主站稳或滑行动态平衡。";
  if(c.variant==="timing-study")return "依据 CASI Reference Guide 的 Timing & Coordination（55–57 页）设计。三档只平移同一髋踝距离包络；板路径、刃角与动画时长固定。腿长图显示几何距离，不是压力，三档不是优劣排名。";
  if(c.type==="edge-change-down")return "依据 SBINZ 手册 B/06 对身体降低与板回收的区分，以及 CASI Reference Guide 的 Down Un-weighting（52、54 页）设计。两种机制分别编排路线和幅度，不能据此比较同条件效率；固定雪面图显示板、骨盆与胸廓，未计算真实压力。";
  if(c.type==="pressure-flex"&&c.variant==="toe"||c.type==="pressure-extend"&&c.variant==="heel")return "依据 CASI Reference Guide 的屈伸与压力管理（51–54 页）设计。本例只展示同刃弯中的腿长、身体关系和渐停；屈伸速度、开始与结束不能直接转成真实压力值。";
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
  const paths=plane==="width"
    ?(b.segmentRolls?[1,-1]:[0]).map((sign,i)=>({color:b.segmentRolls?(i===0?"#ba7149":"#477c95"):"#b68143",points:[-1,1].map(side=>boardToWorld([sign*BODY.stanceWidth/2,-b.thickness/2,side*b.width/2],b))}))
    :[-1,1].map(side=>({color:"#b68143",points:Array.from({length:61},(_,i)=>{const x=-b.length/2+b.length*i/60;return boardToWorld([x,-b.thickness/2,side*surfaceHalfWidthAt(x,b)],b);})}));
  const snowY=point([b.position[0],0,b.position[2]])[1];
  return <svg viewBox="0 0 360 300" role="img" aria-label={plane==="width"?"沿板头看同一动作骨架":"沿板长看同一动作骨架"}>
    <path d={`M10 ${snowY}H350`} stroke="#cedbd3"/>
    {supportRail&&<g stroke="#7c817a" strokeWidth="5"><polyline points={supportRail.map(coords).join(" ")}/>{supportRail.map((p,i)=><polyline key={i} points={[p,[p[0],0,p[2]] as Vec3].map(coords).join(" ")}/>)}</g>}
    {paths.map((path,i)=><polyline key={i} points={path.points.map(coords).join(" ")} fill="none" stroke={path.color} strokeWidth="3"/>)}
    {bones.map(([a,b],i)=><polyline key={i} points={[state.joints[a],state.joints[b]].map(coords).join(" ")} fill="none" stroke={a.startsWith("front")?"#ba7149":a.startsWith("rear")?"#477c95":"#285e58"} strokeWidth="6" strokeLinecap="round"/>)}
    {(["frontAnkle","rearAnkle","frontKnee","rearKnee","pelvis","chest"] as const).map((key,i)=>{const [x,y]=point(state.joints[key]);return <g key={key}><circle cx={x} cy={y} r="5" fill="#fffdf6" stroke="#285e58" strokeWidth="2"/>{i>3&&<text x={x+12} y={y+3}>{i===4?"骨盆":"胸廓"}</text>}</g>;})}
    <circle cx={point(state.joints.head)[0]} cy={point(state.joints.head)[1]} r="13" fill="#285e58"/>
    <text x="15" y="22">{plane==="width"?"沿板头看 · 板宽方向":"沿板长看 · 前后位置"}</text>
    <text x="15" y="291">{b.segmentRolls&&plane==="width"?"板线：橙为原前脚截面，蓝为原后脚截面":"橙：原前脚侧　蓝：原后脚侧"}</text>
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
  </svg>{traces&&<><p className="sl3-hint">橙线：板头；紫线：板尾。两条线是雪板端点的几何路径，不是两脚各留一道雪痕，也不是板雪接触计算。</p><DirectionComparison state={state}/></>}{config.type==="gaze-control"&&<p className="sl3-hint">金色线：实际头部朝向；短暂扫描后回前方，板路线不变。</p>}{config.turnShape&&<p className="sl3-hint">开放／闭合使用相同图幅和最小弯径；播放时长随路线长度变化，不计算真实滑速。</p>}</>;
}
function DirectionComparison({state}:{state:MotionState}) {
  if(Math.hypot(...state.travel)<.01)return null;
  const b=state.board,direction=state.rideDirection??1,nose=boardToWorld([direction*b.length/2,0,0],b).map((v,i)=>v-b.position[i]);
  const norm=Math.hypot(nose[0],nose[2]),right=[state.travel[2],0,-state.travel[0]];
  const x=(nose[0]*right[0]+nose[2]*right[2])/norm,y=(nose[0]*state.travel[0]+nose[2]*state.travel[2])/norm;
  return <svg className="sl3-direction" viewBox="0 0 360 180" role="img" aria-label="同一时刻的板轴和行进方向局部放大对照">
    <text x="12" y="19">方向放大：板轴与行进方向</text>
    <polyline points={`${180-53*x},${91+53*y} ${180+53*x},${91-53*y}`} stroke="#b68143" strokeWidth="7" strokeLinecap="round"/>
    <circle cx={180+53*x} cy={91-53*y} r="5" fill="#533b22"/>
    <path d="M180 91V31m-5 9 5-9 5 9" fill="none" stroke="#477c95" strokeWidth="2"/>
    <text x="200" y="43">行进方向</text><text x="200" y="100">夹角 {state.metrics.skidAngle.toFixed(1)}°</text>
    {direction===-1&&<text x="12" y="156">圆点：行进前端（原板尾）</text>}
    <text x="12" y="174">方向随同一状态更新；角度不是练习目标值</text>
  </svg>;
}
function BoardDirections({state}:{state:MotionState}) {
  const b=state.board,long=[Math.cos(b.yaw),0,-Math.sin(b.yaw)],width=[Math.sin(b.yaw),0,Math.cos(b.yaw)];
  const toeSign=width[0]*state.boots.front.toeDirection[0]+width[2]*state.boots.front.toeDirection[2]>=0?1:-1;
  const p=(v:Vec3)=>{const q=v.map((n,i)=>n-b.position[i]);return [180+145*(q[0]*long[0]+q[2]*long[2]),93-145*toeSign*(q[0]*width[0]+q[2]*width[2])];};
  const corners=[[-b.length/2,0,-b.width/2],[b.length/2,0,-b.width/2],[b.length/2,0,b.width/2],[-b.length/2,0,b.width/2]] as Vec3[];
  return <svg className="sl3-direction" viewBox="0 0 360 180" role="img" aria-label="随板俯视，板头板尾与前后刃是两组方向">
    <text x="12" y="18">随板俯视：脚向与两组方向</text>
    <polygon points={corners.map(v=>p(boardToWorld(v,b)).join(",")).join(" ")} fill="#e4d5b7" stroke="#b68143"/>
    <text x="310" y="96">板头</text><text x="10" y="96">板尾</text>
    <text x="150" y="40">前刃 · 脚尖侧</text><text x="150" y="148">后刃 · 脚跟侧</text>
    {(["front","rear"] as const).map(k=>{const foot=state.boots[k],tip=foot.position.map((v,i)=>v+.2*foot.toeDirection[i]) as Vec3;return <g key={k}><polyline points={[foot.position,tip].map(v=>p(v).join(",")).join(" ")} stroke={k==="front"?"#ba7149":"#477c95"} strokeWidth="5"/><circle cx={p(tip)[0]} cy={p(tip)[1]} r="3" fill="#285e58"/></g>;})}
    <circle cx={p(state.joints.pelvis)[0]} cy={p(state.joints.pelvis)[1]} r="5" fill="#285e58"/>
    <text x="12" y="174">线段：两脚朝向　绿点：骨盆投影（不是压力中心）</text>
  </svg>;
}
function RotationDirections({state}:{state:MotionState}) {
  const j=state.joints,b=state.board;
  const lines=[
    {name:"板轴",color:"#b68143",axis:[Math.cos(b.yaw),-Math.sin(b.yaw)],length:77},
    {name:"髋线",color:"#285e58",axis:[j.frontHip[0]-j.rearHip[0],j.frontHip[2]-j.rearHip[2]],length:52},
    {name:"肩线",color:"#95608c",axis:[j.frontShoulder[0]-j.rearShoulder[0],j.frontShoulder[2]-j.rearShoulder[2]],length:66},
  ];
  return <><svg className="sl3-direction" viewBox="0 0 360 220" role="img" aria-label="雪面俯视的真实板轴髋线肩线方向对照">
    <text x="12" y="20">方向对照：板、髋、肩分别连续变化</text>
    <path d="M325 64V152m-5-9 5 9 5-9" stroke="#a2b5ac" fill="none"/><text x="302" y="174">坡下</text>
    {lines.map((line,i)=>{const n=Math.hypot(...line.axis),x=line.axis[0]/n*line.length,z=line.axis[1]/n*line.length;return <g key={line.name} stroke={line.color} fill={line.color}><path d={`M${180-x} ${115-z}L${180+x} ${115+z}`} strokeWidth="4"/><circle cx={180+x} cy={115+z} r="4"/><text x={28+i*110} y="213" stroke="none">{line.name}</text></g>;})}
  </svg><p className="sl3-hint">来自实际关节的雪面投影，移到同一中心便于比较方向；线长不表示身体尺寸。圆点为板头／惯用前脚侧。</p></>;
}
function Player({config,api}:{config:LessonConfig;api:{current:Partial<PlayerApi>}}) {
  const root=useRef<HTMLDivElement>(null);
  const short=supportsShortTurnLesson(config),shortTiming=shortTurnTiming(config);
  const twist=supportsTwistLesson(config),switchRide=supportsSwitchLesson(config);
  const duration=short?shortTurnDurationMs(config):Math.max(4000,config.duration??10000)*(config.turnShape==="closed"?80/35:1);
  const clock=usePlayback(duration,root,api),{time,setPlaying,seek}=clock;
  const [stance,setStance]=useState<Stance>(config.stance??"regular");
  const [fromEdge,setFromEdge]=useState<"toe"|"heel">(config.fromEdge??"heel");
  const [timing,setTiming]=useState<"early"|"baseline"|"late">(config.timing??"baseline");
  const [rotationComparison,setRotationComparison]=useState<"natural"|"slightly-open">(config.rotationComparison??"natural");
  const [twistTiming,setTwistTiming]=useState<TwistTiming>(config.twistTiming??(config.task==="twist-timing-compare"?"near-synchronous":"front-earlier"));
  const [edgeSide,setEdgeSide]=useState(config.edgeSide??"toe");
  const sampledConfig=useMemo(()=>({...config,fromEdge,timing,rotationComparison,...(twist?{twistTiming}:{}),...(config.task==="arms-traverse-stop"?{edgeSide}:{})}),[config,fromEdge,timing,rotationComparison,edgeSide,twist,twistTiming]);
  const [view,setView]=useState<View>(toView(config.view)),[reset,setReset]=useState(0);
  const [skeleton,setSkeleton]=useState(Boolean(config.jointLabels)),[touchRotate,setTouchRotate]=useState(false),[flat,setFlat]=useState(false);
  const [expanded,setExpanded]=useState(false);
  const dialog=useRef<HTMLDialogElement>(null),expandButton=useRef<HTMLButtonElement>(null);
  const frame=useMemo(()=>sampleLesson(time,sampledConfig,stance),[time,sampledConfig,stance]);
  const trail=useMemo(()=>lessonTrail(sampledConfig,stance),[sampledConfig,stance]);
  api.current.setView=(v:string)=>{setView(toView(v));setReset(n=>n+1);};
  useEffect(()=>{
    if(expanded) dialog.current?.showModal();
    else if(dialog.current?.open) {dialog.current.close();expandButton.current?.focus();}
  },[expanded]);
  const fallback:ReactNode=<div className="sl3-fallback"><p>三维暂不可用，下面仍是同一时刻的动作骨架。可继续播放与逐段观察。</p><PlanarDiagram state={frame.state} plane={view==="side"?"length":"width"} supportRail={frame.supportRail}/></div>;
  const content=<section className={`sl3${expanded?" sl3-expanded":""}`} aria-label={config.title??"三维动作示意"}>
    <div className="sl3-heading"><div className="sl3-heading-bar"><span>三维动作 · 可自由观察</span><button ref={expanded?undefined:expandButton} onClick={()=>setExpanded(v=>!v)}>{expanded?"收起观察":"放大观察"}</button></div><h3>{config.title??config.type}</h3>{config.focus&&<p>{config.focus}</p>}</div>
    <div className="sl3-observe">
    <div className="sl3-views" role="group" aria-label="观察视角">{views.map(([v,label])=><button key={v} onClick={()=>{setView(v);setFlat(false);setReset(n=>n+1);}} aria-pressed={!flat&&view===v}>{label}</button>)}<button aria-pressed={flat} onClick={()=>setFlat(v=>!v)}>平面骨架</button></div>
    <div className="sl3-scene">{flat?<PlanarDiagram state={frame.state} plane={view==="side"?"length":"width"} supportRail={frame.supportRail}/>:<TeachingScene state={frame.state} trail={trail} time={time} mode="correct" stance={stance} hold={0} view={view} layer="posture" skeleton={skeleton} motion={false} reset={reset} touchRotate={touchRotate} fallback={fallback} supportRail={frame.supportRail}/>}</div>
    <div className="sl3-status"><strong>{frame.segmentEdges?`原前脚处：${edges[frame.segmentEdges.front]}；原后脚处：${edges[frame.segmentEdges.rear]}`:edges[frame.state.edge]}</strong><span>{frame.moving?"示意路线":"原地观察"} · {Math.round(time*100)}%</span></div>
    <PlaybackControls clock={clock}/>
    <div className="sl3-options"><label><input type="checkbox" checked={skeleton} onChange={e=>setSkeleton(e.target.checked)}/>透视关节</label><label><input type="checkbox" checked={touchRotate} onChange={e=>setTouchRotate(e.target.checked)}/>触屏旋转</label><label>{switchRide?"惯用前脚":"前脚"} <select value={stance} onChange={e=>setStance(e.target.value as Stance)}><option value="regular">左脚</option><option value="goofy">右脚</option></select></label></div>
    {switchRide&&<p className="sl3-hint">当前行进前脚：原后脚；原板尾领行，硬件鼻尾与两脚颜色保持身份。</p>}
    {(twist||(short||["single-transition","lower-transition","retraction-transition","timing-study","hip-transition","coordinated-knee-transition","linked-retraction-skid"].includes(frame.task))&&!config.fromEdge)&&<div className="sl3-options"><label>{(short||frame.task==="linked-retraction-skid")?"起始工作刃":"转换方向"} <select value={fromEdge} onChange={e=>{setPlaying(false);setFromEdge(e.target.value as "toe"|"heel");}}><option value="heel">{(short||frame.task==="linked-retraction-skid")?"后刃开始":"后刃 → 前刃"}</option><option value="toe">{(short||frame.task==="linked-retraction-skid")?"前刃开始":"前刃 → 后刃"}</option></select></label></div>}
    {frame.task==="twist-timing-compare"&&<div className="sl3-options"><label>前后段时序 <select value={twistTiming} onChange={e=>{setPlaying(false);setTwistTiming(e.target.value as TwistTiming);}}><option value="near-synchronous">近同步</option><option value="front-earlier">前段稍先</option></select></label><span className="sl3-hint">同进度、同平面路线比较；时差不是优劣排名</span></div>}
    {frame.task==="timing-study"&&<div className="sl3-options"><label>屈伸启动时机 <select value={timing} onChange={e=>{setPlaying(false);setTiming(e.target.value as "early"|"baseline"|"late");}}><option value="early">提前</option><option value="baseline">基准</option><option value="late">稍后</option></select></label><span className="sl3-hint">保持当前进度比较；只改启动时刻</span></div>}
    {frame.task==="toe-orientation-stop"&&<div className="sl3-options"><label>肩髋朝向对照 <select value={rotationComparison} onChange={e=>{setPlaying(false);setRotationComparison(e.target.value as "natural"|"slightly-open");}}><option value="natural">自然朝向</option><option value="slightly-open">略多开放</option></select></label><span className="sl3-hint">保留当前进度；同路线、脚位与板角比较</span></div>}
    {frame.task==="arms-traverse-stop"&&<div className="sl3-options"><label>斜行工作刃 <select value={edgeSide} onChange={e=>{setPlaying(false);setEdgeSide(e.target.value);}}><option value="toe">前刃</option><option value="heel">后刃</option></select></label></div>}
    <p className="sl3-hint sl3-input-help">鼠标拖动旋转、滚轮缩放；再次点视角复位。触屏旋转关闭时可滚动页面。</p>
    </div><div className="sl3-explain">
    <div className="sl3-stages" role="group" aria-label="动作阶段">{frame.stages.map((s,i)=><button key={i} aria-pressed={frame.stage===i} onClick={()=>seek(s.at)}><span>{i+1}</span>{s.title}</button>)}</div>
    <div className="sl3-cue"><strong>{frame.stages[frame.stage].title}</strong><p>{frame.stages[frame.stage].detail}</p></div>
    {config.type==="inclination"&&<p className="sl3-hint">本组比较身体与板的几何关系；实际组合仍需匹配速度、弯形和雪况。</p>}
    {frame.task==="static-edge"&&<p className="sl3-hint">双手扶稳护栏帮助感知动作；撤去支撑后的自主平衡需另行练习。</p>}
    {["board-coordinate-study","stationary-hip-rock"].includes(frame.task)&&<><BoardDirections state={frame.state}/><p className="sl3-hint">仅演示平地原地感知，板角小不等于身体完全不移动；先回平板再回中，滑行效果需另行验证。</p></>}
    {frame.moving&&<RouteDiagram state={frame.state} trail={trail} time={time} config={sampledConfig} stance={stance}/>}
    {(isRotationLesson(config)||short)&&<RotationDirections state={frame.state}/>}
    {twist&&<><TwistSectionDiagram state={frame.state} stance={stance}/><p className="sl3-hint">绿色线与圆点仅标几何低侧；局部可短暂离雪约9.2毫米，未计算整刃接触、板材刚度或真实压力。两段角差按实际值显示。</p></>}
    {shortTiming&&<p className="sl3-hint">每次换侧 {(shortTiming.turnMs/1000).toFixed(1)} 秒；每侧侧滑等待 {(shortTiming.waitMs/1000).toFixed(1)} 秒。缩短等待时，换侧自身的路线和用时不变；等待阶段仍在侧滑。</p>}
    {(config.pressureDiagram||config.legLengthDiagram||config.transitionReference==="snow")&&<LessonDiagnostics config={sampledConfig} stance={stance} time={time}/>}
    {config.type==="edge-change-down"&&<p className="sl3-hint">两种示例分别编排路线和幅度，用于辨认运动机制；不能据此比较相同条件下哪种更高效。</p>}
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
  root.render(canRenderDryland(config)?<DrylandPlayer config={config} api={ref}/>:<Player config={config} api={ref}/>);
  return {element,play:()=>ref.current.play?.(),pause:()=>ref.current.pause?.(),seek:t=>ref.current.seek?.(t),setView:v=>ref.current.setView?.(v),destroy:()=>{if(destroyed)return;destroyed=true;root.unmount();element.remove();}};
}
window.SnowLesson3D={types:[...LESSON_TYPES,...registry.drylandTypes],canRender:c=>canRenderLesson(c)||canRenderDryland(c),mount};
