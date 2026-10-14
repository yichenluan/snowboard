export type TeachingMode = "correct" | "error" | "drill";
export type WorkingEdge = "toe" | "heel" | "flat";

export interface Teaching {
  title: string;
  action: string;
  force: string;
  observe: string;
  cue: string;
}

export const MODES: {
  id: TeachingMode;
  title: string;
  shortTitle: string;
  intro: string;
}[] = [
  {
    id: "correct",
    title: "正确示范 · 圆润连弯",
    shortTitle: "正确示范",
    intro: "看双腿怎样带板、旧刃怎样释放，转向和控速怎样连贯发生。",
  },
  {
    id: "error",
    title: "错误对照 · 急甩尾横刹",
    shortTitle: "错误对照",
    intro: "识别直冲后突然横刹：板转得很快，身体路线却没有跟着走圆。",
  },
  {
    id: "drill",
    title: "递进练习 · 侧滑接单弯",
    shortTitle: "侧滑接单弯",
    intro: "侧滑准备好，再接一个完整弯；逐级缩短等待，最后连成圆弧。",
  },
];

export const PHASE_LABELS = ["释放旧刃", "引导入弯", "完成弧线", "准备换侧"];

const edgeName = (edge: WorkingEdge): string =>
  edge === "toe"
    ? "前刃（脚尖侧）"
    : edge === "heel"
      ? "后刃（脚跟侧）"
      : "接近放平";
const edgeShort = (edge: WorkingEdge): string =>
  edge === "toe" ? "前刃" : edge === "heel" ? "后刃" : "平板过渡";

