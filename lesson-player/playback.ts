export type PlaybackRange = { start: number; end: number; label: string };
export function advancePlayback(time: number, delta: number, range?: PlaybackRange | null) {
  if (range) {
    const width = range.end - range.start;
    if (width > 0) return {time:range.start + ((Math.max(range.start,time)-range.start+Math.max(0,delta)) % width), ended:false};
  }
  return {time:Math.min(1,time+Math.max(0,delta)),ended:time+delta>=1};
}
export function phaseRange(stages: {at:number;title:string}[], index: number): PlaybackRange {
  // A terminal marker at 1 describes a pose, not a replayable interval.
  // Use the preceding nonzero phase and its label instead of looping [1, 1].
  for (let phase=Math.min(index,stages.length-1);phase>=0;phase--) {
    const start=stages[phase].at,end=stages[phase+1]?.at??1;
    if (end>start) return {start,end,label:stages[phase].title};
  }
  return {start:0,end:1,label:'完整动作'};
}
