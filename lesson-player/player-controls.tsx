import { useEffect, useState, type RefObject } from "react";
import { advancePlayback, phaseRange, type PlaybackRange } from "./playback";

export type PlayerApi={destroy():void;play():void;pause():void;seek(t:number):void;setView(view:string):void;element:HTMLElement};
export function usePlayback(duration:number,root:RefObject<HTMLDivElement|null>,api:{current:Partial<PlayerApi>}) {
  const [time,setTime]=useState(0),[playing,setPlaying]=useState(false),[speed,setSpeed]=useState(.65);
  const [loop,setLoop]=useState<PlaybackRange|null>(null);
  const play=()=>{if(loop&&(time<loop.start||time>=loop.end))setTime(loop.start);else if(time>=1)setTime(0);setPlaying(true);};
  const seek=(t:number)=>{setPlaying(false);setLoop(null);setTime(Math.max(0,Math.min(1,Number.isFinite(t)?t:0)));};
  api.current={...api.current,play,pause:()=>setPlaying(false),seek};
  useEffect(()=>{
    if(!playing)return;
    let last=performance.now(),id=0;
    const tick=(now:number)=>{const delta=Math.min(now-last,60);last=now;setTime(t=>{const next=advancePlayback(t,delta*speed/duration,loop);if(next.ended)setPlaying(false);return next.time;});id=requestAnimationFrame(tick);};
    id=requestAnimationFrame(tick);return()=>cancelAnimationFrame(id);
  },[playing,speed,duration,loop]);
  useEffect(()=>{
    const visibility=()=>{if(document.hidden)setPlaying(false);};
    document.addEventListener("visibilitychange",visibility);
    const observer=new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)setPlaying(false);});
    if(root.current)observer.observe(root.current);
    return()=>{observer.disconnect();document.removeEventListener("visibilitychange",visibility);};
  },[root]);
  return {time,playing,speed,setSpeed,setPlaying,play,seek,loop,setLoop};
}
export function PlaybackControls({clock,stages,stage=0}:{clock:ReturnType<typeof usePlayback>;stages?:{at:number;title:string}[];stage?:number}) {
  const {time,playing,speed,setPlaying,setSpeed,play,seek}=clock;
  return <><div className="sl3-play"><button onClick={()=>playing?setPlaying(false):play()}>{playing?"暂停":time>=1?"重新播放":"播放"}</button><input aria-label="动作进度" type="range" min="0" max="1000" value={Math.round(time*1000)} onChange={e=>seek(Number(e.target.value)/1000)}/><label>速度 <select aria-label="播放速度" value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value="0.35">慢放</option><option value="0.65">分解</option><option value="1">正常</option></select></label></div>
    <div className="sl3-options" role="group" aria-label="教学重播"><button aria-pressed={clock.loop?.start===0&&clock.loop?.end===1} onClick={()=>{clock.setLoop(clock.loop?.start===0&&clock.loop?.end===1?null:{start:0,end:1,label:"完整动作"});}}>完整循环</button>{stages&&<button aria-pressed={!!clock.loop&&!(clock.loop.start===0&&clock.loop.end===1)} onClick={()=>{const selected=!!clock.loop&&!(clock.loop.start===0&&clock.loop.end===1);clock.setLoop(selected?null:phaseRange(stages,stage));}}>循环当前段</button>}{clock.loop&&<span className="sl3-hint">重播：{clock.loop.label}。回跳为教学重播，非倒滑；拖动进度退出循环。</span>}</div></>;
}
