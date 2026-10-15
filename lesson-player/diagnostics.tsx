import { useMemo } from "react";
import { type Stance, type Vec3 } from "../prototype/motion";
import { sampleLesson, type LessonConfig } from "./motion";
import { meanLegLength } from "./pressure-advanced";
import { supportsExpertShortLesson } from "./expert-short-turns";
import { supportsExpertCarvingLesson, expertCarvingVariants } from "./expert-carving";

/** Both diagrams read world-space output. Neither creates a pressure signal. */
export function LessonDiagnostics({config,stance,time}:{config:LessonConfig;stance:Stance;time:number}) {
  const expertLoad=supportsExpertShortLesson(config)&&config.task==="expert-load-release";
  const carveCompare=supportsExpertCarvingLesson(config)&&config.task!=="expert-carve-arc";
  const compareVariants=expertLoad?[{value:"continuous",label:"参考"},{value:"held-release",label:"准备偏晚"}]:carveCompare?expertCarvingVariants(config).map((o,i)=>({...o,label:config.task==="expert-carve-release"?(i?"屈腿偏晚":"协调参考"):(i?"稍低后恢复":"正常参考")})):null;
  const samples=useMemo(()=>Array.from({length:161},(_,i)=>sampleLesson(i/160,config,stance).state),[config,stance]);
  const timingCurves=useMemo(()=>config.variant==="timing-study"?(["early","baseline","late"] as const).map((timing,index)=>({timing,label:["提前","参考","稍后"][index],color:["#b47740","#285e58","#477c95"][index],values:Array.from({length:161},(_,i)=>meanLegLength(sampleLesson(i/160,{type:"pressure-extend",variant:"timing-study",fromEdge:config.fromEdge,timing},stance).state))})):null,[config.variant,config.fromEdge,stance]);
  const expertCurves=useMemo(()=>compareVariants?.map((option,i)=>({timing:option.value,label:option.label,color:i===0?"#285e58":"#95608c",values:Array.from({length:161},(_,n)=>meanLegLength(sampleLesson(n/160,{...config,variant:option.value},stance).state))}))??null,[expertLoad,carveCompare,config,stance]);
  const current=sampleLesson(time,config,stance).state;
  if(config.legLengthDiagram||expertLoad||carveCompare) {
    const values=samples.map(meanLegLength),all=(expertCurves??timingCurves)?.flatMap(c=>c.values)??values;
    const lo=Math.min(...all)-.005,hi=Math.max(...all)+.005;
    const p=(i:number,v:number)=>[38+i/160*284,170-(v-lo)/(hi-lo)*115];
    const curves=expertCurves??timingCurves??[{timing:"baseline",label:"腿部伸缩",color:"#285e58",values}];
    const selected=compareVariants?config.variant:config.timing??"baseline",now=p(time*160,meanLegLength(current));
    const expertNow=expertCurves?.map(c=>({...c,value:meanLegLength(sampleLesson(time,{...config,variant:c.timing},stance).state)}));
    return <div className="sl3-diagnostic"><svg viewBox="0 0 360 220" role="img" aria-label="两侧髋到脚踝的平均距离随时间变化，不是压力曲线">
      <text x="12" y="18">两腿伸缩：髋—踝平均距离（米）</text>
      {expertNow?expertNow.map((c,i)=><text key={c.timing} x={12+i*174} y="38" style={{fill:c.color,fontSize:11}}>{c.label} {c.value.toFixed(3)} m{c.timing===selected?" · 当前":""}</text>):curves.map((c,i)=><text key={c.timing} x={40+i*100} y="38" style={{fill:c.color}}>{c.label}{timingCurves&&c.timing===selected?" · 当前":""}</text>)}
      <path d="M38 50V170H328" fill="none" stroke="#bacdc2"/>
      {[lo,(lo+hi)/2,hi].map(v=><g key={v}><path d={`M38 ${p(0,v)[1]}H328`} stroke="#dce5dc"/><text x="2" y={p(0,v)[1]+4}>{v.toFixed(3)}</text></g>)}
      {timingCurves&&<path d="M180 50V170" stroke="#b4b9b0" strokeDasharray="3 3"/>}
      {curves.map(c=><polyline key={c.timing} points={c.values.map((v,i)=>p(i,v).join(",")).join(" ")} fill="none" stroke={c.color} strokeWidth={c.timing===selected?2.5:1.2} strokeDasharray={c.timing===selected?undefined:"3 3"}/>)}
      {expertNow?<><path d={`M${now[0]} 50V170`} stroke="#b4b9b0" strokeDasharray="3 3"/>{expertNow.map(c=><circle key={c.timing} cx={p(time*160,c.value)[0]} cy={p(time*160,c.value)[1]} r={c.timing===selected?4.5:3.5} fill={c.color} stroke="#fffdf6" strokeWidth="1"/>)}</>:<circle cx={now[0]} cy={now[1]} r="4" fill="#8b5038"/>}
      <text x="38" y="189">0%</text><text x="162" y="189">50%</text><text x="300" y="189">100%</text>
      <text x="12" y="211">{compareVariants?"竖线：当前进度；实线当前，虚线对照":timingCurves?"竖虚线：同一平板时刻；纵轴放大看差异":"纵轴已放大，便于看清腿部伸缩"}</text>
    </svg><p className="sl3-hint">{compareVariants&&"两条曲线与圆点分别对应当前动作和参考动作的同一时刻，共用板路线、板角与放刃时刻；纵轴放大看差异。"}这里用髋到脚踝的直线距离表示双腿的屈伸程度，骨骼本身没有变长；它不是质心高度、肌肉力或压力。</p></div>;
  }
  if(config.pressureDiagram) {
    const heights=samples.map(s=>s.com[1]),lo=Math.min(...heights)-.01,hi=Math.max(...heights)+.01;
    const p=(i:number,y:number)=>[32+i/160*290,178-(y-lo)/(hi-lo)*130];
    const point=p(time*160,current.com[1]);
    return <div className="sl3-diagnostic"><svg viewBox="0 0 360 220" role="img" aria-label="与人物同步的估计质心高度曲线，不是压力曲线">
      <text x="12" y="20">估计质心高度（m）· 纵轴放大看变化</text>
      <path d="M32 38V178H328" fill="none" stroke="#bacdc2"/>
      {[lo,(lo+hi)/2,hi].map(v=><g key={v}><path d={`M32 ${p(0,v)[1]}H328`} stroke="#dce5dc"/><text x="2" y={p(0,v)[1]+4}>{v.toFixed(2)}</text></g>)}
      <polyline points={heights.map((v,i)=>p(i,v).join(",")).join(" ")} fill="none" stroke="#3b7f72" strokeWidth="2"/>
      <circle cx={point[0]} cy={point[1]} r="4" fill="#b47740"/>
      <text x="32" y="198">0%</text><text x="168" y="198">50%</text><text x="300" y="198">100%</text>
    </svg><p className="sl3-hint">曲线按人物各身体部分的位置估算整体重心（质心）的高度；压力还与加速度和支撑条件有关，不能从高低直接读出。</p></div>;
  }
  if(config.transitionReference!=="snow")return null;
  const positions=samples.flatMap(s=>[s.board.position,s.joints.pelvis,s.joints.chest]);
  const x0=Math.min(-1,...positions.map(p=>p[0]))-.3,x1=Math.max(1,...positions.map(p=>p[0]))+.3;
  const scale=Math.min(310/(x1-x0),170/2);
  const p=(v:Vec3)=>[180+(v[0]-(x0+x1)/2)*scale,220-v[1]*scale];
  const path=(vs:Vec3[])=>vs.map(v=>p(v).join(",")).join(" ");
  const curves=[{name:"板中心",color:"#b47740",points:samples.map(s=>s.board.position),now:current.board.position},{name:"骨盆",color:"#477c95",points:samples.map(s=>s.joints.pelvis),now:current.joints.pelvis},{name:"胸部",color:"#285e58",points:samples.map(s=>s.joints.chest),now:current.joints.chest}];
  return <div className="sl3-diagnostic"><svg viewBox="0 0 360 250" role="img" aria-label="从固定位置观察板中心、骨盆和胸部的移动">
    <text x="12" y="20">固定侧视：横坡移动与离雪高度</text>
    <path d="M12 220H348" stroke="#b4c7bb"/>
    {curves.map((curve,i)=><g key={curve.name}>
      <text x={12+i*110} y="39" style={{fill:curve.color}}>{curve.name}</text>
      <polyline points={path(curve.points)} fill="none" stroke={curve.color} strokeOpacity=".3" strokeDasharray="3 3"/>
      <polyline points={path(curve.points.slice(0,Math.round(time*160)+1))} fill="none" stroke={curve.color} strokeWidth="2"/>
      <circle cx={p(curve.now)[0]} cy={p(curve.now)[1]} r="4" fill={curve.color}/>
    </g>)}
    <text x="12" y="240">从坡下看：横轴为横坡位置，纵轴为高度</text>
  </svg><p className="sl3-hint">本图从固定位置看身体与雪板怎样移动；上方三维镜头则跟随雪板。骨盆位置不等于质心或压力中心。</p></div>;
}
