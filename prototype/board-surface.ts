import type {Vec3} from "./motion";

/** Optional, authored cross-section rolls at the original front/rear bindings.
 * This is a surface geometry, not a stiffness, pressure or snow-contact solver. */
export interface SegmentRolls {front:number;rear:number}
export interface SurfaceBoard {
  position:Vec3;yaw:number;roll:number;length:number;width:number;thickness:number;
  segmentRolls?:SegmentRolls;
}
// Each complete binding footprint lies outside this central interpolation zone.
// Flat roll plateaus there preserve rigid boots and their fixed mounting frame.
export const TORSION_BLEND_HALF_LENGTH=.15;
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const smooth=(x:number)=>{const u=clamp(x);return u*u*u*(10+u*(-15+6*u));};
export function surfaceRollAt(x:number,b:Pick<SurfaceBoard,"roll"|"segmentRolls">):number {
  if(!b.segmentRolls)return b.roll;
  if(x>=TORSION_BLEND_HALF_LENGTH)return b.segmentRolls.front;
  if(x<=-TORSION_BLEND_HALF_LENGTH)return b.segmentRolls.rear;
  const q=smooth((x+TORSION_BLEND_HALF_LENGTH)/(2*TORSION_BLEND_HALF_LENGTH));
  return b.segmentRolls.rear+(b.segmentRolls.front-b.segmentRolls.rear)*q;
}
export function surfaceVectorToWorld(v:Vec3,b:Pick<SurfaceBoard,"yaw"|"roll"|"segmentRolls">,x=0):Vec3 {
  const r=surfaceRollAt(x,b),c=Math.cos(r),s=Math.sin(r),cy=Math.cos(b.yaw),sy=Math.sin(b.yaw);
  const y=v[1]*c-v[2]*s,z=v[1]*s+v[2]*c;
  return [v[0]*cy+z*sy,y,-v[0]*sy+z*cy];
}
export function surfacePointToWorld(p:Vec3,b:SurfaceBoard):Vec3 {
  const v=surfaceVectorToWorld(p,b,p[0]);return [v[0]+b.position[0],v[1]+b.position[1],v[2]+b.position[2]];
}
/** Lift one continuous surface above snow without independently moving slices.
 * Only its lowest geometric points touch; other edge sections can be higher. */
export function surfaceSnowHeight(b:Pick<SurfaceBoard,"width"|"thickness"|"roll"|"segmentRolls">):number {
  const ends=b.segmentRolls?[b.segmentRolls.front,b.segmentRolls.rear]:[b.roll,b.roll];
  const low=Math.min(...ends),high=Math.max(...ends),critical=Math.atan2(b.width,b.thickness),angles=[...ends];
  for(let k=Math.floor(low/Math.PI)-1;k<=Math.ceil(high/Math.PI)+1;k++)for(const sign of [-1,1]){
    const r=k*Math.PI+sign*critical;if(r>=low&&r<=high)angles.push(r);
  }
  return Math.max(...angles.map(r=>b.thickness/2*Math.abs(Math.cos(r))+b.width/2*Math.abs(Math.sin(r))));
}
/** Full width between the tip arcs; tips narrow to a rounded end. */
export function surfaceHalfWidthAt(x:number,b:Pick<SurfaceBoard,"length"|"width">):number {
  const tipLength=.15,a=Math.abs(x),straight=b.length/2-tipLength;
  return b.width/2*(a<=straight?1:Math.sqrt(Math.max(0,1-((a-straight)/tipLength)**2)));
}
/** Closed sampled skin in board-yaw coordinates, with real top/bottom faces. */
export function surfaceMeshData(b:SurfaceBoard,sections=80):{positions:number[];indices:number[]} {
  const count=Math.max(8,Math.floor(sections)),positions:number[]=[],indices:number[]=[];
  for(let i=0;i<=count;i++){
    const x=-b.length/2+b.length*i/count,w=surfaceHalfWidthAt(x,b),roll=surfaceRollAt(x,b),c=Math.cos(roll),s=Math.sin(roll);
    for(const [y,z] of [[b.thickness/2,-w],[b.thickness/2,w],[-b.thickness/2,-w],[-b.thickness/2,w]])positions.push(x,y*c-z*s,y*s+z*c);
    if(i===count)continue;
    const n=i*4,m=n+4;
    for(const [a,z,c,d] of [[n,n+1,m+1,m],[n+2,m+2,m+3,n+3],[n,m,m+2,n+2],[n+1,n+3,m+3,m+1]])indices.push(a,z,c,a,c,d);
  }
  return {positions,indices};
}