/** Phase and half come from the same sample as the 3D pose; never infer them from elapsed wall time. */
export function getTeaching(
  mode: TeachingMode,
  phase: number,
  half: 0 | 1,
  edge: WorkingEdge,
  drillHolding = false,
): Teaching {
  const target: WorkingEdge = half === 0 ? "toe" : "heel";
  const previous: WorkingEdge = half === 0 ? "heel" : "toe";
  const targetShort = edgeShort(target);
  const previousShort = edgeShort(previous);
  const phaseIndex = Math.max(0, Math.min(3, Math.floor(phase)));
  const contact =
    edge === "flat"
      ? "此刻接近放平，仍与雪面接触。"
      : `此刻使用${edgeName(edge)}。`;
  const toePosture =
    "膝随脚尖方向调整，骨盆跟随下肢向脚尖侧移动，避免髋留在后面、只把膝和胸口向前送。胸廓比下肢更直立，髋部适量形成反弓；脊柱保持中性，不用挺腰制造弓形。";
  const heelPosture =
    "髋向脚跟侧移动，膝髋适度弯曲；胸廓通过髋部折叠适量回到板上方。前后刃的姿态不必对称，不把臀部远远坐到板外，也不塌腰驼背。";

  if (mode === "drill" && drillHolding) {
    return {
      title: `稳住${edgeShort(edge === "flat" ? previous : edge)}侧滑，再出发`,
      action:
        "雪板大致横坡，两腿保留小幅活动。先把侧滑速度控制好，抬头确认下一弯的入口和出口。",
      force: `${contact}用上坡一侧的刃调节侧滑；在板仍横坡滑动时，不能直接翻到迎雪的下坡刃。`,
      observe:
        "俯视图中，板身与移动方向明显不同；侧滑等待可以缩短，但下一次单弯仍要完整。",
      cue: "先能稳住，再接一个弯。",
    };
  }

  if (mode === "error") {
    return [
      {
        title: "过渡看似平顺，继续看后面的弯",
        action:
          "反例此刻也在减小旧刃角度、适量伸腿。不能只凭一个姿态判断；继续看身体路线与板尾怎样变化。",
        force:
          "释放旧刃只是转弯的一部分。进入新弯后，还需要持续引导和调刃；否则容易把控速拖到后面的一次急刹。",
        observe:
          "暂停后切换正确示范，比较同一时刻的身体位置、板轴和后续路线。差别会在后半弯更加明显。",
        cue: "判断一整个弯，不只看一帧。",
      },
      {
        title: "身体直冲，弯的前半段太少",
        action:
          "板头已经朝下，身体却沿坡下直冲，双腿没有把方向持续带向弯的出口。",
        force:
          "前半段缺少持续转向，控速越来越依赖后面的急刹。单纯加快下一次摆板，不能补回没走完的弧线。",
        observe:
          "对比俯视图：错误路线中间更直，板的朝向与身体路线变化不同步。播放速度只用于对照，不代表实测滑速。",
        cue: "纠正：放大弯，早点开始连续引导。",
      },
      {
        title: "板尾突然扫出，减速挤在弯尾",
        action:
          "反例突然加大身体与雪板的扭转，板尾横扫。正确示范用双腿连续带板，肩膀可以自然调整，不抢着抡过去。",
        force:
          "雪板突然横过行进方向，雪面对板的阻挡也突然改变。反复靠这一拍横刹，动作容易越来越急。",
        observe:
          "看板尾突然扫动、板身与蓝色移动箭头的夹角迅速变大；橙色路线仍较直。问题是动作过于集中，不是“有搓雪就错”。",
        cue: "纠正：整个弯都在带，不等弯尾甩。",
      },
      {
        title: "刹完再抢下一弯，节奏被打断",
        action:
          "刚完成突然横刹，又要赶着反向。回到较大的圆弯，让两条腿重新有连续活动的余量。",
        force:
          "身体要承受突兀的板雪作用变化，接着又匆忙释放。纠正目标是平顺衔接，不是把急刹重复得更快。",
        observe:
          "对照相同阶段的正确路线：出口向横坡发展，接下一弯时没有长直冲和突然甩尾。",
        cue: "先把弯走圆，再缩小。",
      },
    ][phaseIndex];
  }

  if (mode === "drill") {
    return [
      {
        title: `从${previousShort}侧滑，逐渐释放`,
        action:
          "保持两脚有控制，逐渐减小旧刃角度，让双腿能把板带向坡下。不要同时抢着大幅扭肩。",
        force:
          "踝膝髋协调改变板的倾斜，雪面原来对旧刃的约束逐渐减小。雪板仍然接触雪面，不需要跳起来。",
        observe:
          "板身开始离开横坡方向，刃角平顺减小；不能保持横坡朝向直接翻到下坡刃。",
        cue: "松旧刃，把板带进弯。",
      },
      {
        title: `经过坡下，逐渐接入${targetShort}`,
        action: `两腿继续引导雪板转向；${target === "toe" ? "前刃侧膝踝随身体平顺调整" : "后刃侧膝髋协调，保留两脚支撑"}，不要只把后脚踢出去。`,
        force: `根据板的朝向与实际移动方向接入新刃，逐渐建立${targetShort}的板雪作用；不是用固定器强扭膝盖。`,
        observe:
          "俯视图里，侧滑段之间出现一段完整弧线；板头朝向与移动箭头可以不同，这是搓雪。",
        cue: "双腿一起带，接到另一刃。",
      },
      {
        title: `把弧线走完，回到${targetShort}侧滑`,
        action: target === "toe" ? toePosture : heelPosture,
        force: `继续转向横坡，并渐进调节${targetShort}刃角。用整段弧线减速，不在最后突然横甩雪板。`,
        observe:
          "接到新侧滑后，能重新选择速度与停止位置；两腿仍可活动，不是僵住撑着。",
        cue: "转完整，再稳住。",
      },
      {
        title: "恢复控制，再缩短侧滑等待",
        action:
          "最初留足侧滑时间，确认平衡和速度再开始下一弯。两侧都能从容完成后，才缩短两弯间的等待。",
        force:
          "侧滑时保留上坡刃控制；缩短的是准备时间，不能省掉释放旧刃、转向和接入新刃的过程。",
        observe:
          "依次选择较长侧滑、较短侧滑、连续连弯。每一级都应保留完整弧线，两侧都能主动停。",
        cue: "等得更短，弯仍完整。",
      },
    ][phaseIndex];
  }

  return [
    {
      title: `逐渐释放${previousShort}，进入下一弯`,
      action:
        "本示范在过渡中适量伸腿，同时踝膝髋配合减小旧刃角度。上身平顺向前，两脚都保留带板的能力。",
      force:
        "身体的作用经雪靴、固定器传到板上，改变板的倾斜。减刃让旧刃对转向的限制逐渐减小，不等于雪板失去所有压力。",
      observe:
        "看绿色工作刃与板面倾斜：刃角逐渐减小，板接近放平，再换到新刃。膝没有锁死，肩膀没有抢先甩动。",
      cue: "松旧刃，再把板带过去。",
    },
    {
      title: `双腿引导，逐渐接入${targetShort}`,
      action:
        "两腿通过髋部转动和膝踝协调，引导板头板尾一起改向。上身可以自然调整，路线比雪板平顺，不用死朝坡下。",
      force: `通过双脚、雪靴和固定器把转向作用传给雪板；随转弯发展渐进使用${targetShort}。不要把动作理解成单独拧膝盖或后脚踢板尾。`,
      observe:
        "在俯视图中对比黄色板头方向与蓝色实际移动方向：它们有夹角，雪板在可控滑移中转弯。",
      cue: "两条腿一起带，弯中就控速。",
    },
    {
      title: `${targetShort}继续工作，把弧线走圆`,
      action: `${target === "toe" ? toePosture : heelPosture} 这一段先逐渐屈腿，到出口开始为下一次过渡调整。`,
      force:
        "雪面对板的支撑和侧向作用共同改变滑行。刃角、板的朝向和弯形配合控速，不靠一记猛蹬或弯尾突然横刹。",
      observe:
        "开启透视关节，从板头方向看骨盆与胸廓：下肢向工作刃侧调节，胸廓不跟着同幅度倒入；再从侧面确认身体沿板长居中。",
      cue: "持续带板，两边都走圆。",
    },
    {
      title: `完成出口，准备释放${targetShort}`,
      action:
        "出口仍按计划向横坡发展，身体保持可调整。双腿准备下一次减刃和转向，上身不突然反甩。",
      force: `${contact}这一弯的作用仍在持续；到下一次释放时逐渐减小旧刃角度，不为赶拍子提前丢掉控速。`,
      observe:
        "板尾没有突然横扫；进入下一弯时，方向和姿态变化都连续。完整周期应在两侧重复做到。",
      cue: "这一弯走完，下一弯顺着接。",
    },
  ][phaseIndex];
}

