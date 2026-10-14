import { useEffect, useMemo, useRef, useState } from "react";
import { sampleDryland } from "./dryland";
import { DrylandScene, DrylandPlanar, type DryView } from "./dryland-scene";
import { usePlayback, PlaybackControls, type PlayerApi } from "./player-controls";
import type { LessonConfig } from "./motion";

export { canRenderDryland } from "./dryland";
const views:[DryView,string][]=[["oblique","斜视"],["front","正面"],["side","侧面"],["feet","足部近景"]];
const toView=(s?:string):DryView=>s==="side"||s==="front"||s==="feet"||s==="shoulders"?s:"oblique";
function evidence(type:string) {
  if(type==="dry-squat")return {label:"ACE · Bodyweight Squat",url:"https://www.acefitness.org/resources/everyone/exercise-library/135/bodyweight-squat/",text:"参考髋膝协调下降、脚跟支撑与共同起身。不同任务另行缩小幅度、增加扶稳或延长保持；不要求统一蹲深，也不把膝限制在脚尖后。"};
  if(type==="dry-calf-raise")return {label:"HSS · Ankle Stretches and Exercises",url:"https://www.hss.edu/health-library/move-better/ankle-stretches-exercises",text:"参考双脚提踵、短停和受控回落。动画采用轻扶稳椅版本，前掌固定；雪上前刃的脚跟仍留靴内，任务条件不同。"};
  if(type==="dry-shoulder-rolls")return {label:"NHS · How to warm up before exercising",url:"https://www.nhs.uk/live-well/exercise/how-to-warm-up-before-exercising/",text:"参考肩向前、向后绕动和手臂放松。这里只拆解站定绕肩；来源中的完整热身还配合踏步，不能用大幅抡臂替代肩带小圈。"};
  return {label:"阅读分腿膝向墙练习作为区别参考",url:"https://www.opalreturntowork.nhs.uk/exercises/knee-to-wall-stretch/",text:"本段为作者设计的双脚并列扶墙屈踝感知，全脚掌留地。它与来源中的前后分腿膝向墙练习不同，不把并列版本称为该来源的标准动作。"};
}
export function DrylandPlayer({config,api}:{config:LessonConfig;api:{current:Partial<PlayerApi>}}) {
  const root=useRef<HTMLDivElement>(null),dialog=useRef<HTMLDialogElement>(null),expandButton=useRef<HTMLButtonElement>(null);
  const clock=usePlayback(Math.max(4000,config.duration??10000),root,api),{time,seek}=clock;
  const [view,setView]=useState<DryView>(toView(config.view)),[reset,setReset]=useState(0),[flat,setFlat]=useState(false);
  const [skeleton,setSkeleton]=useState(Boolean(config.jointLabels)),[touchRotate,setTouchRotate]=useState(false),[expanded,setExpanded]=useState(false);
  const frame=useMemo(()=>sampleDryland(time,config),[time,config]),source=evidence(config.type);
  api.current.setView=(v:string)=>{setView(toView(v));setReset(n=>n+1);};
  useEffect(()=>{
    if(expanded)dialog.current?.showModal();
    else if(dialog.current?.open){dialog.current.close();expandButton.current?.focus();}
  },[expanded]);
  const fallback=<div className="sl3-fallback"><p>三维暂不可用，仍可播放同一普通鞋骨架并观察支撑。</p><DrylandPlanar frame={frame} view={view}/></div>;
  const contacts=Array.from(new Set(frame.contacts.map(c=>c.surface)));
  const support=contacts.includes("wall")?"双手扶墙":contacts.includes("chair.top")?"双手轻扶稳椅":"自主站立";
  const end=time===1;
  const content=<section className={`sl3${expanded?" sl3-expanded":""}`} aria-label={config.title??"离雪动作示意"}>
    <div className="sl3-heading"><div className="sl3-heading-bar"><span>离雪练习 · 普通鞋 · 三维观察</span><button ref={expanded?undefined:expandButton} onClick={()=>setExpanded(v=>!v)}>{expanded?"收起观察":"放大观察"}</button></div><h3>{config.title??config.type}</h3>{config.focus&&<p>{config.focus}</p>}</div>
    <div className="sl3-observe">
      <div className="sl3-views" role="group" aria-label="观察视角">{[...views,...(config.type==="dry-shoulder-rolls"?[["shoulders","肩部近景"] as [DryView,string]]:[])].map(([v,label])=><button key={v} aria-pressed={!flat&&view===v} onClick={()=>{setView(v);setFlat(false);setReset(n=>n+1);}}>{label}</button>)}<button aria-pressed={flat} onClick={()=>setFlat(v=>!v)}>平面骨架</button></div>
      <div className="sl3-scene">{flat?<DrylandPlanar frame={frame} view={view}/>:<DrylandScene frame={frame} view={view} skeleton={skeleton} touchRotate={touchRotate} reset={reset} fallback={fallback}/>}</div>
      <div className="sl3-status"><strong>{support}</strong><span>离雪观察 · {Math.round(time*100)}%</span></div>
      <PlaybackControls clock={clock}/>
      <div className="sl3-options"><label><input type="checkbox" checked={skeleton} onChange={e=>setSkeleton(e.target.checked)}/>透视关节</label><label><input type="checkbox" checked={touchRotate} onChange={e=>setTouchRotate(e.target.checked)}/>触屏旋转</label><span className="sl3-hint">蓝：左侧　橙：右侧</span></div>
      <p className="sl3-hint sl3-input-help">鼠标拖动旋转、滚轮缩放；再次点视角复位。触屏旋转关闭时可滚动页面。</p>
    </div><div className="sl3-explain">
      <div className="sl3-stages" role="group" aria-label="动作阶段">{frame.phases.map((p,i)=><button key={i} aria-pressed={frame.phase===i} onClick={()=>seek(p.at)}><span>{i+1}</span>{p.title}</button>)}</div>
      <div className="sl3-cue"><strong>{end?"已回到本段起始位置":frame.phases[frame.phase].title}</strong><p>{end?"本次示意结束，可停留观察或主动重新播放；训练次数与幅度按自己的任务另行安排。":frame.phases[frame.phase].detail}</p></div>
      <p className="sl3-hint">普通鞋模型允许脚踝随任务活动；鞋底、骨长和支撑接触共同约束动作。本段不模拟雪上压力，也不代表训练后的技术效果。</p>
      <details className="sl3-evidence"><summary>动作依据与示意边界</summary><p>{source.text}</p><p>人体比例、动作幅度与时长为作者编排；骨架与实体使用同一状态，尚未完成教练实拍逐帧标定。</p><a href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a></details>
    </div></section>;
  return <><div ref={root}>{!expanded&&content}</div><dialog ref={dialog} className="sl3-dialog" aria-label={`放大观察：${config.title??config.type}`} onCancel={()=>setExpanded(false)} onClose={()=>setExpanded(false)}>{expanded&&content}</dialog></>;
}
