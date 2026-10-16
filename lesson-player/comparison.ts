import type { LessonConfig } from "./motion";
import {supportsJsbaCarvingLesson,jsbaCarvingComparison} from "./jsba-carving";

type Option={value:string;label:string};
type Capabilities={variants?:readonly Option[];carve?:boolean;shortCompare?:boolean};

/** The caller supplies the actual module's supported options; never invent a
 * variant or silently alter the current transition to make a comparison work. */
export function comparisonFor(config:LessonConfig,{variants,carve,shortCompare}:Capabilities):{config:LessonConfig;label:string}|null {
  if(supportsJsbaCarvingLesson(config))return jsbaCarvingComparison(config);
  if(variants){
    const current=config.variant??variants[0]?.value;
    const other=variants.find(option=>option.value!==current);
    return other?{config:{...config,variant:other.value},label:other.label}:null;
  }
  if(carve){
    const normal=(config.posture??'low')==='low';
    return {config:{...config,posture:normal?'normal':'low'},label:normal?'正常高度参考 · 同路线同板角':config.posture==='reach'?'稍低姿态参考 · 同路线同腿长':'稍低姿态参考 · 同路线同板角'};
  }
  if(shortCompare){
    const error=config.task==='tail-brake-study';
    return {config:{...config,task:error?'round-linked-skid':'tail-brake-study',variant:error?'round':'tail-brake'},label:error?'连续圆弯参考':'反例：末段急甩尾'};
  }
  return null;
}
