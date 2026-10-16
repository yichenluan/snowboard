import {buildPose, type MotionState, type PoseOptions, type Route} from "../prototype/motion";

/** Geometric hip–ankle distance; neither bone length nor snow pressure. */
export const actualMeanLegLength = (s:MotionState):number => (["front","rear"] as const)
  .reduce((sum,k)=>sum+Math.hypot(...s.joints[`${k}Hip`].map((v,i)=>v-s.joints[`${k}Ankle`][i])),0)/2;

/** Share the boot/bone solver, never a pre-authored pose from another task. */
export function poseAtLegLength(route:Route,target:number,options:(bend:number)=>PoseOptions):MotionState {
  const at=(bend:number)=>buildPose(route,"correct",options(bend));
  let lo=20,hi=105;
  if(!Number.isFinite(target)||actualMeanLegLength(at(lo))<target||actualMeanLegLength(at(hi))>target)
    throw new Error("刻滑腿部目标超出当前装备与骨长可达范围");
  for(let i=0;i<25;i++){const mid=(lo+hi)/2;if(actualMeanLegLength(at(mid))>target)lo=mid;else hi=mid;}
  return at((lo+hi)/2);
}
