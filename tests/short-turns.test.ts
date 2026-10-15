import assert from "node:assert/strict";
import {test} from "node:test";
import {BODY,boardToWorld,type MotionState,type Vec3} from "../prototype/motion.ts";
import {sampleShortTurnLesson as sample,shortTurnTiming as timing,shortTurnDurationMs as duration,supportsShortTurnLesson,type ShortLessonConfig} from "../lesson-player/short-turns.ts";

const distance=(a:Vec3,b:Vec3)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const leg=(s:MotionState)=>(distance(s.joints.frontHip,s.joints.frontAnkle)+distance(s.joints.rearHip,s.joints.rearAnkle))/2;
const state=(t:number,c:ShortLessonConfig,stance:"regular"|"goofy"="regular")=>sample(t,c,stance).state;
const range=(values:number[])=>Math.max(...values)-Math.min(...values);
const ladder=["side-slip","side-slip-shorter","linked"].map(variant=>({type:"short-turn-progression",variant}));
const round:ShortLessonConfig={type:"short-turns",variant:"round"};
const configurations:ShortLessonConfig[]=[round,{...round,task:"easy-linked-check"},{...round,transition:"flex"},{...round,transition:"retract"},...ladder];
const additional:ShortLessonConfig[]=[
  ...["tail-brake","asymmetric","shoulder-led","edge-locked","low-stuck","over-inclined"].map(variant=>({type:"short-turns",variant})),
  ...["medium-to-short","short-steady","short-to-medium"].map(variant=>({type:"short-turn-progression",variant})),
  ...["centered","nose-pivot","back-seat"].map(variant=>({type:"short-turn-balance",variant})),
];

test("short-turn guard does not absorb unimplemented variants or task/transition combinations",()=>{
  for(const c of [...configurations,...additional])assert.ok(supportsShortTurnLesson(c));
  for(const c of additional){
    assert.equal(supportsShortTurnLesson({...c,task:"round-linked-skid"}),false);
    assert.equal(supportsShortTurnLesson({...c,transition:"retract"}),false);
  }
  assert.equal(supportsShortTurnLesson({...round,variant:"unknown"}),false);
  assert.equal(supportsShortTurnLesson({type:"short-turn-balance",variant:"round"}),false);
  assert.equal(supportsShortTurnLesson({...round,task:"easy-linked-check",transition:"retract"}),false);
  assert.equal(supportsShortTurnLesson({...ladder[0],transition:"flex"}),false);
  assert.equal(supportsShortTurnLesson({...round,task:"unknown"}),false);
});

test("easy turns expand both dimensions; extension/flexion compare identical board motion",()=>{
  const normal=Array.from({length:401},(_,i)=>state(i/400,round));
  const easy=Array.from({length:401},(_,i)=>state(i/400,{...round,task:"easy-linked-check"}));
  assert.ok(range(easy.map(s=>s.board.position[0]))>range(normal.map(s=>s.board.position[0]))*1.5);
  assert.ok(range(easy.map(s=>s.board.position[2]))>range(normal.map(s=>s.board.position[2]))*1.5);
  for(let i=0;i<=200;i++){
    const a=state(i/200,round),b=state(i/200,{...round,transition:"flex"});
    assert.deepEqual(a.board,b.board);assert.deepEqual(a.travel,b.travel);
  }
});

test("actual leg distances distinguish extension, flexion and retraction at every transition",()=>{
  for(const fromEdge of ["toe","heel"] as const)for(const stance of ["regular","goofy"] as const){
    for(const transition of ["extend","flex","retract"] as const){
      const c={...round,transition,fromEdge};
      for(let half=0;half<4;half++){
        const a=leg(state(half/4,c,stance)),mid=leg(state((half+.5)/4,c,stance)),b=leg(state((half+1)/4,c,stance));
        assert.ok(transition==="extend"?mid>Math.max(a,b)+.025:mid<Math.min(a,b)-.025);
        let previous=a;
        for(let i=1;i<=50;i++){
          const current=leg(state((half+i/100)/4,c,stance));
          assert.ok(transition==="extend"?current>=previous-1e-9:current<=previous+1e-9);
          previous=current;
        }
      }
    }
  }
});

