import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Ball, Segment, SceneBoundary } from "../prototype/scene";
import type { Vec3 } from "../prototype/motion";
import type { DrylandFrame, DryFoot, DryHand, DryProp, Side } from "./dryland";

export type DryView="oblique"|"front"|"side"|"feet"|"shoulders";
const V=(a:Vec3)=>new THREE.Vector3(...a);
const add=(a:Vec3,b:Vec3):Vec3=>a.map((v,i)=>v+b[i]) as Vec3;
const mul=(a:Vec3,n:number):Vec3=>a.map(v=>v*n) as Vec3;
const mid=(a:Vec3,b:Vec3):Vec3=>a.map((v,i)=>(v+b[i])/2) as Vec3;
const color={left:"#477c95",right:"#c47745",body:"#275b58",bone:"#ffdfa2"};
const sides:Side[]=["left","right"];
function viewFocus(frame:DrylandFrame,view:DryView):{center:Vec3;radius?:number} {
  if(!frame.cameraTarget)return {center:[0,view==="feet"?.15:view==="shoulders"?1.35:.85,.08]};
  const points:Vec3[]=view==="feet"
    ?sides.flatMap(side=>{const f=frame.feet[side];return [f.ankle,f.heel,f.ball,f.toe];})
    :view==="shoulders"?[frame.joints.chest,frame.joints.neck,frame.joints.head,...sides.flatMap(side=>{const l=frame.joints[side];return [l.shoulder,l.elbow];})]:[];
  if(!points.length)return {center:frame.cameraTarget};
  const low=[0,1,2].map(i=>Math.min(...points.map(p=>p[i]))) as Vec3,high=[0,1,2].map(i=>Math.max(...points.map(p=>p[i]))) as Vec3;
  const center=mid(low,high),radius=Math.max(...points.map(p=>V(p).distanceTo(V(center))))+.08;
  return {center,radius};
}

