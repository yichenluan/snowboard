import assert from 'node:assert/strict';
import {test} from 'node:test';
import {advancePlayback,phaseRange} from '../lesson-player/playback.ts';

test('an authored terminal replay includes the complete final arc instead of a near-flat sliver',()=>{
  const stages=[{at:0,title:'进入'},{at:.997,title:'近平板'},{at:1,title:'结束',replay:{from:5/6,label:'末弧完整衔接'}}];
  assert.deepEqual(phaseRange(stages,2),{start:5/6,end:1,label:'末弧完整衔接'});
  assert.deepEqual(phaseRange(stages,1),{start:.997,end:1,label:'近平板'});
  const next=advancePlayback(1,.01,phaseRange(stages,2));
  assert.ok(next.time>5/6&&next.time<.86);
});

test('terminal pose replays the preceding nonzero phase with its actual label',()=>{
  const stages=[
    {at:0,title:'准备'},
    {at:.8,title:'接入下一弧'},
    {at:1,title:'末态'},
    {at:1,title:'末态说明'},
  ];
  for(const index of [2,3]){
    const range=phaseRange(stages,index);
    assert.deepEqual(range,{start:.8,end:1,label:'接入下一弧'});
    const next=advancePlayback(1,.02,range);
    assert(Math.abs(next.time-.82)<1e-9);
    assert.equal(next.ended,false);
    const wrapped=advancePlayback(.99,.03,range);
    assert(Math.abs(wrapped.time-.82)<1e-9);
    assert.equal(wrapped.ended,false);
  }
});

test('a single phase retains its interval; a lone terminal marker replays the full action',()=>{
  assert.deepEqual(phaseRange([{at:0,title:'完整转向'}],0),{start:0,end:1,label:'完整转向'});
  assert.deepEqual(phaseRange([{at:.4,title:'弧内调节'}],0),{start:.4,end:1,label:'弧内调节'});
  const range=phaseRange([{at:1,title:'末态'}],0);
  assert.deepEqual(range,{start:0,end:1,label:'完整动作'});
  const next=advancePlayback(1,.1,range);
  assert(Math.abs(next.time-.1)<1e-9);
  assert.equal(next.ended,false);
});

test('ordinary selected phases keep their own boundaries and label',()=>{
  const stages=[{at:0,title:'准备'},{at:.2,title:'建刃'},{at:.45,title:'完成'}];
  assert.deepEqual(phaseRange(stages,0),{start:0,end:.2,label:'准备'});
  assert.deepEqual(phaseRange(stages,1),{start:.2,end:.45,label:'建刃'});
  assert.deepEqual(phaseRange(stages,2),{start:.45,end:1,label:'完成'});
  assert.deepEqual(advancePlayback(.99,.02),{time:1,ended:true});
});
