import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {comparisonFor} from '../lesson-player/comparison.ts';
import {sampleLesson,type LessonConfig} from '../lesson-player/motion.ts';
import {supportsShortTurnComparison} from '../lesson-player/short-turns.ts';
import {supportsCarvingLesson} from '../lesson-player/carving.ts';
import {supportsExpertShortLesson,expertShortVariants} from '../lesson-player/expert-short-turns.ts';
import {supportsExpertShortSequenceLesson,expertShortSequenceVariants} from '../lesson-player/expert-short-sequence.ts';
import {supportsExpertCarvingLesson,expertCarvingVariants} from '../lesson-player/expert-carving.ts';

const data=JSON.parse(readFileSync(new URL('../content.json',import.meta.url),'utf8'));
const configs:LessonConfig[]=data.lessons.flatMap((l:any)=>l.demos?.length?l.demos:l.demo?[l.demo]:[]);
const variantsFor=(config:LessonConfig)=>supportsExpertShortLesson(config)?expertShortVariants(config):supportsExpertShortSequenceLesson(config)?expertShortSequenceVariants(config):supportsExpertCarvingLesson(config)?expertCarvingVariants(config):undefined;

test('当前真实课程的同步参考必须不同且可采样，保留换刃策略和原配置',()=>{
  let checked=0;
  for(const config of configs){
    const before=JSON.stringify(config),variants=variantsFor(config);
    const comparison=comparisonFor(config,{variants,carve:supportsCarvingLesson(config),shortCompare:supportsShortTurnComparison(config)});
    if(!comparison)continue;
    checked++;
    assert.notDeepEqual(comparison.config,config);
    assert.equal(comparison.config.transition,config.transition,'不能更换换刃方式以兼容反例');
    if(variants)assert.ok(variants.some(option=>option.value===comparison.config.variant));
    for(const stance of ['regular','goofy'] as const)for(const time of [0,.125,.5,.999999])assert.doesNotThrow(()=>sampleLesson(time,comparison.config,stance));
    assert.equal(JSON.stringify(config),before,'选择参考不改写当前动作');
  }
  assert.ok(checked>10,'覆盖实际开放对照的课程配置');
});

test('只有一个选项时不返回相同参考，缺省变体也以首个合法选项为当前值',()=>{
  const config:LessonConfig={type:'expert-carving',task:'expert-carve-arc',variant:'linked'};
  assert.equal(comparisonFor(config,{variants:[{value:'linked',label:'连续完整弧线'}]}),null);
  assert.equal(comparisonFor({...config,variant:undefined},{variants:[{value:'linked',label:'连续完整弧线'}]}),null);
  const other=comparisonFor({...config,variant:undefined},{variants:[{value:'linked',label:'首个参考'},{value:'alternative',label:'另一个合法选项'}]});
  assert.equal(other?.config.variant,'alternative');
});

test('屈曲和回收配置不开放不兼容急甩尾参考，合法伸展对照双向可切换',()=>{
  for(const transition of ['flex','retract'] as const){
    const config:LessonConfig={type:'short-turns',task:'round-linked-skid',variant:'round',transition};
    assert.equal(comparisonFor(config,{shortCompare:supportsShortTurnComparison(config)}),null);
  }
  const config:LessonConfig={type:'short-turns',task:'round-linked-skid',variant:'round',transition:'extend'};
  const other=comparisonFor(config,{shortCompare:supportsShortTurnComparison(config)})!;
  assert.equal(other.config.task,'tail-brake-study');
  const reference=comparisonFor(other.config,{shortCompare:supportsShortTurnComparison(other.config)})!;
  assert.equal(reference.config.task,'round-linked-skid');
});