test("upper body follows naturally; retraction board motion exceeds body motion",()=>{
  for(const c of configurations.slice(0,4)){
    const values=Array.from({length:401},(_,i)=>state(i/400,c));
    const shoulders=values.map(s=>Math.atan2(-(s.joints.frontShoulder[2]-s.joints.rearShoulder[2]),s.joints.frontShoulder[0]-s.joints.rearShoulder[0]));
    assert.ok(range(shoulders)>.15,"world shoulder heading must not be frozen");
    assert.ok(range(shoulders)<range(values.map(s=>s.board.yaw)),"upper-body turn is smaller than board turn");
    if(c.transition==="retract"){
      assert.ok(range(values.map(s=>s.board.position[0]))>range(values.map(s=>s.com[0]))*4);
      assert.ok(range(values.map(s=>s.com[1]))>.02,"do not freeze body height to fake retraction");
    }
  }
});

test("side-slip ladder changes only waiting, preserving real turn duration, geometry and body",()=>{
  assert.deepEqual(ladder.map(duration),[14000,10400,8000]);
  for(const fromEdge of ["toe","heel"] as const)for(const stance of ["regular","goofy"] as const){
    for(let half=0;half<2;half++)for(let i=0;i<=200;i++){
      const samples=ladder.map(c0=>{
        const c={...c0,fromEdge},clock=timing(c)!;
        assert.equal(clock.turnMs,4000);
        return state((half*clock.halfMs+clock.waitMs+i/200*clock.turnMs)/clock.totalMs,c,stance);
      });
      for(const b of samples.slice(1)){
        const a=samples[0];
        assert.ok(Math.abs(a.board.yaw-b.board.yaw)<1e-10);
        assert.ok(Math.abs(a.board.roll-b.board.roll)<1e-10);
        assert.ok(distance(a.travel,b.travel)<1e-10);
        for(const key of Object.keys(a.joints) as Array<keyof MotionState["joints"]>){
          const relative=(s:MotionState)=>s.joints[key].map((v,k)=>v-s.board.position[k]) as Vec3;
          assert.ok(distance(relative(a),relative(b))<1e-9);
        }
      }
    }
    for(const c0 of ladder){
      const c={...c0,fromEdge},clock=timing(c)!;
      if(clock.waitMs){
        const a=state(.2*clock.waitMs/clock.totalMs,c,stance),b=state(.8*clock.waitMs/clock.totalMs,c,stance);
        const speed=(b.board.position[2]-a.board.position[2])/(.6*clock.waitMs/1000);
        assert.ok(Math.abs(speed-.9)<1e-10);
      }
      const edges=Array.from({length:1201},(_,i)=>state(i/1200,c,stance).edge).filter((edge,i,a)=>i===0||edge!==a[i-1]);
      assert.deepEqual(edges,[fromEdge,"flat",fromEdge==="toe"?"heel":"toe","flat",fromEdge]);
      for(let i=0;i<=600;i++){
        const s=state(i/600,c,stance),offset=s.contact.map((v,k)=>v-s.board.position[k]);
        assert.ok(offset[0]*s.travel[0]+offset[2]*s.travel[2]<=1e-10,"working edge must remain uphill of sideways motion");
      }
    }
  }
});

test("all priority tasks retain bones, boots, mirror and actual route directions",()=>{
  for(const c0 of configurations)for(const fromEdge of ["toe","heel"] as const)for(let i=0;i<=240;i++){
    const c={...c0,fromEdge},t=i/240,r=state(t,c),g=state(t,c,"goofy");
    assert.ok(Math.abs(r.contact[1])<1e-10);
    for(const key of Object.keys(r.joints) as Array<keyof MotionState["joints"]>)assert.ok(distance([-r.joints[key][0],r.joints[key][1],r.joints[key][2]],g.joints[key])<1e-9);
    for(const s of [r,g])for(const side of ["front","rear"] as const){
      const j=(suffix:string)=>s.joints[(side+suffix) as keyof MotionState["joints"]];
      assert.ok(Math.abs(distance(j("Hip"),j("Knee"))-BODY.thigh)<1e-9);
      assert.ok(Math.abs(distance(j("Knee"),j("Ankle"))-BODY.shin)<1e-9);
      assert.ok(Math.abs(distance(j("Shoulder"),j("Elbow"))-BODY.upperArm)<1e-9);
      assert.ok(Math.abs(distance(j("Elbow"),j("Hand"))-BODY.forearm)<1e-9);
      assert.ok(distance(s.boots[side].position,boardToWorld(s.boots[side].localPosition,s.board))<1e-9);
      assert.ok(s.boots[side].cuffPitch>=12-1e-9&&s.boots[side].cuffPitch<=18+1e-9);
    }
    if(i>0&&i<240){
      const h=1e-6,a=state(t-h,c).board.position,b=state(t+h,c).board.position,dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz);
      assert.ok(Math.hypot(dx/length-r.travel[0],dz/length-r.travel[2])<1e-6);
    }
  }
});

