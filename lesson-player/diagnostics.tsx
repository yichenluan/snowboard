import { useMemo } from "react";
import { type Stance, type Vec3 } from "../prototype/motion";
import { sampleLesson, type LessonConfig } from "./motion";

/** Both diagrams read world-space output. Neither creates a pressure signal. */
export function LessonDiagnostics({config,stance,time}:{config:LessonConfig;stance:Stance;time:number}) {
  const samples=useMemo(()=>Array.from({length:161},(_,i)=>sampleLesson(i/160,config,stance).state),[config,stance]);
  const current=sampleLesson(time,config,stance).state;
  if(config.pressureDiagram) {
    const heights=samples.map(s=>s.com[1]),lo=Math.min(...heights)-.01,hi=Math.max(...heights)+.01;
    const p=(i:number,y:number)=>[32+i/160*290,178-(y-lo)/(hi-lo)*130];
    const point=p(time*160,current.com[1]);
    return <div className="sl3-diagnostic"><svg viewBox="0 0 360 220" role="img" aria-label="同源分段估计质心高度曲线，不是压力曲线">
      <text x="12" y="20">估计质心高度（m）· 纵轴放大看变化</text>
      <path d="M32 38V178H328" fill="none" stroke="#bacdc2"/>
      {[lo,(lo+hi)/2,hi].map(v=><g key={v}><path d={`M32 ${p(0,v)[1]}H328`} stroke="#dce5dc"/><text x="2" y={p(0,v)[1]+4}>{v.toFixed(2)}</text></g>)}
      <polyline points={heights.map((v,i)=>p(i,v).join(",")).join(" ")} fill="none" stroke="#3b7f72" strokeWidth="2"/>
      <circle cx={point[0]} cy={point[1]} r="4" fill="#b47740"/>
      <text x="32" y="198">0%</text><text x="168" y="198">50%</text><text x="300" y="198">100%</text>
    </svg><p className="sl3-hint">曲线由同一人体分段估计生成，显示高度；压力还与加速度和支撑条件有关，不能从高低直接读出。</p></div>;
  }
  if(config.transitionReference!=="snow")return null;
  const positions=samples.flatMap(s=>[s.board.position,s.joints.pelvis,s.joints.chest]);
  const x0=Math.min(-1,...positions.map(p=>p[0]))-.3,x1=Math.max(1,...positions.map(p=>p[0]))+.3;
  const scale=Math.min(310/(x1-x0),170/2);
  const p=(v:Vec3)=>[180+(v[0]-(x0+x1)/2)*scale,220-v[1]*scale];
  const path=(vs:Vec3[])=>vs.map(v=>p(v).join(",")).join(" ");
  const curves=[{name:"板中心",color:"#b47740",points:samples.map(s=>s.board.position),now:current.board.position},{name:"骨盆",color:"#477c95",points:samples.map(s=>s.joints.pelvis),now:current.joints.pelvis},{name:"胸廓",color:"#285e58",points:samples.map(s=>s.joints.chest),now:current.joints.chest}];
  return <div className="sl3-diagnostic"><svg viewBox="0 0 360 250" role="img" aria-label="固定雪面投影，板中心、骨盆和胸廓的同源世界坐标路径">
    <text x="12" y="20">固定雪面投影：横坡位置／离雪高度</text>
    <path d="M12 220H348" stroke="#b4c7bb"/>
    {curves.map((curve,i)=><g key={curve.name}>
      <text x={12+i*110} y="39" style={{fill:curve.color}}>{curve.name}</text>
      <polyline points={path(curve.points)} fill="none" stroke={curve.color} strokeOpacity=".3" strokeDasharray="3 3"/>
      <polyline points={path(curve.points.slice(0,Math.round(time*160)+1))} fill="none" stroke={curve.color} strokeWidth="2"/>
      <circle cx={p(curve.now)[0]} cy={p(curve.now)[1]} r="4" fill={curve.color}/>
    </g>)}
    <text x="12" y="240">雪面固定；坡下位移投影到纸面内</text>
  </svg><p className="sl3-hint">这是同一动作在固定雪面坐标中的投影；上方人物镜头跟随雪板。骨盆位置不等于质心或压力中心。</p></div>;
}
