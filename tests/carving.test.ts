import assert from 'node:assert/strict';
import {test} from 'node:test';
import {sampleLesson,canRenderLesson} from '../lesson-player/motion.ts';
import {BODY,boardToWorld,type Vec3} from '../prototype/motion.ts';
import {advancePlayback,phaseRange} from '../lesson-player/playback.ts';
const base={type:'duck-carve',task:'linked-duck-carve'};
const distance=(a:Vec3,b:Vec3)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const subtract=(a:Vec3,b:Vec3)=>a.map((v,i)=>v-b[i]) as Vec3;
test('duck posture comparisons preserve board path, equipment, anatomical lengths and both stance identities',()=>{
  assert(canRenderLesson(base));assert(!canRenderLesson({...base,task:'typo'}));assert(!canRenderLesson({...base,posture:'typo'} as any));
  for(const stance of ['regular','goofy'] as const)for(let i=0;i<=400;i++){
    const normal=sampleLesson(i/400,{...base,posture:'normal'},stance).state;
    for(const posture of ['low','reach'] as const){
      const s=sampleLesson(i/400,{...base,posture},stance).state;
      assert.deepEqual(s.board,normal.board,'height comparison must not silently change board motion');
      for(const leg of ['front','rear'] as const){
        assert(distance(s.joints[`${leg}Ankle`],boardToWorld([BODY.stanceWidth/2*(leg==='front'?1:-1),BODY.ankleHeight,0],s.board))<1e-9);
        assert(Math.abs(distance(s.joints[`${leg}Hip`],s.joints[`${leg}Knee`])-BODY.thigh)<1e-9);
        assert(Math.abs(distance(s.joints[`${leg}Ankle`],s.joints[`${leg}Knee`])-BODY.shin)<1e-9);
        assert(s.metrics[`${leg}Knee`]>20&&s.metrics[`${leg}Knee`]<85,'authored task remains moderate; not a universal ROM limit');
      }
      assert(Math.abs(distance(s.joints.pelvis,s.joints.chest)-BODY.trunk)<1e-9);
      assert(s.joints.pelvis[1]<=normal.joints.pelvis[1]+1e-9);
    }
  }
});
test('both carving phases align with actual edge events and the full cycle joins after downhill translation',()=>{
  for(const posture of ['normal','low','reach'] as const){
    const first=sampleLesson(0,{...base,posture}),last=sampleLesson(1,{...base,posture});
    const shift=subtract(last.state.board.position,first.state.board.position);
    for(const key of Object.keys(first.state.joints) as (keyof typeof first.state.joints)[])assert(distance(first.state.joints[key],subtract(last.state.joints[key],shift))<1e-8);
    assert(distance(first.state.travel,last.state.travel)<1e-9);
    for(const stage of first.stages){const s=sampleLesson(stage.at,{...base,posture}).state;
      if(stage.title==='渐建前刃')assert.equal(s.edge,'toe');
      if(stage.title==='渐建后刃')assert.equal(s.edge,'heel');
      if(stage.title.includes('近平板'))assert.equal(s.edge,'flat');
    }
    // Track the board center's derivative independently of the rendered arrow.
    for(const t of [.1,.25,.4,.6,.75,.9]){const a=sampleLesson(t-.0001,{...base,posture}).state.board.position,b=sampleLesson(t+.0001,{...base,posture}).state.board.position,s=sampleLesson(t,{...base,posture}).state;
      const v=subtract(b,a);v[1]=0;const len=Math.hypot(...v);assert(distance(v.map(x=>x/len) as Vec3,s.travel)<.00001);assert(s.metrics.skidAngle<.0001);
    }
  }
});
test('teaching replay keeps a selected range stable, wraps overshoot and stops without looping',()=>{
  const range=phaseRange([{at:0,title:'准备'},{at:.2,title:'建刃'},{at:.45,title:'完成'}],1);
  assert.deepEqual(range,{start:.2,end:.45,label:'建刃'});
  const wrapped=advancePlayback(.44,.03,range);assert(Math.abs(wrapped.time-.22)<1e-9);assert(!wrapped.ended);
  assert.equal(advancePlayback(.99,.02).time,1);assert(advancePlayback(.99,.02).ended);
  assert(advancePlayback(.99,.02,range).time>=.2&&advancePlayback(.99,.02,range).time<.45);
});

test('carving joint motion relative to the board has no velocity step at either edge exchange',()=>{
  for(const posture of ['normal','low','reach'] as const)for(const t of [0,.5])for(const key of ['pelvis','frontKnee','rearKnee','chest'] as const){
    const relative=(u:number)=>{const s=sampleLesson((u+1)%1,{...base,posture}).state;return subtract(s.joints[key],s.board.position);};
    const mismatch=(h:number)=>{const a=relative(t-h),b=relative(t),c=relative(t+h);return Math.hypot(...b.map((v,i)=>(c[i]-v)/h-(v-a[i])/h));};
    // The rigid board's low-edge support height has an intentional corner at
    // flat. Remove board translation to inspect the authored body envelope.
    const coarse=mismatch(.0001),fine=mismatch(.00001);assert(fine<coarse*.2+1e-7);assert(fine<.003);
  }
});