test("waiting seams and full cycles preserve position and velocity without stopping the exit",()=>{
  for(const c of configurations){
    const start=state(0,c),end=state(1,c),dz=end.board.position[2]-start.board.position[2];
    assert.ok(Math.hypot(...end.travel)>.99);assert.ok(sample(1,c).moving);
    for(const key of Object.keys(start.joints) as Array<keyof MotionState["joints"]>)assert.ok(distance(start.joints[key],end.joints[key].map((v,i)=>v-(i===2?dz:0)) as Vec3)<1e-8);
    const clock=timing(c);
    const boundaries=clock?[clock.waitMs/clock.totalMs,.5,(clock.halfMs+clock.waitMs)/clock.totalMs]:[.125,.25,.375,.5,.625,.75,.875];
    for(const t of boundaries.filter(t=>t>0&&t<1)){
      const h=1e-5,a=state(t-h,c),b=state(t,c),d=state(t+h,c);
      for(const key of ["pelvis","chest","frontKnee","rearKnee"] as const){
        const jump=Math.hypot(...a.joints[key].map((v,k)=>(d.joints[key][k]-2*b.joints[key][k]+v)/(h*duration(c)/1000)));
        assert.ok(jump<.01,`${c.variant}/${c.transition} ${key} velocity step at ${t}`);
      }
    }
  }
});

test("size ladder changes width, downhill length and turn duration together",()=>{
  const sizes=(variant:string)=>{
    const c={type:"short-turn-progression",variant};
    const times=sample(0,c).stages.filter(s=>s.title.endsWith("控制段")).map(s=>s.at).concat(1);
    const points=times.map(t=>state(t,c).board.position);
    assert.equal(times.length,7,"three complete two-sided cycles");
    return times.slice(1).map((t,i)=>({width:Math.abs(points[i+1][0]-points[i][0]),length:points[i+1][2]-points[i][2],time:t-times[i]}));
  };
  const shrinking=sizes("medium-to-short"),growing=sizes("short-to-medium"),steady=sizes("short-steady");
  for(const key of ["width","length","time"] as const){
    assert.ok(shrinking[0][key]>shrinking[5][key]*1.7,key);
    assert.ok(growing[5][key]>growing[0][key]*1.7,key);
    assert.ok(range(steady.map(s=>s[key]))<1e-8,key);
    for(let i=1;i<6;i++){
      assert.ok(shrinking[i][key]<=shrinking[i-1][key]+1e-8);
      assert.ok(growing[i][key]>=growing[i-1][key]-1e-8);
    }
  }
});

