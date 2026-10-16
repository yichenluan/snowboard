import type {MotionState, Stance} from "../prototype/motion";
import {bodyOrientationObservation} from "./body-orientation";

export function JsbaLegDetails({samples,current,stance,time}:{samples:MotionState[];current:MotionState;stance:Stance;time:number}){
  const values=samples.map(s=>bodyOrientationObservation(s,stance)),now=bodyOrientationObservation(current,stance);
  const all=values.flatMap(v=>[v.frontLeg,v.rearLeg]),lo=Math.min(...all)-.005,hi=Math.max(...all)+.005;
  const p=(i:number,v:number)=>[38+i/(samples.length-1)*284,165-(v-lo)/(hi-lo)*110];
  const curves=[{key:"frontLeg" as const,name:"原前脚侧",color:"#ba7149"},{key:"rearLeg" as const,name:"原后脚侧",color:"#477c95"}];
  return <details className="sl3-evidence"><summary>分别看前后腿的收放</summary><svg viewBox="0 0 360 215" role="img" aria-label="原前脚和原后脚各自的髋到脚踝距离随时间变化">
    <text x="12" y="19">分腿观察：髋—踝距离（米）</text>
    {curves.map((c,i)=><text key={c.key} x={12+174*i} y="39" fill={c.color}>{c.name} {now[c.key].toFixed(3)} m</text>)}
    <path d="M38 50V165H328" fill="none" stroke="#bacdc2"/>
    {[lo,(lo+hi)/2,hi].map(v=><g key={v}><path d={`M38 ${p(0,v)[1]}H328`} stroke="#dce5dc"/><text x="2" y={p(0,v)[1]+4}>{v.toFixed(3)}</text></g>)}
    {curves.map(c=><g key={c.key}><polyline points={values.map((v,i)=>p(i,v[c.key]).join(",")).join(" ")} fill="none" stroke={c.color} strokeWidth="2"/><circle cx={p(time*(samples.length-1),now[c.key])[0]} cy={p(time*(samples.length-1),now[c.key])[1]} r="4" fill={c.color}/></g>)}
    <path d={`M${38+284*time} 50V165`} stroke="#b4b9b0" strokeDasharray="3 3"/>
    <text x="38" y="186">0%</text><text x="162" y="186">50%</text><text x="300" y="186">100%</text>
    <text x="12" y="209">两条腿可以不同幅度，甚至一收一展</text>
  </svg><p className="sl3-hint">颜色沿用人物的原前后脚身份，换成右脚在前也不交换。平均距离增加，不代表每条腿都在伸展；请分别看曲线与膝髋。距离不表示承重比例或压力。</p></details>;
}
