export type PlaybackRange = { start: number; end: number; label: string };
export function advancePlayback(time: number, delta: number, range?: PlaybackRange | null) {
  if (range) {
    const width = range.end - range.start;
    if (width > 0) return {time:range.start + ((Math.max(range.start,time)-range.start+Math.max(0,delta)) % width), ended:false};
  }
  return {time:Math.min(1,time+Math.max(0,delta)),ended:time+delta>=1};
}
export function phaseRange(stages: {at:number;title:string}[], index: number): PlaybackRange {
  return {start:stages[index].at,end:stages[index+1]?.at??1,label:stages[index].title};
}