test("examples express concentrated steering and unequal sides",()=>{
  const c=(variant:string)=>({...round,variant});
  // The first 42% of each half is a straight route, followed by a late sweep.
  const tail=c("tail-brake"),a=state(0,tail),b=state(.1,tail),d=state(.22,tail);
  assert.ok(Math.abs(a.board.position[0]-b.board.position[0])<1e-9);
  assert.ok(Math.abs(d.board.position[0]-b.board.position[0])>1);
  const lateYaw=Array.from({length:61},(_,i)=>state(.105+i/60*.145,tail).board.yaw);
  assert.ok(range(lateYaw)>1,"late steering is concentrated, rather than inferred from two arbitrary endpoints");
  for(const fromEdge of ["toe","heel"] as const)for(const stance of ["regular","goofy"] as const){
    const asymmetric={...c("asymmetric"),fromEdge},flat:number[]=[];
    // Recover actual roll-zero events. Control-stage boundaries are not the
    // boundaries of a complete working-edge arc and cannot prove this claim.
    for(let half=0;half<4;half++){
      let lo=half/4,hi=(half+1)/4;
      const before=Math.sign(state(lo,asymmetric,stance).board.roll);
      for(let i=0;i<40;i++){const mid=(lo+hi)/2;if(Math.sign(state(mid,asymmetric,stance).board.roll)===before)lo=mid;else hi=mid;}
      flat.push((lo+hi)/2);
    }
    const arcs=flat.slice(1).map((end,i)=>({time:end-flat[i],length:state(end,asymmetric,stance).board.position[2]-state(flat[i],asymmetric,stance).board.position[2],edge:state((end+flat[i])/2,asymmetric,stance).edge}));
    assert.ok(Math.abs(arcs[0].time-.18)<1e-9&&Math.abs(arcs[1].time-.32)<1e-9);
    assert.ok(Math.abs(arcs[0].length-3.6)<1e-9&&Math.abs(arcs[1].length-6.4)<1e-9);
    assert.notEqual(arcs[0].edge,arcs[1].edge);
    assert.equal(arcs[1].edge,fromEdge,"the initially shown control side is the longer complete working-edge arc");
    assert.ok(Math.abs(arcs[2].time-arcs[0].time)<1e-9&&Math.abs(arcs[2].length-arcs[0].length)<1e-9);
  }
  const entry=(variant:string)=>sample(0,c(variant)).stages.find(s=>s.title.includes("近平板"))!.at;
  assert.ok(entry("edge-locked")>entry("round")+.02);
});

test("visible shoulders lead the sweep, wait for the board and return with it",()=>{
  const angle=(s:MotionState,key:"Shoulder"|"Hip")=>{
    const a=s.joints[`front${key}`],b=s.joints[`rear${key}`];return Math.atan2(-(a[2]-b[2]),a[0]-b[0]);
  };
  for(const fromEdge of ["toe","heel"] as const)for(const stance of ["regular","goofy"] as const)for(let half=0;half<4;half++){
    const c={...round,variant:"shoulder-led",fromEdge};
    const frames=Array.from({length:201},(_,i)=>state((half+i/200)/4,c,stance));
    const board=frames.map(s=>s.board.yaw),shoulder=frames.map(s=>angle(s,"Shoulder"));
    const direction=Math.sign(board[100]-board[0]);
    const peak=board.reduce((best,value,i)=>direction*value>direction*board[best]?i:best,0);
    assert.ok(direction*(shoulder[48]-shoulder[0])>.1,"shoulders visibly start while board and hips still hold");
    assert.ok(Math.abs(board[48]-board[0])<1e-9);
    assert.ok(Math.abs(angle(frames[48],"Hip")-angle(frames[0],"Hip"))<1e-9);
    assert.ok(direction*(board[peak]-board[0])>.5,"board actually follows the first shoulder sweep");
    for(let i=1;i<=peak;i++)assert.ok(direction*(shoulder[i]-shoulder[i-1])>=-2e-4,"shoulders must not return before the delayed board sweep catches up");
    for(let i=peak+1;i<frames.length;i++)assert.ok(direction*(shoulder[i]-shoulder[i-1])<=2e-4,"after catching up, shoulders and board return in the same direction");
    const shoulderPeak=shoulder[peak];
    const shoulderArrives=shoulder.findIndex(a=>Math.abs(a-shoulderPeak)<1e-5);
    assert.ok(shoulderArrives<peak-20,"a visible shoulder lead must precede the shared return");
    assert.ok(Math.abs(shoulder[Math.floor((shoulderArrives+peak)/2)]-shoulderPeak)<1e-5,"shoulder line waits rather than counter-rotating during catch-up");
  }
});

