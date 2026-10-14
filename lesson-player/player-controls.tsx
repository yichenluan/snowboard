import { useEffect, useState, type RefObject } from "react";

export type PlayerApi={destroy():void;play():void;pause():void;seek(t:number):void;setView(view:string):void;element:HTMLElement};
export function usePlayback(duration:number,root:RefObject<HTMLDivElement|null>,api:{current:Partial<PlayerApi>}) {
  const [time,setTime]=useState(0),[playing,setPlaying]=useState(false),[speed,setSpeed]=useState(.65);
  const play=()=>{if(time>=1)setTime(0);setPlaying(true);};
  const seek=(t:number)=>{setPlaying(false);setTime(Math.max(0,Math.min(1,Number.isFinite(t)?t:0)));};
  api.current={...api.current,play,pause:()=>setPlaying(false),seek};
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
  },[root]);
  return {time,playing,speed,setSpeed,setPlaying,play,seek};
}
export function PlaybackControls({clock}:{clock:ReturnType<typeof usePlayback>}) {
  const {time,playing,speed,setPlaying,setSpeed,play,seek}=clock;
  return <div className="sl3-play"><button onClick={()=>playing?setPlaying(false):play()}>{playing?"暂停":time>=1?"重新播放":"播放"}</button><input aria-label="动作进度" type="range" min="0" max="1000" value={Math.round(time*1000)} onChange={e=>seek(Number(e.target.value)/1000)}/><label>速度 <select aria-label="播放速度" value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value="0.35">慢放</option><option value="0.65">分解</option><option value="1">正常</option></select></label></div>;
}