export const PRACTICE = {
  title: "上雪怎么练：从侧滑接单弯，到连续小回转",
  terrain:
    "先确认能用两刃侧滑减速、停止，并能独立完成两个方向的单弯。在熟悉、坡度均匀的压雪缓坡练习，留足宽度和停车区。",
  steps: [
    "第一级：可控侧滑 → 接一个完整弯 → 另一刃侧滑。先恢复平衡和合适速度，再做下一弯。",
    "第二级：两侧都从容后，缩短侧滑等待；保留弯的完整出口，不同时催快滑速。",
    "第三级：等待逐渐消失，连续做 4 至 6 个圆润搓雪弯，再按计划停。数量仅方便观察。",
    "最后放宽走廊做中弯，再回到较小弯；确认能主动选择大小，不靠固定停顿或计数。",
  ],
  pass: [
    "两侧都能完成弧线、控制侧滑，并在自己选的位置停住。",
    "缩短等待后仍平顺换侧，没有横坡翻刃、抡肩抢转或突然甩尾。",
    "连弯后速度没有逐弯累积；撤掉口令，仍能主动放大弯和结束。",
  ],
  reset: [
    "单弯接不稳：回到两侧单弯，先补释放和接刃，不再缩短等待。",
    "一缩弯就直冲、急刹：回较长侧滑或较宽的中弯，把弧线走完整。",
    "雪况、人流或坡度变化：结束这一组，重新选择适合练习的位置。",
  ],
};

export const SOURCES = [
  {
    label: "CASI · Reference Guide，p.50、178",
    url: "https://members.casi-acms.com/documents/Ref_Guide.pdf",
    note: "p.50 说明踝膝髋共同形成 angulation，并随坡度、速度、目的调整；p.178 是侧滑接单弯、逐步缩短侧滑段的练习来源。",
  },
  {
    label: "CASI · 二级课程指南，p.9、12",
    url: "https://members.casi-acms.com/documents/Level%202%20translated%207%20Days%20Course%20Guide.pdf",
    note: "用下肢引导、沿板长居中、弯形圆润对称。教练考核坡度和走廊宽度不直接用作练习门槛。",
  },
  {
    label: "AASI · Performance Guide，p.4、14",
    url: "https://thesnowpros.org/wp-content/uploads/2025/01/SB_snowboard_performance_PG-nov2022.pdf",
    note: "搓雪中配合反弓与适量倾倒，避免身体过度倒入弯内、刃角过高而难以连弯。原型采用一种伸展过渡示例，回收并非前置条件。",
  },
];

export const BOUNDARY =
  "这是用于观察动作先后和空间关系的三维示意。路线、姿态和箭头由同一时间线生成；力箭头仅说明作用方向，不表示测得的压力、肌肉用力比例或真实滑速。身体质心也不能直接等同于骨盆位置。关节角度与位移是为表达关系编排的示例，尚未按教练实拍或动作捕捉标定；自动测试验证几何与示意关系，不能认证真实滑行姿态。";