function OrientedBox({center,right,up,forward,size,tint,opacity=1}:{center:Vec3;right:Vec3;up:Vec3;forward:Vec3;size:Vec3;tint:string;opacity?:number}) {
  const q=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(V(right),V(up),V(forward)));
  return <mesh position={center} quaternion={q}><boxGeometry args={size}/><meshStandardMaterial color={tint} transparent={opacity<1} opacity={opacity} depthWrite={opacity===1} roughness={.8}/></mesh>;
}
/** Points describe the sole surface. Lift mesh centres above it, never sink them through the floor. */
function Shoe({foot}:{foot:DryFoot}) {
  const rearLength=V(foot.ball).distanceTo(V(foot.heel)),frontLength=V(foot.toe).distanceTo(V(foot.ball));
  return <>
    <OrientedBox center={add(mid(foot.heel,foot.ball),mul(foot.rearUp,foot.soleThickness/2))} right={foot.right} up={foot.rearUp} forward={foot.rearForward} size={[foot.width,foot.soleThickness,rearLength]} tint="#dedbcf"/>
    <OrientedBox center={add(mid(foot.ball,foot.toe),mul(foot.frontUp,foot.soleThickness/2))} right={foot.right} up={foot.frontUp} forward={foot.forward} size={[foot.width,foot.soleThickness,frontLength]} tint="#dedbcf"/>
    <OrientedBox center={add(mid(foot.heel,foot.ball),mul(foot.rearUp,foot.soleThickness+.022))} right={foot.right} up={foot.rearUp} forward={foot.rearForward} size={[foot.width*.94,.044,rearLength*.86]} tint="#284552"/>
    <OrientedBox center={add(mid(foot.ball,foot.toe),mul(foot.frontUp,foot.soleThickness+.009))} right={foot.right} up={foot.frontUp} forward={foot.forward} size={[foot.width*.94,.018,frontLength]} tint="#284552"/>
  </>;
}
function Hand({hand}:{hand:DryHand}) {
  const right=V(hand.normal).cross(V(hand.along)).normalize().toArray() as Vec3;
  return <OrientedBox center={hand.palm} right={right} up={hand.normal} forward={hand.along} size={[.075,2*hand.halfThickness,.14]} tint="#caa37c"/>;
}
function Prop({prop}:{prop:DryProp}) {
  if(prop.kind==="bar") {
    // Prop endpoints are the cap centres. Unlike bone segments, the surface
    // extends by radius at each end (chair feet therefore meet the floor).
    const direction=V(prop.b).sub(V(prop.a)),q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().normalize());
    return <mesh position={mid(prop.a,prop.b)} quaternion={q}><capsuleGeometry args={[prop.radius,direction.length(),5,10]}/><meshStandardMaterial color="#7c817a"/></mesh>;
  }
  if(prop.kind==="box")return <mesh position={prop.center}><boxGeometry args={prop.size}/><meshStandardMaterial color="#b2b7a4"/></mesh>;
  const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),V(prop.normal));
  const wall=prop.id==="wall";
  return <mesh position={prop.center} quaternion={q}><planeGeometry args={prop.size}/><meshStandardMaterial color={wall?"#a2b4b2":"#e7ede6"} side={THREE.DoubleSide} transparent={wall} opacity={wall?.22:1} depthWrite={!wall}/></mesh>;
}
function DryRider({frame,skeleton}:{frame:DrylandFrame;skeleton:boolean}) {
  const j=frame.joints;
  const forward=V(j.left.hip).sub(V(j.right.hip)).cross(V(j.chest).sub(V(j.pelvis))).normalize().toArray() as Vec3;
  return <>
    <Segment a={j.pelvis} b={j.chest} r={.13} color={color.body} transparent={skeleton}/>
    <Segment a={j.left.hip} b={j.right.hip} r={frame.pelvisRadius??.10} color="#284552" transparent={skeleton}/>
    <Segment a={j.chest} b={j.neck} r={.055} color="#caa37c"/>
    <Segment a={j.neck} b={j.head} r={.07} color="#caa37c"/>
    <Ball position={j.head} r={.105} color="#284552"/>
    <Ball position={add(j.head,mul(forward,.095))} r={.027} color="#caa37c"/>
    {sides.map(side=>{const l=j[side];return <group key={side}>
      <Segment a={l.hip} b={l.knee} r={.07} color={color[side]} transparent={skeleton}/>
      <Segment a={l.knee} b={l.ankle} r={.05} color={color[side]} transparent={skeleton}/>
      <Ball position={l.knee} r={.055} color={color[side]}/>
      <Segment a={j.chest} b={l.shoulder} r={.065} color={color.body} transparent={skeleton}/>
      <Segment a={l.shoulder} b={l.elbow} r={.045} color={color.body} transparent={skeleton}/>
      <Segment a={l.elbow} b={l.wrist} r={.032} color={color.body} transparent={skeleton}/>
      <Shoe foot={frame.feet[side]}/><Hand hand={frame.hands[side]}/>
      {skeleton&&<>{[[l.hip,l.knee],[l.knee,l.ankle],[l.shoulder,l.elbow],[l.elbow,l.wrist]].map(([a,b],i)=><Segment key={i} a={a} b={b} r={.012} color={color.bone}/>)}{[l.hip,l.knee,l.ankle,l.shoulder,l.elbow,l.wrist].map((p,i)=><Ball key={i} position={p} r={.022} color={color.bone}/>)}</>}
    </group>;})}
    {skeleton&&<Segment a={j.pelvis} b={j.chest} r={.015} color={color.bone}/>}
    {frame.pelvisForward&&[-.17,.17].map(x=>{const anchor=add(j.pelvis,[x,0,0]),direction=frame.pelvisForward!;return <Segment key={x} a={add(anchor,mul(direction,-.10))} b={add(anchor,mul(direction,.10))} r={.008} color={color.bone}/>;})}
  </>;
}
function Camera({frame,view,reset,touchRotate}:{frame:DrylandFrame;view:DryView;reset:number;touchRotate:boolean}) {
  const {camera,gl,invalidate,size}=useThree();
  const controls=useMemo(()=>new OrbitControls(camera,gl.domElement),[camera,gl]);
  const latestFrame=useRef(frame);latestFrame.current=frame;
  const touch=useRef(touchRotate);touch.current=touchRotate;
  useEffect(()=>{
    controls.enablePan=false;controls.enableDamping=false;controls.minDistance=.7;controls.maxDistance=7;
    controls.minPolarAngle=.15;controls.maxPolarAngle=Math.PI*.49;
    const change=()=>invalidate();
    const pointer=(event:PointerEvent)=>{if(event.pointerType==="touch"&&!touch.current)event.stopImmediatePropagation();};
    controls.addEventListener("change",change);gl.domElement.addEventListener("pointerdown",pointer,true);
    return()=>{controls.removeEventListener("change",change);gl.domElement.removeEventListener("pointerdown",pointer,true);controls.dispose();};
  },[controls,gl,invalidate]);
  useEffect(()=>{
    const focus=viewFocus(latestFrame.current,view),target=V(focus.center);
    const offset=view==="front"?new THREE.Vector3(0,.15,3.6):view==="side"?new THREE.Vector3(3.6,.15,0):view==="feet"?new THREE.Vector3(1.05,.35,-1.1):view==="shoulders"?new THREE.Vector3(.65,.15,.85):new THREE.Vector3(2.7,1.1,3.0);
    if(focus.radius){const vertical=THREE.MathUtils.degToRad(size.width<500?37:34)/2,horizontal=Math.atan(Math.tan(vertical)*size.width/Math.max(1,size.height));offset.setLength(Math.max(.8,focus.radius/Math.sin(Math.min(vertical,horizontal))*1.2));}
    controls.target.copy(target);camera.position.copy(target).add(offset);camera.up.set(0,1,0);camera.lookAt(target);controls.update();invalidate();
    // A task/view reset chooses a target once. Playback must not overwrite the
    // observer's chosen orbit, or chase a moving extremity in close-up.
  },[frame.task,view,reset,camera,controls,invalidate]);
  useEffect(()=>{gl.domElement.style.touchAction=touchRotate?"none":"pan-y pinch-zoom";},[gl,touchRotate]);
  useEffect(()=>{if(camera instanceof THREE.PerspectiveCamera){camera.fov=size.width<500?37:34;camera.updateProjectionMatrix();}invalidate();},[camera,size.width,invalidate]);
  useFrame(()=>controls.update());return null;
}
function Labels({frame,enabled}:{frame:DrylandFrame;enabled:boolean}) {
  const {camera,gl,size}=useThree(),labels=useRef<HTMLSpanElement[]>([]);
  useEffect(()=>{
    if(!enabled)return;
    labels.current=["左膝","右膝","骨盆","胸部"].map((name,i)=>{
      const el=document.createElement("span");el.textContent=name;
      Object.assign(el.style,{position:"absolute",left:"0",top:"0",pointerEvents:"none",fontSize:"11px",lineHeight:"20px",padding:"1px 6px",borderRadius:"4px",background:"#fffefae8",color:i<2?color[sides[i]]:"#3e6256",border:"1px solid #c6d5ca",whiteSpace:"nowrap"});
      gl.domElement.parentElement!.appendChild(el);return el;
    });return()=>{labels.current.forEach(el=>el.remove());labels.current=[];};
  },[gl,enabled]);
  useFrame(()=>{
    const points=[frame.joints.left.knee,frame.joints.right.knee,frame.joints.pelvis,frame.joints.chest];
    const placed:{x:number;y:number;width:number}[]=[];
    labels.current.forEach((el,i)=>{
      const p=V(points[i]).project(camera);
      el.style.display=Math.abs(p.x)>1||Math.abs(p.y)>1||p.z>1?"none":"block";
      if(el.style.display==="none")return;
      const other=i<2?V(points[1-i]).project(camera):null;
      const isLeft=i<2&&(Math.abs(p.x-other!.x)<.01?i===0:p.x<other!.x);
      const dx=i<2?(isLeft?-58:12):i===2?18:-62;
      const x=Math.max(0,Math.min(size.width-56,(p.x+1)*size.width/2+dx));
      const baseY=Math.max(0,Math.min(size.height-24,(-p.y+1)*size.height/2-10));
      const width=el.offsetWidth||56;
      const y=[0,24,-24,48,-48].map(offset=>Math.max(0,Math.min(size.height-24,baseY+offset)))
        .find(candidate=>placed.every(r=>x+width+3<r.x||r.x+r.width+3<x||candidate+23<r.y||r.y+23<candidate))??baseY;
      placed.push({x,y,width});el.style.transform=`translate(${x}px,${y}px)`;
    });
  });return null;
}
export function DrylandScene({frame,view,skeleton,touchRotate,reset,fallback}:{frame:DrylandFrame;view:DryView;skeleton:boolean;touchRotate:boolean;reset:number;fallback:ReactNode}) {
  return <SceneBoundary fallback={fallback}><Canvas frameloop="demand" dpr={[1,1.7]} camera={{position:[3,2,3],fov:34,near:.03,far:20}} gl={{antialias:true,alpha:false}} fallback={fallback} onCreated={({gl})=>gl.setClearColor("#edf2ed")}>
    <ambientLight intensity={1.6}/><hemisphereLight args={["#fbf8ea","#6e8779",1.8]}/><directionalLight position={[-3,7,4]} intensity={2.3}/>
    {frame.props.map(prop=><Prop key={prop.id} prop={prop}/>)}
    <gridHelper args={[3,30,"#c6d2c8","#d8e1d9"]} position={[0,.001,0]}/>
    <DryRider frame={frame} skeleton={skeleton}/><Camera frame={frame} view={view} reset={reset} touchRotate={touchRotate}/><Labels frame={frame} enabled={skeleton}/>
  </Canvas></SceneBoundary>;
}