test("low stance, inclination and fore-aft examples change the claimed geometric quantities",()=>{
  const low={...round,variant:"low-stuck"},inclined={...round,variant:"over-inclined"};
  const samples=Array.from({length:401},(_,i)=>state(i/400,low));
  assert.ok(range(samples.map(leg))<.006);
  assert.ok(Math.max(...samples.map(leg))<.72);
  for(const fromEdge of ["toe","heel"] as const)for(const stance of ["regular","goofy"] as const)for(let i=0;i<=400;i++){
    const t=i/400,a=state(t,{...round,fromEdge},stance),b=state(t,{...inclined,fromEdge},stance);
    assert.deepEqual(a.board,b.board);
    const toward=(s:MotionState)=>(s.joints.chest[0]-s.joints.pelvis[0])*Math.sin(s.board.yaw)+(s.joints.chest[2]-s.joints.pelvis[2])*Math.cos(s.board.yaw);
    if(a.edge!=="flat")assert.ok(Math.sign(b.board.roll)*(toward(b)-toward(a))>0,"inclination comparison must remain farther toward the working edge even at low edge angles");
    if(Math.abs(a.board.roll)<1e-10)assert.ok(distance(a.joints.chest,b.joints.chest)<1e-9,"the added inclination must vanish smoothly at flat");
  }
  const along=(s:MotionState,key:"pelvis"|"chest")=>(s.joints[key][0]-s.board.position[0])*Math.cos(s.board.yaw)-(s.joints[key][2]-s.board.position[2])*Math.sin(s.board.yaw);
  for(const fromEdge of ["toe","heel"] as const){
    const centered=state(0,{type:"short-turn-balance",variant:"centered",fromEdge});
    const front=state(0,{type:"short-turn-balance",variant:"nose-pivot",fromEdge});
    const rear=state(0,{type:"short-turn-balance",variant:"back-seat",fromEdge});
    for(const key of ["pelvis","chest"] as const){
      assert.ok(along(front,key)>along(centered,key)+.04);
      assert.ok(along(rear,key)<along(centered,key)-.04);
    }
  }
});

test("nose-pivot constrains the real nose route rather than drawing a false fixed marker",()=>{
  const c={type:"short-turn-balance",variant:"nose-pivot"};
  for(const stance of ["regular","goofy"] as const)for(let half=0;half<4;half++){
    const endpoints=[state(half/4,c,stance),state((half+1)/4,c,stance)];
    const points=endpoints.map(s=>({nose:boardToWorld([s.board.length/2,0,0],s.board),tail:boardToWorld([-s.board.length/2,0,0],s.board)}));
    const nose=distance(points[0].nose,points[1].nose),tail=distance(points[0].tail,points[1].tail);
    assert.ok(nose>1,"nose keeps gliding rather than becoming a fixed contact");
    assert.ok(nose<tail*.6,"nose movement must actually be smaller than tail sweep");
    for(let i=0;i<=50;i++){
      const s=state((half+i/50)/4,c,stance),n=boardToWorld([s.board.length/2,0,0],s.board);
      assert.ok(Math.abs(n[0])<1e-9);
    }
  }
});

test("gaze keeps exact central tracking and a C1 limit relative to the visible shoulders",()=>{
  const wrap=(x:number)=>Math.atan2(Math.sin(x),Math.cos(x));
  const angles=(s:MotionState)=>{
    const a=s.joints.frontShoulder,b=s.joints.rearShoulder;
    const shoulder=Math.atan2(-(a[2]-b[2]),a[0]-b[0]);
    return {gaze:Math.atan2(s.gaze[0],s.gaze[2]),shoulder,requested:wrap(Math.atan2(s.travel[0],s.travel[2])-shoulder)};
  };
  for(const c0 of [...configurations,...additional])for(const fromEdge of ["toe","heel"] as const)for(let i=0;i<=200;i++){
    const c={...c0,fromEdge},s=state(i/200,c),mirror=state(i/200,c,"goofy"),a=angles(s);
    assert.ok(Math.abs(wrap(a.gaze-a.shoulder))<=Math.PI/3+1e-10,"actual neck turn must stay within the authored 60 degree limit");
    if(Math.abs(a.requested)<=Math.PI/4)assert.ok(distance(s.gaze,s.travel)<1e-9,"central tracking remains exact");
    assert.ok(distance([-s.gaze[0],s.gaze[1],s.gaze[2]],mirror.gaze)<1e-9);
  }
  // Locate soft-limit entry/exit from the visible route and actual shoulder
  // line, rather than assuming the old hard-clamp crossing times still apply.
  for(const variant of ["nose-pivot","edge-locked"])for(const fromEdge of ["toe","heel"] as const){
    const c={type:variant==="nose-pivot"?"short-turn-balance":"short-turns",variant,fromEdge};
    const at=(t:number)=>angles(state(t,c));
    const velocityGap=(t:number,h:number)=>{
      const mid=at(t).gaze;
      return Math.abs(wrap(at(t+h).gaze-mid)-wrap(mid-at(t-h).gaze))/(h*duration(c)/1000);
    };
    let crossings=0;
    for(const threshold of [Math.PI/4,5*Math.PI/12])for(let i=1;i<=200;i++){
      let lo=(i-1)/200,hi=i/200;
      const first=Math.abs(at(lo).requested)>threshold;
      if(first===(Math.abs(at(hi).requested)>threshold))continue;
      for(let n=0;n<35;n++){const mid=(lo+hi)/2;if((Math.abs(at(mid).requested)>threshold)===first)lo=mid;else hi=mid;}
      const t=(lo+hi)/2,coarse=velocityGap(t,1e-5),fine=velocityGap(t,1e-7);
      assert.ok(fine<.005,"soft-limit boundaries must not retain a finite angular-velocity step");
      assert.ok(fine<coarse*.1+1e-6,"one-sided velocity difference converges as the interval shrinks");
      crossings++;
    }
    assert.ok(crossings>0,"the regression must exercise a limit transition");
  }
});

