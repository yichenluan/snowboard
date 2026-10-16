import type {MotionState, Stance, Vec3} from "../prototype/motion";
import type {LessonConfig} from "./motion";
import registry from "./registry.json";

/** Show facing when orientation is part of this task; this does not require a fixed opening. */
export function studiesBodyOrientation(c:LessonConfig){
  const scope=registry.bodyOrientationStudies;
  return scope.types.includes(c.type)||(scope.variants[c.type as keyof typeof scope.variants] as readonly string[]|undefined)?.includes(c.variant??"")===true||(scope.tasks[c.type as keyof typeof scope.tasks] as readonly string[]|undefined)?.includes(c.task??"")===true;
}

const sub=(a:Vec3,b:Vec3):Vec3=>a.map((v,i)=>v-b[i]) as Vec3;
const cross=(a:Vec3,b:Vec3):Vec3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=(v:Vec3):Vec3=>{const n=Math.hypot(...v);return v.map(x=>x/Math.max(n,1e-12)) as Vec3;};
const dot=(a:Vec3,b:Vec3)=>a.reduce((n,v,i)=>n+v*b[i],0);

/** Uses the same joint frames as the visible body, including mirrored anatomy.
 * The result is a horizontal direction, never a measured joint/boot angle. */
export function bodyOrientationObservation(state:MotionState,stance:Stance){
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

export function BodyOrientationDirections({state,stance}:{state:MotionState;stance:Stance}){
  const observation=bodyOrientationObservation(state,stance);
  const arrows=[{name:"骨盆前方",color:"#285e58",value:observation.hip,length:72},{name:"胸前",color:"#95608c",value:observation.chest,length:96}];
  return <div className="sl3-diagnostic"><svg viewBox="0 0 360 215" role="img" aria-label="随雪板分别观察胸前与骨盆前方的朝向">
    <text x="12" y="20">身体朝向：分别看胸前与骨盆</text>
    <path d="M180 42V183" stroke="#b68143" strokeWidth="7" strokeLinecap="round"/>
    <circle cx="180" cy="42" r="5" fill="#533b22"/>
    <path d="M167 75L180 45L193 75M180 127H298m-10-6 10 6-10 6" stroke="#b68143" fill="none"/>
    <text x="196" y="49">板头</text><text x="283" y="150">脚尖侧</text>
    {arrows.map(a=>{const x=180+a.value.towardToe*a.length,y=127-a.value.towardNose*a.length;
      const angle=Math.atan2(y-127,x-180),wing=(side:number)=>[x-11*Math.cos(angle+side*.48),y-11*Math.sin(angle+side*.48)];
      return <g key={a.name} fill="none" stroke={a.color} strokeWidth="3"><path d={`M180 127L${x} ${y}M${wing(-1).join(" ")}L${x} ${y}L${wing(1).join(" ")}`}/><circle cx={x} cy={y} r="3" fill={a.color}/></g>;
    })}
    <text x="48" y="205" fill="#285e58">绿：骨盆前方</text><text x="205" y="205" fill="#95608c">紫：胸前</text>
  </svg><p className="sl3-hint">板头始终朝上。箭头表示人物正面的水平朝向，不表示发力。三维中的浅色胸前短线和腰前标记分别帮助辨认胸、髋正面；头部可以独立转动。只转头、只转胸，都不能代替骨盆转动。是否需要开放取决于任务，具体幅度是本动画示例；身体朝向与跨向另一条刃要分开看。</p></div>;
}