/** A second projection of the same ordinary-shoe model, including actual props. */
export function DrylandPlanar({frame,view}:{frame:DrylandFrame;view:DryView}) {
  const side=view==="side"||view==="feet",focus=viewFocus(frame,view),scale=frame.cameraTarget?(focus.radius?Math.min(280,105/Math.max(.12,focus.radius)):115):view==="feet"?280:view==="shoulders"?400:120;
  const originY=view==="feet"?210:view==="shoulders"?690:270;
  const point=(p:Vec3)=>frame.cameraTarget?[180+scale*(side?-(p[2]-focus.center[2]):p[0]-focus.center[0]),170-scale*(p[1]-focus.center[1])]:[180+scale*(side?-p[2]:p[0]),originY-scale*p[1]];
  const path=(a:Vec3,b:Vec3)=>[point(a),point(b)].map(p=>p.join(",")).join(" ");
  const silhouette=(points:Vec3[])=>{
    const p=points.map(point).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
    const cross=(a:number[],b:number[],c:number[])=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
    const half=(input:number[][])=>{const result:number[][]=[];for(const q of input){while(result.length>1&&cross(result[result.length-2],result[result.length-1],q)<=0)result.pop();result.push(q);}return result.slice(0,-1);};
    return [...half(p),...half([...p].reverse())].map(p=>p.join(",")).join(" ");
  };
  const propShape=(prop:DryProp)=>{
    if(prop.kind==="bar")return <polyline key={prop.id} points={path(prop.a,prop.b)} stroke="#8e9789" strokeWidth={2*prop.radius*scale} strokeLinecap="round"/>;
    if(prop.kind==="box"){
      const corners:Vec3[]=[];for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1])corners.push(add(prop.center,[x*prop.size[0]/2,y*prop.size[1]/2,z*prop.size[2]/2]));
      return <polygon key={prop.id} points={silhouette(corners)} fill="#d2d8c8" stroke="#8e9789"/>;
    }
    const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),V(prop.normal));
    const corners=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>V(prop.center).add(new THREE.Vector3(x*prop.size[0]/2,y*prop.size[1]/2,0).applyQuaternion(q)).toArray() as Vec3);
    return <polygon key={prop.id} points={silhouette(corners)} fill={prop.id==="wall"?"#dce5de":"none"} fillOpacity=".45" stroke="#b7c7bc" strokeWidth="2"/>;
  };
  const j=frame.joints;
  const direction=side?"侧面":["forearm-plank","supine-hamstring"].includes(frame.task)?"头尾方向":"正面";
  return <svg viewBox="0 0 360 300" role="img" aria-label={`普通鞋${direction}的同步骨架与支撑`}>
    <text x="12" y="20">普通鞋 · {direction} · 同一动作状态</text>
    {frame.props.map(propShape)}
    <polyline points={path(j.left.hip,j.right.hip)} stroke={color.body} strokeWidth="7"/>
    <polyline points={path(j.pelvis,j.chest)} stroke={color.body} strokeWidth="9"/>
    <polyline points={path(j.chest,j.head)} stroke={color.body} strokeWidth="6"/>
    {sides.map(which=>{const l=j[which],f=frame.feet[which],h=frame.hands[which];return <g key={which}>
      {[[j.chest,l.shoulder],[l.hip,l.knee],[l.knee,l.ankle],[l.shoulder,l.elbow],[l.elbow,l.wrist]].map(([a,b],i)=><polyline key={i} points={path(a,b)} stroke={color[which]} strokeWidth="6" strokeLinecap="round"/>)}
      <polyline points={[f.heel,f.ball,f.toe].map(p=>point(p).join(",")).join(" ")} stroke="#284552" fill="none" strokeWidth="5"/>
      <polyline points={path(l.wrist,h.palm)} stroke="#caa37c" strokeWidth="7"/>
      {[l.knee,l.ankle].map((p,i)=><circle key={i} cx={point(p)[0]} cy={point(p)[1]} r="4" fill="#fff" stroke={color[which]}/>)}
    </g>;})}
    <circle cx={point(j.head)[0]} cy={point(j.head)[1]} r="12" fill={color.body}/>
    {frame.pelvisForward&&[-.17,.17].map(x=>{const anchor=add(j.pelvis,[x,0,0]),direction=frame.pelvisForward!;return <polyline key={x} points={path(add(anchor,mul(direction,-.10)),add(anchor,mul(direction,.10)))} stroke="#b38838" strokeWidth="3"/>;})}
    {frame.contacts.filter(c=>c.id.endsWith(".palm")||c.surface==="mat"||c.id.endsWith(".thigh-hold")).map(c=><circle key={c.id} cx={point(c.point)[0]} cy={point(c.point)[1]} r="3" fill="#3b8e76"/>)}
    <text x="12" y="292">蓝：左侧　橙：右侧　地面与支撑位置固定</text>
  </svg>;
}
