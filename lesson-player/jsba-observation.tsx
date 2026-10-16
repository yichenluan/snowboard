import type {MotionState, Stance, Vec3} from "../prototype/motion";

const sub=(a:Vec3,b:Vec3):Vec3=>a.map((v,i)=>v-b[i]) as Vec3;
const cross=(a:Vec3,b:Vec3):Vec3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=(v:Vec3):Vec3=>{const n=Math.hypot(...v);return v.map(x=>x/Math.max(n,1e-12)) as Vec3;};
const dot=(a:Vec3,b:Vec3)=>a.reduce((n,v,i)=>n+v*b[i],0);

/** Uses the same joint frames as the visible body, including mirrored anatomy.
 * The result is a horizontal direction, never a measured joint/boot angle. */
export function jsbaBodyObservation(state:MotionState,stance:Stance){
  const j=state.joints,b=state.board,sign=stance==="regular"?1:-1;
  const nose:Vec3=[Math.cos(b.yaw),0,-Math.sin(b.yaw)];
  const toe:Vec3=[sign*Math.sin(b.yaw),0,sign*Math.cos(b.yaw)];
  const up=unit(sub(j.neck,j.pelvis));
  const facing=(a:Vec3,c:Vec3)=>{
    const right=sub(a,c).map(v=>v*sign) as Vec3;
    const forward=cross(right,up),horizontal=unit([forward[0],0,forward[2]]);
    return {towardNose:dot(horizontal,nose),towardToe:dot(horizontal,toe)};
  };
  const hip=facing(j.frontHip,j.rearHip),chest=facing(j.frontShoulder,j.rearShoulder);
  return {hip,chest,
    frontLeg:Math.hypot(...sub(j.frontHip,j.frontAnkle)),
    rearLeg:Math.hypot(...sub(j.rearHip,j.rearAnkle)),
  };
}

export function JsbaOpenDirections({state,stance}:{state:MotionState;stance:Stance}){
  const observation=jsbaBodyObservation(state,stance);
  const arrows=[{name:"骨盆前方",color:"#285e58",value:observation.hip,length:72},{name:"胸前",color:"#95608c",value:observation.chest,length:96}];
  return <div className="sl3-diagnostic"><svg viewBox="0 0 360 215" role="img" aria-label="随雪板观察胸前与骨盆前方的开放朝向">
    <text x="12" y="20">开放姿态：胸前与骨盆朝哪里</text>
    <path d="M180 42V183" stroke="#b68143" strokeWidth="7" strokeLinecap="round"/>
    <circle cx="180" cy="42" r="5" fill="#533b22"/>
    <path d="M167 75L180 45L193 75M180 127H298m-10-6 10 6-10 6" stroke="#b68143" fill="none"/>
    <text x="196" y="49">板头</text><text x="283" y="150">脚尖侧</text>
    {arrows.map(a=>{const x=180+a.value.towardToe*a.length,y=127-a.value.towardNose*a.length;
      const angle=Math.atan2(y-127,x-180),wing=(side:number)=>[x-11*Math.cos(angle+side*.48),y-11*Math.sin(angle+side*.48)];
      return <g key={a.name} fill="none" stroke={a.color} strokeWidth="3"><path d={`M180 127L${x} ${y}M${wing(-1).join(" ")}L${x} ${y}L${wing(1).join(" ")}`}/><circle cx={x} cy={y} r="3" fill={a.color}/></g>;
    })}
    <text x="48" y="205" fill="#285e58">绿：骨盆前方</text><text x="205" y="205" fill="#95608c">紫：胸前</text>
  </svg><p className="sl3-hint">板头始终朝上。箭头表示人物正面的水平朝向，不表示发力。三维中的浅色胸前短线和腰前标记分别帮助辨认胸、髋正面；头部可以独立转动。只转头、只转胸，都不能代替开髋，具体幅度是本动画示例。</p></div>;
}

export function JsbaLegDetails({samples,current,stance,time}:{samples:MotionState[];current:MotionState;stance:Stance;time:number}){
  const values=samples.map(s=>jsbaBodyObservation(s,stance)),now=jsbaBodyObservation(current,stance);
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
