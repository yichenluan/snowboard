import {BODY,boardToWorld,type MotionState,type Stance,type Vec3} from "../prototype/motion";

/** Same world-space cross-sections and boot normals as the 3D renderer. */
export function TwistSectionDiagram({state,stance}:{state:MotionState;stance:Stance}) {
  const b=state.board;if(!b.segmentRolls)return null;
  const toeSign=stance==="regular"?1:-1,toe:Vec3=[toeSign*Math.sin(b.yaw),0,toeSign*Math.cos(b.yaw)],scale=400;
  return <svg className="sl3-direction" viewBox="0 0 360 220" role="img" aria-label="原前后脚处的实际板面截面、靴底法向与几何低侧高度">
    <text x="12" y="20">两段刃角：板面与固定器分别跟随局部姿态</text>
    <path d="M12 160H348" stroke="#a5bbb0" strokeWidth="2"/>
    <path d="M180 34V183" stroke="#d8e4dc" strokeDasharray="3 4"/>
    {(["front","rear"] as const).map((which,index)=>{
      const x=(which==="front"?1:-1)*BODY.stanceWidth/2,origin=90+180*index,center=boardToWorld([x,0,0],b),boot=state.boots[which];
      const project=(p:Vec3)=>[origin+scale*p.reduce((sum,v,i)=>sum+(v-center[i])*toe[i],0),160-scale*p[1]];
      const points=[-1,1].map(sign=>boardToWorld([x,-b.thickness/2,sign*b.width/2],b)),low=points.reduce((a,z)=>a[1]<z[1]?a:z);
      const normalEnd=boot.position.map((v,i)=>v+.14*boot.up[i]) as Vec3,roll=b.segmentRolls![which]*toeSign,degrees=Math.abs(roll)*180/Math.PI,edge=Math.abs(roll)<.008?"近平板":roll>0?"前刃":"后刃";
      const str=(ps:Vec3[])=>ps.map(p=>project(p).join(",")).join(" ");
      const color=which==="front"?"#c47745":"#477c95";
      return <g key={which}>
        <text x={origin} y="42" textAnchor="middle" fill={color}>{which==="front"?"原前脚处":"原后脚处"}</text>
        <text x={origin} y="63" textAnchor="middle">{edge} {degrees.toFixed(1)}°</text>
        <polyline points={str(points)} stroke={color} strokeWidth="6"/>
        <polyline points={str([boot.position,normalEnd])} stroke={color} strokeWidth="3"/>
        <circle cx={project(boot.position)[0]} cy={project(boot.position)[1]} r="4" fill={color}/>
        <circle cx={project(low)[0]} cy={project(low)[1]} r="4" fill={low[1]<1e-5?"#168c76":"#fff"} stroke="#168c76"/>
        <text x={origin} y="181" textAnchor="middle" fontSize="11">低侧高度 {(Math.max(0,low[1])*1000).toFixed(1)} mm</text>
      </g>;
    })}
    <text x="12" y="207" fontSize="11">短线：靴底法向；高度为几何值，不表示局部压力。</text>
  </svg>;
}