test("all additional tasks retain geometry, compatible edges, mirrors and continuous velocities",()=>{
  for(const c0 of additional)for(const fromEdge of ["toe","heel"] as const){
    const c={...c0,fromEdge},frames=Array.from({length:241},(_,i)=>state(i/240,c));
    for(let i=0;i<=240;i++){
      const r=frames[i],g=state(i/240,c,"goofy");
      assert.ok(Math.abs(r.contact[1])<1e-10);
      for(const key of Object.keys(r.joints) as Array<keyof MotionState["joints"]>)assert.ok(distance([-r.joints[key][0],r.joints[key][1],r.joints[key][2]],g.joints[key])<1e-9);
      for(const side of ["front","rear"] as const){
        const j=(suffix:string)=>r.joints[(side+suffix) as keyof MotionState["joints"]];
        assert.ok(Math.abs(distance(j("Hip"),j("Knee"))-BODY.thigh)<1e-9);
        assert.ok(Math.abs(distance(j("Knee"),j("Ankle"))-BODY.shin)<1e-9);
        assert.ok(Math.abs(distance(j("Shoulder"),j("Elbow"))-BODY.upperArm)<1e-9);
        assert.ok(Math.abs(distance(j("Elbow"),j("Hand"))-BODY.forearm)<1e-9);
        assert.ok(distance(r.boots[side].position,boardToWorld(r.boots[side].localPosition,r.board))<1e-9);
      }
      const offset=r.contact.map((v,k)=>v-r.board.position[k]);
      assert.ok(offset[0]*r.travel[0]+offset[2]*r.travel[2]<=1e-10,"uphill working edge");
      if(i>0&&i<240){
        const h=1e-6,a=state(i/240-h,c).board.position,b=state(i/240+h,c).board.position,dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz);
        assert.ok(Math.hypot(dx/length-r.travel[0],dz/length-r.travel[2])<2e-5,"travel includes scale and pivot derivatives");
      }
    }
    const stages=sample(0,c).stages;
    const boundaries=[...stages.map(s=>s.at),.105,.125,.25,.375,.5,.625,.75,.875].filter(t=>t>0&&t<1);
    for(const t of boundaries){
      const h=1e-5,a=state(t-h,c),b=state(t,c),d=state(t+h,c);
      for(const key of ["pelvis","chest","frontKnee","rearKnee"] as const){
        const jump=Math.hypot(...a.joints[key].map((v,k)=>(d.joints[key][k]-2*b.joints[key][k]+v)/(h*duration(c)/1000)));
        assert.ok(jump<.02,`${c.variant}/${key} velocity seam at ${t}: ${jump}`);
      }
    }
    assert.ok(sample(1,c).moving);
    if(c.variant!=="medium-to-short"&&c.variant!=="short-to-medium"){
      const a=frames[0],b=frames[240],delta=b.board.position.map((v,k)=>v-a.board.position[k]);
      for(const key of Object.keys(a.joints) as Array<keyof MotionState["joints"]>)assert.ok(distance(a.joints[key],b.joints[key].map((v,k)=>v-delta[k]) as Vec3)<1e-8);
    }
  }
});
