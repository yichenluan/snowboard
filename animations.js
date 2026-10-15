/*
 * SnowDemo — offline, qualitative snowboard movement demonstrations.
 * API: SnowDemo.mount(elementOrSelector, {
 *   type: 'toe-edge', title: '前刃立刃', view: 'body'|'length'|'width'|'track',
 *   autoplay: false, loop: false, duration: 9000, stance: 'regular'|'goofy',
 *   variant: 'toe'|'heel', steps: [{at:0,title:'准备',note:'...'}, ...],
 *   keyframes: [{t:0,h:96,fore:0,hipY:0,shoulderY:0,edge:0}, ...]
 * }). Returns {destroy(), play(), pause(), seek(0..1), setView(view)}.
 * steps also accepts {label,detail}; omitted at uses the preset's movement-phase
 * mapping (3/4 steps), NOT equal time divisions. Explicit at always takes priority.
 * Additional variants: neutral, hold, arms-feedback, open, open-heel,
 * closed-toe, rear-heel, front-center-back, front-return-toe, hamstring.
 * Optional path: straight, single-arc, j-turn, garland, rail, linked-skid,
 * transition (old-arc -> neutral -> new-arc), retraction (apex -> transition).
 * A heel variant reflects single-edge routes as well as the joint pose.
 * Teaching comparisons: inclination variants inclination-focused / angulation-focused,
 * edgeSide:'toe'|'heel'; pressureDiagram:true with variant:'phase-study'
 * is a flat-board, straight/level reference: vertical movement, no turning;
 * transitionReference:'snow' shows body-over-board / board-under-body transitions;
 * edge-change-down variants lower-com / retraction-study contrast COM lowering
 * with board-under-COM retraction; the latter uses a stable world-height reference.
 * trackDiagnostics:true shows board axis and travel direction; turnShape:'open'|'closed'
 * changes the skidded/carved route without pretending to calculate speed.
 * jointLabels:true labels ankle, knee, hip and shoulder in body/width views.
 * Short-turn families: short-turns (round / tail-brake / shoulder-led /
 * edge-locked / asymmetric / low-stuck / over-inclined), short-turn-progression
 * (side-slip / side-slip-shorter / linked / medium-to-short / short-to-medium /
 * short-steady), and
 * short-turn-balance (centered / nose-pivot / back-seat). All share synchronized
 * board, travel and joint phases; transition:extend|flex|retract is optional.
 * Skeleton fields: h = hip height; fore = longitudinal hip offset;
 * hipY/shoulderY = lateral positions; edge = qualitative board roll;
 * hipYaw/shoulderYaw = relative rotation; twist = front/rear roll difference.
 * Units and angles are internal drawing coordinates, NOT coaching prescriptions.
 * Sources underpinning the presets:
 * AASI fundamentals: https://thesnowpros.org/2021/01/8840/
 * CASI Reference Guide: https://members.casi-acms.com/documents/Ref_Guide.pdf
 * CASI recentering: https://casi-acms.com/casi-blog/the-critical-link/
 * CASI transition progression: https://casi-acms.com/national-tech-team-articles/aasi-rider-rally-2025/
 * SBINZ Chapter 6, printed B/06 (PDF page 81):
 * https://www.nzsia.org/wp-content/uploads/2017/06/SBINZ_Manual_2017.pdf
 * Distinct flexion and extension timings are tactics, not one universal turn rule.
 */
(function (global) {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const PI = Math.PI;
  const rad = degrees => degrees * PI / 180;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = t => t * t * (3 - 2 * t);
  const round = n => Number(n.toFixed(2));
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g,
    c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const base = {h:96,fore:0,hipY:0,shoulderY:5,torsoX:0,edge:0,
    hipYaw:0,shoulderYaw:0,twist:0,kneeBias:1,look:0,arms:0};
  const key = (t, values) => Object.assign({t}, values || {});
  const step = (at, title, note) => ({at, title, note});
  const presets = {
    'center-low': {
      title:'降低重心：屈踝、屈膝、屈髋', view:'body',
      keyframes:[key(0,{h:99}),key(.4,{h:76,hipY:-6,shoulderY:14}),
        key(.72,{h:76,hipY:-6,shoulderY:14}),key(1,{h:99})],
      steps:[step(0,'保留活动余量','以舒适中立姿态开始，脚留在固定器内。'),
        step(.25,'三关节一起屈曲','髋向下，膝向脚尖方向活动；上身保持可控制，不把折腰当作蹲低。'),
        step(.6,'观察仍可调整','降低重心不等于蹲到最低；继续保留屈伸和侧向调整余量。'),
        step(.84,'回到中立高度','平稳回升，不锁死膝盖。')]
    },
    'center-high': {
      title:'可活动的中立姿态', view:'body',
      keyframes:[key(0,{h:84}),key(.32,{h:106}),key(.58,{h:102}),
        key(.78,{h:89}),key(1,{h:84})],
      steps:[step(0,'自然屈膝','两脚一起支撑，头、躯干、髋与雪板构成可活动的姿态。'),
        step(.2,'舒展而不僵直','升高髋的位置，膝盖仍留余量；站高不等于锁膝。'),
        step(.6,'小幅屈伸检查','若还能平稳上下活动，说明姿态没有把关节锁住。')]
    },
    'fore-aft': {
      title:'沿板长的平衡与压力调整', view:'length',
      keyframes:[key(0,{fore:0}),key(.25,{fore:20,h:93,torsoX:-5}),
        key(.5,{fore:0}),key(.73,{fore:-14,h:94,torsoX:4}),key(1,{fore:0})],
      steps:[step(0,'从居中开始','观察髋与双脚的位置关系，而非只移动头或前伸手臂。'),
        step(.16,'小幅前脚侧调整','髋向板头侧移动，双腿协调屈伸；演示不是固定前脚重量比例。'),
        step(.42,'回到居中位置','回到双脚之间，给下一阶段保留选择。'),
        step(.65,'后脚侧调整再回到居中位置','用于体会前后范围；普通压雪道滑行不要长期坐在板尾。')]
    },
    'toe-edge': {
      title:'前刃：用关节逐渐立刃', view:'width',
      keyframes:[key(0,{}),key(.42,{h:93,edge:24,hipY:15,shoulderY:11}),
        key(.72,{h:87,edge:31,hipY:18,shoulderY:12}),key(1,{})],
      steps:[step(0,'居中、平板示意','这是关节关系演示；雪上操作要匹配坡度、速度与刃的方向。'),
        step(.24,'逐渐进入前刃','踝膝向脚尖侧活动，髋随之调整；并非踮起脚尖硬撑。'),
        step(.56,'腿与上身配合保持平衡','板的角度增加，躯干不必以相同幅度倒向内侧。'),
        step(.84,'减小刃角、回到居中位置','平稳释放旧刃，不突然把身体甩过雪板。')]
    },
    'heel-edge': {
      title:'后刃：髋膝踝协调，不折腰坐尾', view:'width',
      keyframes:[key(0,{}),key(.42,{h:89,edge:-24,hipY:-21,shoulderY:-7}),
        key(.72,{h:85,edge:-29,hipY:-24,shoulderY:-7}),key(1,{})],
      steps:[step(0,'从居中开始','脚固定在雪板上，先观察横向的平衡。'),
        step(.24,'髋向脚跟侧调整','膝踝保留活动，利用靴筒、固定器和雪板传递动作。'),
        step(.56,'躯干保持支撑','避免只弯腰、臀部远离雪板；角度随速度、雪况调整。'),
        step(.84,'释放、回到居中位置','减小刃角，再准备下一次动作。')]
    },
    'absorption': {
      title:'屈曲吸收：腿变短，身体更平顺', view:'body',
      keyframes:[key(0,{h:102,edge:13,hipY:7}),
        key(.27,{h:100,edge:13,hipY:7}),key(.48,{h:77,edge:13,hipY:7,shoulderY:9}),
        key(.7,{h:88,edge:13,hipY:7}),key(1,{h:102,edge:13,hipY:7})],
      terrain:'bump',
      steps:[step(0,'接近小起伏','脚与雪板仍在雪面，预留屈曲范围。'),
        step(.3,'腿部屈曲吸收','板随地形上升，腿变短；减少地形把躯干顶起的幅度。'),
        step(.6,'越过后逐步恢复','随雪面变化逐渐伸腿，不突然蹬直。'),
        step(.85,'区分姿态与压力','蹲得低不自动等于压力大；压力取决于运动、速度与雪板雪面相互作用。')]
    },
    'pressure-extend': {
      title:'伸展调压：有节奏地屈伸双腿', view:'body',
      keyframes:[key(0,{h:80,edge:14,hipY:7}),
        key(.3,{h:105,edge:14,hipY:7}),key(.52,{h:103,edge:9,hipY:4}),
        key(.75,{h:89,edge:14,hipY:7}),key(1,{h:80,edge:14,hipY:7})],
      steps:[step(0,'从屈曲姿态开始','留出伸展范围，身体仍与雪板保持平衡。'),
        step(.06,'伸展开始：暂时增压','腿部伸展使身体向上加速时，板雪接触压力暂时增加。'),
        step(.3,'收住上升：暂时减压','身体仍在上升但逐渐减速时，脚下支撑力可短暂减小；幅度取决于动作速度与当时条件。'),
        step(.68,'再次屈膝，缓和压力变化','避免以僵直双腿承受弯内或地形增加的压力。')]
    },
    'pressure-flex': {
      title:'屈曲的两个阶段：开始下蹲与停住下落',view:'body',
      keyframes:[key(0,{h:103}),key(.38,{h:76,hipY:-5,shoulderY:11}),
        key(.64,{h:76,hipY:-5,shoulderY:11}),key(1,{h:103})],
      steps:[step(0,'较高、可活动的姿态','留出屈曲范围；此演示保持板雪接触。'),
        step(.05,'开始屈曲：暂时减压','身体向下加速，双腿屈曲，板雪接触压力暂时减小。'),
        step(.38,'停止下蹲：压力暂时增加','身体停止继续下落，减速过程可暂时增加板雪接触压力。'),
        step(.7,'平稳恢复高度','不能把“越蹲越压”当通用口诀；动作阶段、速度、弯形与地形共同决定压力。')]
    },
    'inclination': {
      title:'内倾与反弓的配合', view:'width',
      keyframes:[key(0,{}),key(.28,{edge:18,hipY:12,shoulderY:23,h:96}),
        key(.56,{edge:29,hipY:20,shoulderY:25,h:88}),
        key(.76,{edge:29,hipY:19,shoulderY:13,h:87}),key(1,{})],
      steps:[step(0,'从居中开始','真实转弯需要速度和弯形支持；静止时不能照图向内倒。'),
        step(.15,'适量内倾','髋与躯干向弯内移动，幅度取决于当前转弯条件。'),
        step(.43,'腿与上身分别调整倾斜','踝、膝、髋相互配合，让腿与上身的倾斜幅度不同，形成反弓；不用全身一起倒得更低来增加刃角。'),
        step(.68,'保留调节空间','躯干相对更接近支撑区域，仍可调刃、屈腿吸收，并回到居中位置。')]
    },
    'edge-change-up': {
      title:'伸展式换刃：旧刃 → 回到居中位置 → 新刃', view:'width',
      keyframes:[key(0,{h:82,edge:25,hipY:17,shoulderY:12}),
        key(.28,{h:101,edge:11,hipY:7,shoulderY:6}),key(.44,{h:106,edge:0,hipY:0,shoulderY:3}),
        key(.7,{h:94,edge:-21,hipY:-16,shoulderY:-5}),
        key(1,{h:83,edge:-26,hipY:-22,shoulderY:-7})],
      steps:[step(0,'旧弯仍有支撑','从可屈伸的姿态准备释放旧刃。'),
        step(.18,'伸展并释放','舒展双腿同时减小刃角；动作节奏影响压力变化。'),
        step(.38,'经过居中位置','旧刃释放，板短暂接近平；示意不要求刻意长时间直滑。'),
        step(.58,'渐进建立新刃','进入新弯后逐渐屈膝，缓和压力变化；避免站直后猛砸新刃。')]
    },
    'edge-change-down': {
      title:'回收式换刃：屈腿让板从身下通过', view:'width',
      keyframes:[key(0,{h:102,edge:25,hipY:16,shoulderY:18}),
        key(.28,{h:85,edge:13,hipY:8,shoulderY:10}),key(.46,{h:73,edge:0,hipY:0,shoulderY:5}),
        key(.7,{h:88,edge:-20,hipY:-15,shoulderY:-6}),
        key(1,{h:101,edge:-25,hipY:-19,shoulderY:-12})],
      steps:[step(0,'旧弯结束前，双腿还能再弯一些','这是进阶节奏，不作为首次学习转弯的必修动作。'),
        step(.18,'主动回收双腿','缩短腿长并释放旧刃，身体和板的横向关系开始变化。'),
        step(.38,'屈腿经过居中位置','雪板从身体下方通过，脚固定在板上；不是单纯弯腰。'),
        step(.6,'进入新弯再伸展','逐渐伸腿以维持雪面接触，不把每个弯都做成僵硬深蹲。')]
    },
    'steering': {
      title:'脚、膝、髋渐进引导雪板转向', view:'track',
      keyframes:[key(0,{h:94,edge:0}),key(.23,{fore:8,twist:8,hipYaw:6,shoulderYaw:2,edge:12,hipY:7}),
        key(.5,{fore:0,hipYaw:10,shoulderYaw:5,edge:19,hipY:11}),
        key(.7,{fore:0,hipYaw:0,shoulderYaw:0,edge:0}),
        key(.88,{fore:8,twist:-8,hipYaw:-6,shoulderYaw:-2,edge:-12,hipY:-10}),
        key(1,{fore:0,hipYaw:-10,shoulderYaw:-5,edge:-19,hipY:-16})],
      path:'linked-skid',
      steps:[step(0,'看向计划路线','视线帮助选择路线，手臂不用猛甩。'),
        step(.15,'下肢渐进引导','脚与膝的运动通过靴与固定器传给板；前后脚可先后配合。'),
        step(.4,'持续引导弯形','髋与躯干协调跟进；转向不等于靠后脚横扫。'),
        step(.65,'释放并转入下一弯','回到能继续调整的位置，再引导另一侧；俯视宽带表示搓雪。')]
    },
    'shoulder-coordination': {
      title:'视线、肩髋与下肢协调', view:'track',
      keyframes:[key(0,{}),key(.25,{look:12,hipYaw:5,shoulderYaw:5,edge:18,hipY:9}),
        key(.48,{look:5,hipYaw:0,shoulderYaw:0,edge:12,hipY:7}),
        key(.65,{}),key(.87,{look:-12,hipYaw:-5,shoulderYaw:-5,edge:-18,hipY:-14}),
        key(1,{look:-5,edge:-12,hipY:-9})],
      path:'linked-skid',
      steps:[step(0,'先确认路线','抬头观察前方与周围，肩髋保持自然关系。'),
        step(.16,'协调而非抡肩','下肢引导雪板，肩髋随任务适度协调；不靠甩手拧肩驱动每个转弯。'),
        step(.41,'上身平顺，不僵住','肩线和髋线只是方向示意，不要求永远完全平行雪板。'),
        step(.66,'平顺换向','动作连续；高级反拧等特定任务不在本初中级演示中。')]
    },
    'garland': {
      title:'花环练习：同一刃、重复释放与建刃', view:'track',path:'garland',
      keyframes:[key(0,{edge:24,hipY:14,shoulderY:10}),
        key(.125,{edge:7,hipY:4,fore:7,h:100}),key(.375,{edge:24,hipY:14,h:89}),
        key(.625,{edge:7,hipY:4,fore:7,h:100}),key(.875,{edge:24,hipY:14,h:89}),
        key(1,{edge:24,hipY:14,shoulderY:10})],
      steps:[step(0,'从可控横滑 / 斜滑开始','开阔缓坡，同一刃支撑。选择前刃或后刃版本。'),
        step(.05,'减小刃角，板头向下','渐进释放同一刃，控制下降量；不要越过落线换到另一刃。'),
        step(.24,'重新建刃，转回横坡','用下肢引导并逐步增加刃角，弯形帮助减速。'),
        step(.56,'重复半个弯','保持同一刃，把释放与再建刃练顺；完成后再练相反侧。')]
    },
    'j-turn': {
      title:'J 形转弯：短直滑 → 单一圆弧 → 横坡', view:'track',path:'j-turn',
      keyframes:[key(0,{h:95}),key(.2,{h:96,fore:7}),
        key(.46,{h:92,edge:12,hipY:7,fore:3}),key(.75,{h:87,edge:23,hipY:14,fore:0}),
        key(1,{h:87,edge:24,hipY:15,fore:0})],
      steps:[step(0,'短距离可控直滑','使用宽缓、具安全停止区的雪道；先具备基本滑行和停止能力。'),
        step(.2,'渐进进入一个刃','踝膝髋协调立刃 / 引导，避免突然抓刃。'),
        step(.5,'持续完成圆弧','方向逐渐转向横坡，用弯形降低速度。'),
        step(.8,'横坡完成并停住','这是单独练一侧转弯；另一刃要分别练习，不急于连续换刃。')]
    },
    'rail-track': {
      title:'浅弧刃滑：让板尾跟随板头', view:'track',path:'rail',
      keyframes:[key(0,{}),key(.23,{edge:19,hipY:12,shoulderY:14,h:97}),
        key(.5,{}),key(.77,{edge:-19,hipY:-15,shoulderY:-11,h:97}),key(1,{})],
      steps:[step(0,'小角度、舒适速度','掌握转弯后在开阔缓坡练习；先做浅弧。'),
        step(.13,'渐进立刃','使用踝膝髋调整，不主动扭板或横扫后脚。'),
        step(.38,'检查细窄刃痕','板尾跟随板头留下同一轨迹；明显宽带说明仍在搓雪。'),
        step(.6,'平顺释放并立另一刃','控制速度优先，浅弧会持续下滑，不能把刻滑当唯一制动方式。')]
    }
  };

  Object.assign(presets, {
    'gaze-control': {
      title:'头部观察与肩髋控制：转头不甩板',view:'body',path:'rail',
      keyframes:[key(0,{h:97}),key(.24,{h:97,look:35,edge:16,hipY:9,shoulderY:11}),
        key(.5,{h:97,look:-32}),key(.76,{h:97,look:30,edge:-16,hipY:-12,shoulderY:-8}),key(1,{h:97})],
      steps:[step(0,'先确认慢速可控路线','持续观察环境，先具备基本转弯与停止能力。'),
        step(.14,'头部小幅观察','头和视线转动，肩髋不用跟着猛旋转；雪镜的位置变化标出头部朝向。'),
        step(.4,'下肢继续管理雪板','保持原有的关节活动与路线控制，不因回头而甩板。'),
        step(.84,'看回行进前方','肩髋仍可自然协调，不把“稳定”理解成僵硬锁住。')]
    },
    'hip-edge-change': {
      title:'髋引导换刃：保持踝膝协调',view:'width',
      keyframes:[key(0,{h:96}),key(.24,{h:94,edge:21,hipY:13,shoulderY:11}),
        key(.48,{h:96}),key(.76,{h:94,edge:-21,hipY:-18,shoulderY:-7}),key(1,{h:94,edge:-21,hipY:-18,shoulderY:-7})],
      steps:[step(0,'髋的横向路径','重点观察髋部如何移动；脚踝与膝盖仍要一起配合，不能只动髋。'),
        step(.14,'髋参与前刃','髋配合踝膝进入前刃，避免折腰替代横向移动。'),
        step(.37,'经过支撑区域','髋与板的横向关系改变，躯干仍可控制，释放并回到居中位置。'),
        step(.6,'建立后刃的支撑','髋移向新弯，踝膝共同调节新刃；不追求极端倒伏。')]
    },
    'knee-edge-change': {
      title:'用膝盖的移动体会换刃：小幅、渐进、协调',view:'width',
      keyframes:[key(0,{h:96,edge:22,hipY:12,shoulderY:9}),
        key(.28,{h:88,edge:8,hipY:4,shoulderY:6,twist:4}),key(.46,{h:89,edge:0,hipY:0,shoulderY:4}),
        key(.74,{h:93,edge:-19,hipY:-14,shoulderY:-3}),key(1,{h:95,edge:-23,hipY:-18,shoulderY:-7})],
      steps:[step(0,'借膝盖的移动体会立刃','不要只扭膝盖，脚踝与髋部仍要一起配合。'),
        step(.18,'踝膝逐渐配合','降低旧刃角，膝保持脚尖方向的自然运动，不强压内扣。'),
        step(.4,'回到居中位置后换侧','保持双脚固定，经过身体与雪板相对居中的位置。'),
        step(.63,'协调建立新刃','不要为了膝先动而僵硬锁髋或锁踝；体感线索因人而异。')]
    },
    'retraction-turns': {
      title:'回收式连续转弯：屈曲换刃、弯内伸展',view:'body',path:'rail',
      keyframes:[key(0,{h:103,edge:24,hipY:15,shoulderY:19}),key(.24,{h:77}),
        key(.5,{h:103,edge:-24,hipY:-19,shoulderY:-12}),key(.74,{h:77}),key(1,{h:103,edge:24,hipY:15,shoulderY:19})],
      steps:[step(0,'旧弯预留回收空间','进阶节奏：腿还有缩短余量，再准备释放旧刃。'),
        step(.12,'回收通过换刃','屈腿释放旧刃，让板从身下通过。'),
        step(.36,'新弯内逐渐伸展','逐渐伸腿并保持雪面接触；不把板猛踢到身外。'),
        step(.64,'另一侧重复','再次回收并建立另一侧支撑，动作时机随速度、半径和雪况调整。')]
    },
    'twist': {
      title:'扭板：前后脚不同刃角的协调',view:'body',
      keyframes:[key(0,{edge:15,hipY:9}),key(.24,{twist:-8,edge:10,fore:5,h:92,hipY:5}),
        key(.46,{twist:-8,edge:-12,hipY:-9}),key(.68,{edge:-17,hipY:-13}),key(1,{edge:-17,hipY:-13})],
      steps:[step(0,'板头与板尾分别观察','当前雪刃仍在控制滑行。扭板是让前后脚处出现不同刃角，区别于整块雪板在雪面上改变朝向。'),
        step(.13,'前后脚不同节奏','板头一侧先减小刃角，通过踝膝屈伸与适量旋转，让两端出现不同刃角；板变形经过夸张。'),
        step(.37,'协调完成建刃','板头一侧先进入新刃，后脚逐渐配合，建立所需的整条刃支撑。'),
        step(.63,'两脚重新配合','两端重新更接近同一刃角，不持续保持大扭转，也不是前后脚轮流猛踩。')]
    },
    'rotation': {
      title:'同向协调旋转：下肢引导、上身跟进',view:'track',path:'linked-skid',
      keyframes:[key(0,{}),key(.24,{hipYaw:15,shoulderYaw:12,edge:16,hipY:9}),
        key(.5,{}),key(.76,{hipYaw:-15,shoulderYaw:-12,edge:-16,hipY:-13}),key(1,{})],
      steps:[step(0,'先选择路线','看向需要去的方向，保持上身稳定。'),
        step(.14,'关节协调旋转','下肢与髋引导雪板，上身适量跟进；不是把肩转多少板就转多少。'),
        step(.4,'回到居中位置并准备换向','肩、髋、板的关系持续调整，避免旋转过量导致失衡。'),
        step(.64,'另一侧协调','用相同原则做反方向圆弧，重点是连续与可控制。')]
    },
    'counter-rotation': {
      title:'反向旋转：特定任务的短时分离',view:'track',path:'linked-skid',
      keyframes:[key(0,{}),key(.25,{hipYaw:-10,shoulderYaw:19,edge:12,hipY:7}),
        key(.45,{hipYaw:-5,shoulderYaw:8,edge:18,hipY:10}),
        key(.65,{edge:18,hipY:10}),key(1,{edge:18,hipY:10})],
      steps:[step(0,'限定为进阶专项','先熟悉小幅调速与稳定的双腿引导转板，再在教练指导下练习特定分离任务。'),
        step(.14,'短时上 / 下身分离','上、下身呈相反旋转；动作幅度要适合当前练习，不靠甩肩拧腰硬转。'),
        step(.25,'分别观察双腿转板与上身朝向','分离是暂时策略，不根据最终开放姿势判断是否用了反拧。'),
        step(.56,'恢复协调关系','完成后及时恢复协调和支撑；不把相反肩转、强压髋膝作为刻滑通用口令。')]
    },
    'switch': {
      title:'反脚滑行：原后脚变成前脚',view:'track',path:'linked-skid',switch:true,
      keyframes:[key(0,{}),key(.24,{fore:-7,edge:-16,hipY:-13,hipYaw:-6,shoulderYaw:-3}),
        key(.5,{}),key(.76,{fore:-7,edge:16,hipY:9,hipYaw:6,shoulderYaw:3}),key(1,{})],
      steps:[step(0,'保持原固定器站姿','双脚没有在固定器中转过去；改变的是滑行方向。'),
        step(.14,'原后脚侧引导','反脚滑行时，新的前脚配合后脚引导路线，重新学习两侧的圆弧与停止。'),
        step(.4,'先在缓坡练居中平衡','从更缓坡与更低速度开始，保留基本屈伸和刃控制。'),
        step(.64,'另一侧也要练习','反脚不是左右键的替换；它训练相反方向的平衡和协调。')]
    },
    'dry-squat': {
      title:'离雪自重深蹲：髋膝协调、全脚掌支撑',view:'body',dry:'squat',
      keyframes:[key(0,{h:112}),key(.4,{h:74,hipY:-21,shoulderY:11}),
        key(.63,{h:74,hipY:-21,shoulderY:11}),key(1,{h:112})],
      steps:[step(0,'双脚稳定站地','舒适站距，脚尖可稍向外；全脚掌着地。'),
        step(.17,'髋后移并下蹲','髋膝协调屈曲，膝盖顺着脚尖方向弯曲，背部保持自然，不塌腰或弓背。'),
        step(.4,'到可控制的深度','不以最低位置为目标；脚跟不离地，不靠强压膝或折腰增加深度。'),
        step(.7,'平稳起身','髋与躯干一起回升；离雪体能不能替代雪上的平衡与刃控制。')]
    },
    'dry-plank': {
      title:'离雪前平板支撑：肘在肩下、躯干一线',view:'body',dry:'plank',
      keyframes:[key(0,{h:10}),key(.22,{h:58}),key(.79,{h:58}),key(1,{h:10})],
      steps:[step(0,'稳定准备支撑','前臂与膝先稳定在垫上，肘在肩下，准备收紧腹部并保持呼吸。'),
        step(.16,'建立整体支撑','双腿向后、膝离垫，肩、髋、膝、踝保持一条可控制的线，不塌腰或撅臀。'),
        step(.38,'维持姿态并呼吸','保持质量优先；动画时间不是建议训练时长。'),
        step(.81,'整体放回垫上','无法保持姿态就结束，不以憋气或腰部硬撑追求时间。')]
    },
    'dry-calf-raise': {
      title:'离雪提踵：抬脚跟、缓慢下放',view:'body',dry:'calf',
      keyframes:[key(0,{h:108}),key(.35,{h:108,fore:0}),key(.62,{h:108}),key(1,{h:108})],
      steps:[step(0,'双脚站在地面','需要时扶稳椅或墙，先确认平衡。'),
        step(.16,'同时抬起脚跟','前脚掌支撑，踝关节动作；这是体能训练，不是前刃滑行站姿。'),
        step(.38,'短暂停留','身体平稳，不向内外崴脚。'),
        step(.66,'缓慢放下脚跟','恢复全脚掌着地，再做下一次；滑雪靴内仍应保持脚跟稳定。')]
    },
    'dry-wall-edge': {
      title:'离雪扶墙前刃体感：踝膝髋协调',view:'body',dry:'wall',
      keyframes:[key(0,{h:108}),key(.42,{h:102,hipY:11,shoulderY:11}),
        key(.72,{h:102,hipY:11,shoulderY:11}),key(1,{h:108})],
      steps:[step(0,'扶稳墙、全脚掌踩地','用小幅动作体会关节关系，不用裸脚模拟雪板抓刃。'),
        step(.2,'膝向脚尖方向活动','髋跟进，踝保留活动；不用踮脚尖顶住。'),
        step(.5,'观察躯干可控制','不塌腰，不强顶膝，动作只在舒适范围内。'),
        step(.82,'回到中立','离雪练习只提供体感；真正刃控仍要在合适雪道练习。')]
    },
    'ankle-mobility': {
      title:'扶墙小腿伸展：后脚跟留在地面',view:'body',dry:'ankle',
      keyframes:[key(0,{h:0}),key(.42,{h:1}),key(.78,{h:1}),key(1,{h:0})],
      steps:[step(0,'双手扶墙、前后站立','前腿略屈，后腿后撤，后脚全掌着地。'),
        step(.18,'身体小幅前移','前膝适度弯曲，后脚跟不抬；不让后踝向内外塌。'),
        step(.44,'感到轻柔拉伸即可','不是强压韧带或追求极限；有疼痛就停止。'),
        step(.81,'回位并换侧','动画只示范一侧，左右侧分别练习。')]
    },
    'hip-mobility': {
      title:'半跪拉伸髋前侧：骨盆控制、躯干直立',view:'body',dry:'hip',
      keyframes:[key(0,{h:0}),key(.42,{h:1}),key(.78,{h:1}),key(1,{h:0})],
      steps:[step(0,'一膝垫地、另一脚前方踩地','保持平衡，前脚全掌着地。'),
        step(.18,'轻收骨盆、轻夹臀','保持躯干直立，不用腰椎后弯代替髋前侧伸展。'),
        step(.44,'小幅向前移','在舒适范围感到后侧腿髋前侧拉伸；不来回弹压、不强拉。'),
        step(.81,'回位并换侧','左右侧分别练习，动画时间不代表推荐保持时长。')]
    },
    'dry-hamstring': {
      title:'仰卧活动大腿后侧（腘绳肌）：托腿、慢伸膝',view:'body',dry:'hamstring',
      keyframes:[key(0,{h:0}),key(.44,{h:1}),key(.62,{h:1}),key(1,{h:0})],
      steps:[step(0,'仰卧、一腿朝胸前抬起','另一腿伸直留在垫上，手托抬起腿的大腿后侧。'),
        step(.18,'缓慢伸膝','大腿保持支撑，逐渐伸小腿，在舒适范围内活动。'),
        step(.46,'不强拉到极限','感到轻柔拉伸即可，不用外力压韧带。'),
        step(.7,'控制屈膝返回','慢慢屈膝，左右侧分别练习。')]
    }
  });
  presets['mixed-rotation']={
    title:'肩部节奏组合：前刃反拧 → 回到居中位置 → 后刃协调',view:'track',path:'linked-skid',
    keyframes:[key(0,{edge:14,hipY:8,hipYaw:-5,shoulderYaw:10}),
      key(.22,{edge:19,hipY:11,hipYaw:-9,shoulderYaw:17}),key(.48,{}),
      key(.78,{edge:-18,hipY:-14,hipYaw:-10,shoulderYaw:-9}),key(1,{edge:-18,hipY:-14})],
    steps:[step(0,'前刃短时上 / 下身分离','进阶可选任务，肩线与下身呈相反旋转，不作为基础转弯必修。'),
      step(.34,'恢复中立协调','释放旧刃，回到可调整的肩髋关系，不强锁关节。'),
      step(.63,'后刃小幅同向协调','下肢引导，肩髋适量同向跟进；不是抡肩甩板。'),
      step(.87,'完成任务再检查轨迹','此组合不保证纯刻滑，优先检查控速、抓地与失衡后能否及时稳住。')]
  };
  presets['dry-shoulder-rolls']={
    title:'离雪肩部绕环：放松双臂、小幅活动',view:'body',dry:'shoulder',
    keyframes:[key(0,{h:110}),key(1,{h:110})],
    steps:[step(0,'手臂自然垂下','站稳，肩部放松；也可在轻松踏步中完成。'),
      step(.08,'小幅向前绕肩','肩部作受控小圆，手臂自然跟随，不做大幅抡臂。'),
      step(.53,'再小幅向后绕肩','反方向重复，躯干保持自然，不强压肩关节。'),
      step(.89,'结束并放松','这是一般活动热身，不是治疗处方；不以疼痛或极限活动为目标。')]
  };
  presets.pedalling=Object.assign({},presets.twist,{title:'踩踏式协调：前后脚逐步配合'});
  // Short-turn routes share one clock with the joint model. They are teaching
  // sketches, not a speed or force simulation. Route progress is measured along
  // the drawn path so shrinking the turns does not silently accelerate the rider.
  const shortTypes=['short-turns','short-turn-progression','short-turn-balance'];
  const shortVariantsByType=Object.freeze({
    'short-turns':Object.freeze(['round','tail-brake','shoulder-led','edge-locked','asymmetric','low-stuck','over-inclined']),
    'short-turn-progression':Object.freeze(['side-slip','side-slip-shorter','linked','medium-to-short','short-to-medium','short-steady']),
    'short-turn-balance':Object.freeze(['centered','nose-pivot','back-seat'])
  });
  const shortVariants={
    round:['普通搓雪小回转：圆弯、持续引导','双脚一起引导，弯中持续搓雪；先减小旧刃角，再换向。'],
    'tail-brake':['对照：弯尾突然横刹','前半弯直冲，末段突然把板横过来；观察方向突变和集中在弯尾的宽雪痕。'],
    'shoulder-led':['对照：抡肩抢转','肩膀先大幅甩动，雪板随后急转；上身路线也更摇摆。'],
    'edge-locked':['对照：旧刃不放，换向拖延','本该换刃时还咬着旧刃，路线拖长；随后突然转板补救。'],
    asymmetric:['对照：两侧弯形不对称','两侧弯的宽度和完成程度不同；不要只用数拍掩盖路线差异。'],
    'low-stuck':['对照：一直蹲在最低处','腿部几乎不再伸屈，遇到换刃和压力变化时缺少调整余地。'],
    'over-inclined':['对照：身体内倒过多，雪板向外滑','当前速度和雪面撑不住这样的内倾，身体倒在弯内、板向外滑；先缩小倾斜幅度，重新找回两脚支撑。'],
    'side-slip':['侧滑接单个换刃弯','先侧滑稳住，再转到另一刃继续侧滑；每次单弯后都能重新控速。'],
    'side-slip-shorter':['逐步缩短侧滑段','保持单弯质量，逐步缩短两次转弯之间的侧滑距离。'],
    linked:['把单弯接成连续短弯','侧滑段缩短后平顺接弯；仍需完成两侧圆弧，不急着加快。'],
    'medium-to-short':['从中弯逐步缩成小弯','逐步缩小弯的宽度和下降距离，双脚引导跟上弯形；不靠直冲增加速度。'],
    'short-to-medium':['从小弯逐步放回中弯','逐步放大弯的宽度和下降距离；弯仍要做完整，不靠长时间朝坡下直冲放大弯。'],
    'short-steady':['连续小弯：保持走廊与节奏','连续做大小接近的圆弯；前后刃的弯形、出口和节奏一起检查。'],
    centered:['双脚居中引导：板头板尾都在转','身体大致位于两脚之间，两脚协调引导；不是把板头钉在雪里只甩板尾。'],
    'nose-pivot':['对照：压住板头、甩动板尾','身体持续压在前脚一侧，板尾大幅横扫；注意宽雪痕与突然转向。'],
    'back-seat':['对照：长期后坐，入弯拖延','髋落在后脚一侧，转向开始得晚；旧弯拖长后再急着换向。']
  };
  shortTypes.forEach(type=>{
    const variant=type==='short-turn-progression'?'side-slip':type==='short-turn-balance'?'centered':'round';
    presets[type]={title:shortVariants[variant][0],view:'track',path:'short-turns',
      skid:true,trackDiagnostics:true,keyframes:[key(0,{}),key(1,{})],
      steps:[step(0,'看路线与身体位置',shortVariants[variant][1]),
        step(.22,'观察前半弯','看板头指向与实际移动方向的差别。'),
        step(.48,'观察两弯之间','减小旧刃角，双腿仍有调整空间。'),
        step(.74,'比较另一侧','两侧都完成计划弯形，保持可控速度。')]};
  });
  function isShort(config){return shortTypes.includes(config.type);}
  function shortVariant(config){return config.variant||(config.type==='short-turn-progression'?'side-slip':config.type==='short-turn-balance'?'centered':'round');}
  function shortRaw(config,u){
    const v=shortVariant(config),slip=['side-slip','side-slip-shorter','linked'].includes(v);
    if(slip){
      const n=Math.min(1,Math.floor(u*2)),q=u*2-n,s=n? -1:1;
      const hold=v==='side-slip'?.48:v==='side-slip-shorter'?.22:0;
      const a=smooth(clamp((q-hold)/(1-hold),0,1));
      return {x:s*.16*Math.sin(PI*a),y:u,a,n,q,hold,slip:true};
    }
    const medium=v==='medium-to-short',widen=v==='short-to-medium',cycles=v==='short-steady'?2:1;
    const phase=2*PI*(medium?1.15*u+1.15*u*u:widen?3.45*u-1.15*u*u:cycles*u);
    let wave=Math.sin(phase),amplitude=medium?lerp(.25,.095,u):widen?lerp(.095,.25,u):.18;
    if(v==='over-inclined')amplitude=.25;
    if(v==='asymmetric')amplitude*=wave>0?1:.52;
    if(['tail-brake','nose-pivot'].includes(v))wave=Math.asin(.985*wave)/Math.asin(.985);
    if(['edge-locked','back-seat'].includes(v)){
      const half=phase/PI,n=Math.floor(half),q=half-n;
      const delayed=q<.26?q*.28:.0728+(q-.26)/.74*.9272;
      wave=Math.sin((n+delayed)*PI);
    }
    return {x:amplitude*wave,y:u,phase,slip:false};
  }
  function prepareShort(config,width){
    const points=Array.from({length:401},(_,i)=>shortRaw(config,i/400));
    const distances=[0];
    points.slice(1).forEach((p,i)=>distances.push(distances[i]+Math.hypot((p.x-points[i].x)*width,(p.y-points[i].y)*184)));
    return {points,distances,total:distances[distances.length-1]};
  }
  function shortTime(config,t,width){
    const cache=config.shortCache;
    if(!cache||cache.width!==width)config.shortCache=Object.assign({width},prepareShort(config,width));
    const {distances,total}=config.shortCache,target=clamp(t,0,1)*total;
    let lo=0,hi=distances.length-1;
    while(hi-lo>1){const m=(lo+hi)>>1;if(distances[m]<target)lo=m;else hi=m;}
    return (lo+(target-distances[lo])/(distances[hi]-distances[lo]||1))/400;
  }
  function shortState(config,t,width){
    const u=shortTime(config,t,width),v=shortVariant(config),raw=shortRaw(config,u);
    const before=shortRaw(config,clamp(u-.0001,0,1)),after=shortRaw(config,clamp(u+.0001,0,1));
    const angle=Math.atan2((after.y-before.y)*184,(after.x-before.x)*width);
    let phase=raw.phase||0,edge,boardAngle,turn;
    if(raw.slip){
      // Keep the skidding edge uphill of the actual travel direction. The board
      // rotates from cross-slope through the fall line to the opposite side;
      // interpolating heading independently of the route could put the working
      // edge downhill and accidentally demonstrate an edge catch.
      boardAngle=clamp(angle-(raw.n?-1:1)*PI/2*Math.cos(PI*raw.a),0,PI);
      edge=(raw.n?1:-1)*18*Math.cos(PI*raw.a);
      turn=raw.q<raw.hold?'侧滑稳住':raw.a<.4?'减小旧刃角，进入单弯':raw.a<.65?'板头转向坡下':'另一刃逐渐接住';
      phase=(raw.n+raw.a)*PI;
    } else {
      edge=22*Math.sin(phase);
      const sign=Math.sign(Math.sin(phase))||1;
      let skew=rad(18*Math.sin(phase));
      if(['tail-brake','nose-pivot'].includes(v))skew=rad(48*sign*Math.pow(Math.abs(Math.sin(phase)),8));
      if(v==='shoulder-led')skew+=rad(14*Math.sin(phase+.6));
      if(['edge-locked','back-seat'].includes(v)){
        const delayed=Math.sin(phase-.28);
        edge=(v==='edge-locked'?35:23)*delayed;
        skew=rad(28*delayed);
      }
      boardAngle=angle+skew;
      const q=((phase/PI)%1+1)%1;
      turn=q<.18?'释放旧刃，准备新弯':q<.48?'双脚引导进入弯中':q<.78?'持续引导，控制滑移':'完成弯形，准备换向';
      if(v==='tail-brake')turn=q>.35&&q<.66?'突然横刹，雪痕变宽':'斜向下冲，缺少持续引导';
      if(v==='nose-pivot')turn=q>.35&&q<.66?'板头附近打转，板尾横扫':'持续压住前脚，等下一次甩尾';
      if(v==='shoulder-led')turn='肩膀先甩动，雪板急着跟转';
      if(v==='edge-locked')turn=q<.27?'旧刃没有及时释放':'拖延后急转，错过平顺换向';
      if(v==='back-seat')turn=q<.27?'后坐使入弯拖延':'旧弯拖长，再急着换向';
      if(v==='asymmetric')turn=Math.sin(phase)>0?'这一侧弯更宽':'这一侧弯更窄';
      if(v==='low-stuck')turn='一直蹲低，双腿难以再调整';
      if(v==='over-inclined')turn='身体内倒过多，板向弯外滑';
    }
    const bend=Math.abs(Math.sin(phase)),transition=config.transition||'extend';
    let h=transition==='extend'?102-17*bend:80+18*bend;
    if(raw.slip)h=94-8*Math.abs(Math.cos(PI*raw.a));
    if(v==='low-stuck')h=73+Math.sin(phase)*1.5;
    const relative=(PI/2-boardAngle)*180/PI;
    const pose=Object.assign({},base,{h,edge,hipY:edge*.64,shoulderY:edge*.35,
      hipYaw:clamp(relative*.22,-16,16),shoulderYaw:clamp(relative*.6,-42,42),fore:3*Math.sin(phase)});
    if(v==='shoulder-led'){
      pose.shoulderYaw=34*Math.sin(phase+.8);pose.hipYaw=16*Math.sin(phase+.3);
      pose.shoulderY+=14*Math.sin(phase+.8);pose.arms=.65;
    }
    if(v==='nose-pivot'){pose.fore=25;pose.torsoX=-4;pose.hipYaw=22*Math.sin(phase);}
    if(v==='back-seat'){pose.fore=-23;pose.torsoX=4;h=87;pose.h=87;}
    if(v==='over-inclined'){pose.hipY=edge*1.2;pose.shoulderY=edge*2;}
    if(transition==='retract'){
      pose.hipY=edge*1.6;pose.shoulderY=pose.hipY+3;pose.referenceHipHeight=90;
    }
    return {pose,pos:[width*.5+raw.x*width,60+184*u],angle,boardAngle,turn,u,phase,
      bad:['tail-brake','shoulder-led','edge-locked','asymmetric','low-stuck','over-inclined','nose-pivot','back-seat'].includes(v)};
  }
  const threePhaseMap={
    'center-low':[0,.25,.6],'center-high':[0,.2,.6],'fore-aft':[0,.16,.65],
    'toe-edge':[0,.24,.84],'heel-edge':[0,.24,.84],
    'pressure-flex':[0,.05,.38],'pressure-extend':[0,.06,.68],
    'inclination':[0,.15,.86],'j-turn':[0,.2,.8],
    'shoulder-coordination':[0,.16,.66],'mixed-rotation':[0,.34,.63]
  };
  function phaseMap(type,variant,count,preset) {
    if(count===3) {
      if(['front-center-back','front-return-toe'].includes(variant))return [0,.34,.67];
      if(variant==='rear-heel')return [0,.22,.67];
      if(variant==='arms-feedback')return [0,.22,.66];
      if(threePhaseMap[type])return threePhaseMap[type];
    }
    if(count===4&&variant==='hold')return [0,.17,.4,.81];
    if(count===4&&['lower-com','retraction-study'].includes(variant))return [0,.18,.46,.65];
    if(count===4&&type==='gaze-control')return [0,.14,.4,.84];
    if(count===4&&type==='dry-hamstring')return [0,.18,.64,.9];
    if(preset.steps.length===count)return preset.steps.map(s=>s.at);
    return Array.from({length:count},(_,i)=>i/count);
  }

  let sequence = 0;
  function installStyle() {
    if (document.getElementById('sd-library-style')) return;
    const style = document.createElement('style');
    style.id = 'sd-library-style';
    style.textContent = `
      .sd-demo{--sd-ink:var(--ink,#1b3446);--sd-muted:var(--muted-text,#596f80);--sd-bg:var(--surface,#f0f6fa);--sd-line:var(--line,#d4e1e9);--sd-blue:var(--accent,#177faa);--sd-hip:#d68843;--sd-person:#28638a;--sd-limb:#2b465a;--sd-board:#f8b35b;--sd-green:#368373;--sd-white:var(--paper,#fff);font-family:inherit;color:var(--sd-ink);margin:0;min-width:0}
      .sd-demo *{box-sizing:border-box}
      .sd-toolbar,.sd-controls,.sd-legend{display:flex;align-items:center;flex-wrap:wrap;gap:8px}
      .sd-toolbar{justify-content:space-between;margin:0 0 10px}
      .sd-demo .sd-title{font-size:15px;font-weight:600;margin:0;line-height:1.5}
      .sd-tabs{display:flex;flex-wrap:wrap;gap:4px}
      .sd-demo button,.sd-demo select{font:inherit;font-size:12px;line-height:1.4;min-height:33px;border:1px solid var(--sd-line);border-radius:7px;background:var(--sd-white);color:var(--sd-ink);padding:6px 9px;cursor:pointer}
      .sd-demo button[aria-pressed=true]{background:var(--sd-ink);color:var(--sd-white);border-color:var(--sd-ink)}
      .sd-demo button:focus-visible,.sd-demo input:focus-visible,.sd-demo select:focus-visible{outline:3px solid var(--sd-blue);outline-offset:2px}
      .sd-scene{display:block;width:100%;height:auto;background:var(--sd-bg);border-radius:10px;color:var(--sd-ink)}
      .sd-scene text{font-family:inherit;fill:var(--sd-ink);font-size:13px}
      .sd-scene .sd-muted{fill:var(--sd-muted);font-size:12px}
      .sd-scene .sd-small{font-size:11px}
      .sd-pressure-chart{display:block;width:100%;height:auto;margin:10px 0 0;color:var(--sd-ink)}
      .sd-pressure-chart text{font-family:inherit;fill:var(--sd-ink);font-size:12px}
      .sd-pressure-chart .sd-small{font-size:11px;fill:var(--sd-muted)}
      .sd-controls{margin:10px 0 6px}
      .sd-controls label{font-size:12px;display:flex;align-items:center;gap:5px}
      .sd-progress-label{display:flex;justify-content:space-between;gap:8px;font-size:12px;color:var(--sd-muted);margin-top:8px}
      .sd-demo input[type=range]{width:100%;display:block;accent-color:var(--sd-blue);margin:5px 0 8px;min-height:20px}
      .sd-phase{font-size:13px;line-height:1.65;min-height:65px;margin:0;color:var(--sd-ink)}
      .sd-phase strong{display:block;font-size:13px;color:var(--sd-ink)}
      .sd-steps{display:flex;flex-wrap:wrap;gap:5px;margin:8px 0}
      .sd-steps button{font-size:11px;min-height:30px;padding:5px 8px}
      .sd-legend{font-size:11px;color:var(--sd-muted);gap:5px 13px;margin:8px 0 4px;line-height:1.6}
      .sd-legend i{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:4px;vertical-align:middle}
      .sd-note{font-size:11px;line-height:1.65;color:var(--sd-muted);margin:5px 0 0}
      .sd-short-status{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin:8px 0;font-size:12px;line-height:1.6}
      .sd-short-status>span{padding:6px 9px;background:var(--sd-bg);border-radius:7px}
      .sd-short-status b{display:block;font-weight:600}.sd-leg-meter{display:block;height:5px;background:var(--sd-line);border-radius:4px;margin-top:5px;overflow:hidden}
      .sd-leg-meter i{display:block;height:100%;background:var(--sd-person)}
      .sd-play{min-width:59px}.sd-progress-value{font-variant-numeric:tabular-nums}
      @media(prefers-color-scheme:dark){.sd-demo{--sd-bg:var(--surface,#152b3a);--sd-ink:var(--ink,#e8f0f6);--sd-muted:var(--muted-text,#abc0ce);--sd-line:var(--line,#365267);--sd-white:var(--paper,#102330);--sd-person:#559bc4;--sd-limb:#98b9cd;--sd-green:#5eaf9d}}
      @media(max-width:480px){.sd-toolbar{display:block}.sd-tabs{margin-top:8px}.sd-demo button,.sd-demo select{min-height:36px}.sd-scene text{font-size:14px}.sd-scene .sd-small{font-size:12px}.sd-phase{min-height:85px}}
      @media(pointer:coarse){.sd-demo button,.sd-demo select{min-height:44px}.sd-demo input[type=range]{min-height:30px}}
    `;
    document.head.appendChild(style);
  }

  function sample(frames, t) {
    let a = frames[0], b = frames[frames.length - 1];
    for (let i = 1; i < frames.length; i++) {
      if (t <= frames[i].t) { a = frames[i - 1]; b = frames[i]; break; }
    }
    const f = smooth(clamp((t - a.t) / (b.t - a.t || 1), 0, 1));
    const pose = {};
    Object.keys(base).forEach(k => { pose[k] = lerp(a[k], b[k], f); });
    return pose;
  }
  function prepareFrames(frames) {
    return frames.map(f => Object.assign({}, base, f)).sort((a,b) => a.t - b.t);
  }
  function vadd(a,b) { return [a[0]+b[0],a[1]+b[1],a[2]+b[2]]; }
  function vsub(a,b) { return [a[0]-b[0],a[1]-b[1],a[2]-b[2]]; }
  function vmul(v,n) { return v.map(x => x*n); }
  function dot(a,b) { return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }
  function len(v) { return Math.sqrt(dot(v,v)); }
  function norm(v) { return vmul(v,1/(len(v)||1)); }

  // Two-bone inverse kinematics. Both feet stay fixed to the board.
  // The knee bends towards the boot's toe direction; leg lengths stay constant.
  function kneeFor(hip, ankle, bias,segment=60) {
    const delta = vsub(ankle, hip);
    const distance = clamp(len(delta), .01,segment*2-.01);
    const axis = norm(delta);
    const toe = [0,1,0];
    const perpendicular = norm(vsub(toe,vmul(axis,dot(toe,axis))));
    const bend = Math.sqrt(Math.max(0,segment*segment-distance*distance/4));
    return vadd(vadd(hip,vmul(delta,.5)),vmul(perpendicular,bend*bias));
  }
  function boardPoint(x,y,z,pose,lift) {
    const localEdge = pose.edge + pose.twist * x / 126;
    const angle = rad(localEdge);
    return [x, y*Math.cos(angle)+z*Math.sin(angle),
      lift + z*Math.cos(angle)-y*Math.sin(angle)];
  }
  function skeleton(pose,terrain,t,dry) {
    const rise = terrain === 'bump' ? 23*Math.pow(Math.sin(PI*t),8) : 0;
    const calfLift=dry==='calf'?18*(t<.35?smooth(t/.35):t<.62?1:1-smooth((t-.62)/.38)):0;
    const edgeLift=18*Math.max(Math.abs(Math.sin(rad(pose.edge+pose.twist))),Math.abs(Math.sin(rad(pose.edge-pose.twist))));
    const lift = dry?calfLift:edgeLift + rise + 2;
    const footX=dry?32:53;
    const hips = [];
    const ankles = [];
    const knees = [];
    const shoulders = [];
    const elbows = [];
    const hands = [];
    // A single mapping keeps every snow pose's leg segments equal and separates
    // a comfortably flexed reference from lower and higher positions.
    // Keep an IK reach margin: the tallest pose still has usable knee flexion.
    const segment=dry?53:50;
    // A fixed snow-world height illustrates the optional retraction mechanism.
    // Board/feet still share exactly the same roll, lift and lateral translation;
    // IK solves both legs with the same segment lengths as every other snow pose.
    const drawingHeight=dry?pose.h:Number.isFinite(pose.referenceHipHeight)?
      pose.referenceHipHeight-lift:83.5+.5*(clamp(pose.h,73,106)-73);
    const hipCenter = [pose.fore,pose.hipY,drawingHeight+lift];
    if(!dry) {
      const reach=97.5;
      [-1,1].forEach(sign=>{
        const hy=rad(pose.hipYaw);
        const hx=pose.fore+sign*18*Math.cos(hy),hyPos=pose.hipY+sign*18*Math.sin(hy);
        const a=boardPoint(sign*footX,0,8,pose,lift);
        const dx=hx-a[0],dy=hyPos-a[1];
        hipCenter[2]=Math.min(hipCenter[2],a[2]+Math.sqrt(Math.max(1,reach*reach-dx*dx-dy*dy)));
      });
    }
    const shoulderCenter = [pose.fore+pose.torsoX,pose.shoulderY,hipCenter[2]+57];
    [-1,1].forEach(sign => {
      const hy = rad(pose.hipYaw), sy = rad(pose.shoulderYaw);
      const hip = vadd(hipCenter,[sign*18*Math.cos(hy),sign*18*Math.sin(hy),0]);
      const ankle = boardPoint(sign*footX,0,8,pose,lift);
      const shoulder = vadd(shoulderCenter,[sign*28*Math.cos(sy),sign*28*Math.sin(sy),0]);
      hips.push(hip); ankles.push(ankle); knees.push(kneeFor(hip,ankle,pose.kneeBias,segment));
      shoulders.push(shoulder);
      elbows.push(vadd(shoulder,[sign*lerp(16,26,pose.arms),6,lerp(-28,-7,pose.arms)]));
      hands.push(vadd(shoulder,[sign*lerp(19,49,pose.arms),lerp(18,6,pose.arms),lerp(-48,-17,pose.arms)]));
    });
    if(dry==='wall') {
      shoulders.forEach((shoulder,i)=>{
        const sign=i===0?-1:1;
        elbows[i]=vadd(shoulder,[sign*6,26,-12]);
        hands[i]=[shoulder[0]+sign*4,75,shoulder[2]-8];
      });
    }
    if(dry==='shoulder') {
      const angle=t<.5?4*PI*t:4*PI*(1-t);
      shoulders.forEach((p,i)=>{
        const sign=i===0?-1:1;
        const delta=[0,3*Math.cos(angle),3*Math.sin(angle)];
        shoulders[i]=vadd(p,delta);
        elbows[i]=vadd(vadd(p,[sign*7,3,-31]),delta);
        hands[i]=vadd(vadd(p,[sign*9,3,-67]),delta);
      });
    }
    const neck = vadd(shoulderCenter,[0,0,12]);
    const head = vadd(neck,[0,0,16]);
    const com = [lerp(hipCenter[0],shoulderCenter[0],.25),
      lerp(hipCenter[1],shoulderCenter[1],.25),hipCenter[2]+12];
    return {rise,lift,footX,hipCenter,shoulderCenter,hips,ankles,knees,shoulders,elbows,hands,neck,head,com};
  }
  const pt = p => `${round(p[0])},${round(p[1])}`;
  const poly = points => points.map(pt).join(' ');
  function sceneBody(pose,t,config,view,stance,id,width) {
    const sk = skeleton(pose,config.terrain,t,config.dry);
    const mirror = stance === 'goofy' ? -1 : 1;
    const center = width / 2;
    const floor = 255;
    const span=config.variant==='retraction-study'&&view==='body'?359:285;
    const scale = Math.min(1.14,(width-38)/span);
    const under= (config.transitionReference==='snow'&&config.variant!=='lower-com'&&
      ['edge-change-down','retraction-turns','knee-edge-change'].includes(config.type))||
      (isShort(config)&&config.transition==='retract');
    const boardShift=under?-pose.hipY:0;
    const project = ([x,y,z]) => {
      y+=boardShift;
      if (view === 'width') return [center + (y*1.7+x*.13)*scale, floor-z*.98];
      if (view === 'length') return [center+x*mirror*scale, floor-z*.98-y*.06];
      return [center+(x*mirror+y*.66)*scale, floor+y*.34-x*mirror*.10-z*.93];
    };
    let out = '';
    const line = (a,b,color,stroke=2,extra='') => `<line x1="${round(a[0])}" y1="${round(a[1])}" x2="${round(b[0])}" y2="${round(b[1])}" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" ${extra}/>`;
    const circle = (a,r,color,extra='') => `<circle cx="${round(a[0])}" cy="${round(a[1])}" r="${r}" fill="${color}" ${extra}/>`;
    const text = (x,y,str,cls='',anchor='start') => `<text x="${round(x)}" y="${round(y)}" class="${cls}" text-anchor="${anchor}">${esc(str)}</text>`;
    out += `<defs><pattern id="${id}-snow" width="40" height="24" patternUnits="userSpaceOnUse"><path d="M 4 17 l 8 -2 M 28 5 l 5 -1" stroke="var(--sd-line)" stroke-width="1" opacity=".65"/></pattern><marker id="${id}-motion" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 Z" fill="var(--sd-blue)"/></marker></defs>`;
    if(config.transitionReference==='snow'&&view==='width')
      out+=line([center,67],[center,262],'var(--sd-line)',1,'stroke-dasharray="3 5"');
    if(!config.dry)out += `<rect x="0" y="244" width="${width}" height="57" fill="url(#${id}-snow)"/>`;
    if(config.dry) {
      const ground=[[-105,-28,0],[105,-28,0],[105,47,0],[-105,47,0]].map(project);
      out+=`<polygon points="${poly(ground)}" fill="var(--sd-line)" fill-opacity=".2" stroke="var(--sd-line)" stroke-width="1"/>`;
    } else out += line([18,270],[width-18,270],'var(--sd-line)',1);
    if(config.dry==='wall') {
      const wall=[[-72,75,0],[72,75,0],[72,75,180],[-72,75,180]].map(project);
      out+=`<polygon points="${poly(wall)}" fill="var(--sd-line)" fill-opacity=".35" stroke="var(--sd-line)" stroke-width="2"/>`;
    }
    if (config.terrain === 'bump') {
      const bumpX = center + 60 - t*120;
      out += `<path d="M ${bumpX-50} 264 Q ${bumpX} 208 ${bumpX+50} 264" fill="none" stroke="var(--sd-line)" stroke-width="3"/>`;
      out += text(14,30,'小起伏吸收 · 腿长随雪面变化','sd-muted');
    }
    const boardCoords = [[-130,-15,0],[-122,-19,0],[122,-19,0],[130,-15,0],
      [136,0,0],[130,15,0],[122,19,0],[-122,19,0],[-130,15,0],[-136,0,0]];
    const board = boardCoords.map(([x,y,z]) => project(boardPoint(x,y,z,pose,sk.lift)));
    if(!config.dry)out += `<polygon points="${poly(board)}" fill="var(--sd-board)" fill-opacity=".84" stroke="var(--sd-limb)" stroke-width="2"/>`;
    const toeEdge = [-1,1].map(sign => project(boardPoint(sign*122,19,0,pose,sk.lift)));
    const heelEdge = [-1,1].map(sign => project(boardPoint(sign*122,-19,0,pose,sk.lift)));
    if (!config.dry&&Math.abs(pose.edge)>2) out += line(...(pose.edge>0?toeEdge:heelEdge),'var(--sd-blue)',4);
    if(!config.dry&&Math.abs(pose.twist)>2) {
      [-1,1].forEach(sign=>{
        const e=pose.edge+pose.twist*sign;
        const y=e>0?19:-19;
        out+=line(project(boardPoint(sign*15,y,0,pose,sk.lift)),
          project(boardPoint(sign*122,y,0,pose,sk.lift)),'var(--sd-blue)',3);
      });
    }
    const front = project(boardPoint(105,0,0,pose,sk.lift));
    const back = project(boardPoint(-105,0,0,pose,sk.lift));
    const maxLabelY = 290;
    if(config.dry) {
      out+=text(center,288,config.dry==='calf'?'离雪提踵 · 不是前刃滑行站姿':
        config.dry==='shoulder'?'一般活动热身 · 小幅绕肩，不抡臂':'离雪练习 · 全脚掌与地面的关系','sd-small','middle');
    } else if (view !== 'width') {
      out += text(clamp(front[0],55,width-55),maxLabelY,config.switch?'原前脚 / 当前后脚':'板头 / 前脚侧','sd-small','middle');
      out += text(clamp(back[0],55,width-55),maxLabelY,config.switch?'原后脚 / 当前前脚':'板尾 / 后脚侧','sd-small','middle');
    } else {
      const labelOffset=Math.min(96,(width-114)/2);
      out += text(center-labelOffset,288,'脚跟侧 / 后刃','sd-small','middle');
      out += text(center+labelOffset,288,'脚尖侧 / 前刃','sd-small','middle');
    }
    // Draw the farther leg first to preserve the two-legged human shape.
    const order = stance === 'goofy' && view !== 'width' ? [1,0] : [0,1];
    order.forEach((i,index) => {
      const hip = project(sk.hips[i]), knee = project(sk.knees[i]), ankle = project(sk.ankles[i]);
      out += line(hip,knee,'var(--sd-limb)',index?13:11,`opacity="${index?1:.78}"`);
      out += line(knee,ankle,'var(--sd-limb)',index?11:9,`opacity="${index?1:.78}"`);
      out += circle(knee,4,'var(--sd-white)',`stroke="var(--sd-limb)" stroke-width="1.5"`);
      if(config.jointLabels)out+=circle(ankle,3.8,'var(--sd-white)',`stroke="var(--sd-blue)" stroke-width="1.3"`);
      const x = i===0?-sk.footX:sk.footX;
      const toeBoot = project(boardPoint(x,13,config.dry==='calf'?5-sk.lift:6,pose,sk.lift));
      const heelBoot = project(boardPoint(x,-8,6,pose,sk.lift));
      out += line(heelBoot,toeBoot,'var(--sd-limb)',12);
      out += line(ankle,project(boardPoint(x,1,21,pose,sk.lift)),'var(--sd-limb)',9);
      if(!config.dry)out += `<rect x="${round(ankle[0]-6)}" y="${round(ankle[1]+2)}" width="12" height="3" rx="1" fill="var(--sd-hip)"/>`;
    });
    const torso = [sk.hips[0],sk.hips[1],sk.shoulders[1],sk.shoulders[0]].map(project);
    out += `<polygon points="${poly(torso)}" fill="var(--sd-person)" stroke="var(--sd-person)" stroke-width="5" stroke-linejoin="round"/>`;
    out += line(project(sk.hips[0]),project(sk.hips[1]),'var(--sd-hip)',8);
    order.forEach(i => {
      out += line(project(sk.shoulders[i]),project(sk.elbows[i]),'var(--sd-person)',10);
      out += line(project(sk.elbows[i]),project(sk.hands[i]),'var(--sd-person)',8);
      out += circle(project(sk.hands[i]),5,'var(--sd-hip)');
    });
    out += line(project(sk.shoulderCenter),project(sk.neck),'var(--sd-person)',12);
    const head = project(sk.head);
    out += circle(head,14,'var(--sd-hip)');
    out += `<path d="M ${head[0]-14} ${head[1]+1} A 14 14 0 0 1 ${head[0]+14} ${head[1]+1}" fill="var(--sd-person)" stroke="var(--sd-person)" stroke-width="4"/>`;
    const goggle = project(vadd(sk.head,[12*Math.sin(rad(pose.look)),8*Math.cos(rad(pose.look)),0]));
    out += `<rect x="${round(goggle[0]-9)}" y="${round(goggle[1]-3)}" width="17" height="6" rx="3" fill="var(--sd-limb)"/>`;
    const com = project(sk.com), ground = project([sk.com[0],sk.com[1],sk.rise]);
    out += line(com,ground,'var(--sd-green)',1.3,'stroke-dasharray="4 4" opacity=".8"');
    out += `<path d="M ${com[0]} ${com[1]-5} l 5 5 l -5 5 l -5 -5 z" fill="var(--sd-green)" stroke="var(--sd-white)" stroke-width="1.5"/>`;
    out += circle(ground,3,'var(--sd-green)');
    if (view==='length') {
      const hip = project(sk.hipCenter);
      out += text(16,31,config.studyFlat?'平板参考 · 看髋高度变化':'沿板长观察前后位置','sd-muted');
      if(Math.abs(pose.fore)>2) out += line([center,hip[1]-14],[hip[0],hip[1]-14],
        'var(--sd-blue)',2,`marker-end="url(#${id}-motion)"`);
      out += text(width-14,31,config.studyFlat?'上下屈伸':'髋的运动方向','sd-small','end');
    } else if(view==='width') {
      out += text(14,30,config.studyFlat?'平板参考 · 上下屈伸与关节协调':
        config.variant==='lower-com'?'重心向板降低 · 看竖向路径':
        config.variant==='retraction-study'?'回收过渡 · 板从身体下方通过':
        config.transitionReference==='snow'?'雪面固定参考 · 看身体与板的路径':'从板头方向看 · 横向关节关系','sd-muted');
      out += text(width-14,52,Math.abs(pose.edge)<3?'接近平板':pose.edge>0?'当前：前刃':'当前：后刃','sd-small','end');
    } else if(!config.terrain) {
      out += text(14,30,config.studyFlat?'平板直线参考 · 上下屈伸':config.dry?'地面关节示意 · 膝髋踝协调':'立体关节示意 · 脚固定在雪板','sd-muted');
    }
    if(config.type==='gaze-control')out+=text(width-14,52,'观察雪镜朝向 · 肩髋不过量旋转','sd-small','end');
    if(config.jointLabels&&['body','width'].includes(view)) {
      const joints=[['肩',sk.shoulderCenter],['髋',sk.hipCenter],['膝',sk.knees[1]],['踝',sk.ankles[1]]];
      let previous=64;
      joints.forEach(([label,p])=>{
        const point=project(p),y=clamp(Math.max(previous+20,point[1]),78,251);
        previous=y;
        out+=line(point,[width-42,y-4],'var(--sd-muted)',.8,'opacity=".65"');
        out+=text(width-15,y,label,'sd-small','end');
      });
    }
    return out;
  }

  function sceneDry(pose,t,config,width) {
    if(['squat','calf','wall','shoulder'].includes(config.dry))return null;
    const scale=Math.min(1.06,(width-36)/280);
    const cx=width*.48,floor=253;
    const project=([x,z])=>[cx+x*scale,floor-z*scale];
    const line=(a,b,color,stroke=2,extra='')=>{
      a=project(a);b=project(b);
      return `<line x1="${round(a[0])}" y1="${round(a[1])}" x2="${round(b[0])}" y2="${round(b[1])}" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" ${extra}/>`;
    };
    const circle=(a,r,color,extra='')=>{a=project(a);return `<circle cx="${round(a[0])}" cy="${round(a[1])}" r="${r}" fill="${color}" ${extra}/>`;};
    const offset=(p,n)=>[p[0]+n,p[1]+n*.18];
    const pair=(h,a,L=62)=>{
      const dx=a[0]-h[0],dz=a[1]-h[1],d=Math.sqrt(dx*dx+dz*dz);
      const bend=Math.sqrt(Math.max(0,L*L-Math.min(d,2*L-.01)**2/4));
      return [(h[0]+a[0])/2-dz/d*bend,(h[1]+a[1])/2+dx/d*bend];
    };
    let hip,shoulder,neck,head,legs,arms,caption;
    const q=clamp(pose.h,0,1);
    let out=`<text x="14" y="28" class="sd-muted">离雪动作 · 侧面关节示意</text>`;
    out+=`<rect x="16" y="${floor}" width="${width-32}" height="9" rx="4" fill="var(--sd-line)"/>`;
    if(config.dry==='plank') {
      // Move from a supported preparation into the hold, then return to the mat.
      // Animation time is intentionally not a training-duration prescription.
      const hold=clamp((pose.h-10)/48,0,1);
      hip=[-7,lerp(30,52,hold)];shoulder=[70,77];
      const slope=(shoulder[1]-hip[1])/(shoulder[0]-hip[0]);
      neck=[91,77+21*slope];head=[109,77+39*slope];
      legs=[{knee:[lerp(-50,-65,hold),lerp(6,35,hold)],ankle:[lerp(-103,-128,hold),lerp(22,15,hold)]},
        {knee:[lerp(-46,-61,hold),lerp(7,36,hold)],ankle:[lerp(-99,-124,hold),lerp(23,16,hold)]}];
      arms=[{elbow:[70,7],hand:[108,7]},{elbow:[65,9],hand:[103,9]}];
      caption='肘在肩下 · 不塌腰、不撅臀 · 正常呼吸';
      if(hold>.92)out+=line([-128,15],[108,86],'var(--sd-green)',1,'stroke-dasharray="4 4" opacity=".7"');
      out+=`<text x="${width-16}" y="53" class="sd-small" text-anchor="end">呼吸 / 保持${'.'.repeat(1+Math.floor(t*12)%3)}</text>`;
    } else if(config.dry==='ankle') {
      const hx=2+q*12,hz=Math.sqrt(126*126-(hx+72)*(hx+72))+7;
      hip=[hx,hz];shoulder=[hx+20,hz+56];neck=[hx+20,hz+71];head=[hx+20,hz+87];
      const back=[-72,7],front=[59,7];
      legs=[{knee:[(hip[0]+back[0])/2,(hip[1]+back[1])/2],ankle:back},
        {knee:pair(hip,front),ankle:front}];
      arms=[{elbow:[70,134],hand:[114,144]},{elbow:[66,132],hand:[114,140]}];
      caption='前膝适度屈曲 · 后脚跟不抬 · 不强压';
      out+=line([119,0],[119,215],'var(--sd-line)',9);
      out+=line([-77,2],[-45,2],'var(--sd-green)',3);
      out+=`<text x="${project([-63,0])[0]}" y="${floor+32}" class="sd-small" text-anchor="middle">后脚全掌着地</text>`;
    } else if(config.dry==='hip') {
      hip=[-5+q*9,66];shoulder=[-5+q*9,125];neck=[-5+q*9,140];head=[-5+q*9,156];
      const front=[73,7];
      legs=[{knee:[-37,7],ankle:[-93,7]}, {knee:pair(hip,front,63),ankle:front}];
      arms=[{elbow:[32+q*4,94],hand:[52,80]},{elbow:[24+q*4,93],hand:[49,77]}];
      caption='轻收骨盆 / 夹臀 · 躯干直立 · 小幅前移';
      const pad=project([-48,0]);
      out+=`<rect x="${pad[0]}" y="${floor-2}" width="32" height="8" rx="4" fill="var(--sd-blue)" fill-opacity=".35"/>`;
    } else {
      hip=[-4,20];shoulder=[65,20];neck=[87,21];head=[105,24];
      const knee=[27,87],a=rad(8+q*58);
      legs=[{knee:[-61,15],ankle:[-119,10]},
        {knee,ankle:[knee[0]+61*Math.cos(a),knee[1]+61*Math.sin(a)]}];
      arms=[{elbow:[57,59],hand:[24,67]},{elbow:[52,54],hand:[21,64]}];
      caption='仰卧托住大腿后侧 · 慢伸膝再屈膝 · 舒适范围';
    }
    legs.forEach((leg,i)=>{
      const h=offset(hip,i===0?-3:3),k=offset(leg.knee,i===0?-3:3),a=offset(leg.ankle,i===0?-3:3);
      out+=line(h,k,'var(--sd-limb)',i?11:9,`opacity="${i?1:.7}"`);
      out+=line(k,a,'var(--sd-limb)',i?9:7,`opacity="${i?1:.7}"`);
      out+=circle(k,3.7,'var(--sd-white)',`stroke="var(--sd-limb)" stroke-width="1.2"`);
      if(config.dry==='plank')out+=line(a,[a[0]-6,3],'var(--sd-limb)',8);
      else if(config.dry==='hamstring'&&i===1)out+=line(a,[a[0]+12,a[1]-8],'var(--sd-limb)',8);
      else out+=line([a[0]-8,a[1]-2],[a[0]+15,a[1]-2],'var(--sd-limb)',8);
    });
    out+=line(hip,shoulder,'var(--sd-person)',config.dry==='plank'?22+.8*Math.sin(6*PI*t):22);
    const dx=shoulder[0]-hip[0],dz=shoulder[1]-hip[1],d=Math.sqrt(dx*dx+dz*dz);
    if(config.dry==='hip') {
      const tilt=rad(8*q);
      out+=line([hip[0]-10*Math.cos(tilt),hip[1]-10*Math.sin(tilt)],
        [hip[0]+10*Math.cos(tilt),hip[1]+10*Math.sin(tilt)],'var(--sd-hip)',6);
    } else out+=line([hip[0]-dz/d*10,hip[1]+dx/d*10],[hip[0]+dz/d*10,hip[1]-dx/d*10],'var(--sd-hip)',6);
    arms.forEach((arm,i)=>{
      const s=offset(shoulder,i?-3:2);
      out+=line(s,arm.elbow,'var(--sd-person)',8);
      out+=line(arm.elbow,arm.hand,'var(--sd-person)',7);
      out+=circle(arm.hand,4.5,'var(--sd-hip)');
    });
    out+=line(shoulder,neck,'var(--sd-person)',10);
    out+=circle(head,13,'var(--sd-hip)');
    const h=project(head);
    out+=`<path d="M ${h[0]-12} ${h[1]-1} A 13 13 0 0 1 ${h[0]+11} ${h[1]-3}" fill="var(--sd-person)" stroke="var(--sd-person)" stroke-width="3"/>`;
    const max=Math.floor((width-28)/12);
    const chars=Array.from(caption);
    const captions=chars.length>max?[chars.slice(0,max).join(''),chars.slice(max).join('')]:[caption];
    captions.forEach((s,i)=>{out+=`<text x="${width/2}" y="${captions.length===1?290:278+i*16}" text-anchor="middle" class="sd-small">${esc(s)}</text>`;});
    return out;
  }

  function trackPoint(type,t,width,side='toe',shape) {
    const cx=width*.5;
    const sign=side==='heel'?-1:1;
    if(type==='garland') return [side==='heel'?width*.14+width*.6*t:width*.74-width*.6*t,
      65+150*t+10*(1-Math.cos(4*PI*t))];
    if(type==='j-turn'||type==='single-arc') {
      const begin=side==='heel'?width*.34:width*.66;
      const direction=side==='heel'?1:-1;
      if(type==='j-turn'&&t<.22) return [begin,60+165*t];
      const a=(type==='j-turn'?(t-.22)/.78:t)*PI/2;
      return [begin+direction*width*.32*(1-Math.cos(a)),
        (type==='j-turn'?96:60)+(type==='j-turn'?130:174)*Math.sin(a)];
    }
    if(type==='transition')return [cx+sign*width*.18*Math.cos(PI*t),60+184*t];
    if(type==='retraction')return [cx+sign*width*.18*Math.cos(2*PI*t),60+184*t];
    if(type==='rail'||type==='linked-skid') {
      const amplitude=shape==='open'?.045:shape==='closed'?.29:.18;
      return [cx+sign*width*amplitude*Math.sin(2*PI*t),60+184*t];
    }
    return [cx,60+184*t];
  }
  function trackAngle(type,t,width,side,shape) {
    const a=trackPoint(type,clamp(t-.0005,0,1),width,side,shape);
    const b=trackPoint(type,clamp(t+.0005,0,1),width,side,shape);
    return Math.atan2(b[1]-a[1],b[0]-a[0]);
  }
  function sceneTrack(pose,t,config,stance,id,width,side) {
    const mirror=stance==='goofy'?-1:1;
    const route=config.path||'straight';
    const short=isShort(config),state=short?shortState(config,t,width):null;
    const at=p=>short?shortState(config,p,width).pos:trackPoint(route,p,width,side,config.turnShape);
    const map=([x,y])=>[mirror===-1?width-x:x,y];
    const pts=Array.from({length:101},(_,i)=>map(at(i/100)));
    const full=pts.map((p,i)=>`${i?'L':'M'} ${pt(p)}`).join(' ');
    const count=Math.max(2,Math.round(t*100)+1);
    const passed=pts.slice(0,count).map((p,i)=>`${i?'L':'M'} ${pt(p)}`).join(' ');
    const pos=map(at(t));
    let angle=short?state.angle:trackAngle(route,t,width,side,config.turnShape);
    if(mirror===-1) angle=PI-angle;
    const skidding=config.type==='steering'||route==='linked-skid'||route==='garland'||config.skid;
    const pivotAmplitude=config.trackDiagnostics?22:13;
    const skew=config.type==='steering'||route==='linked-skid' ? rad(pivotAmplitude*Math.sin(2*PI*t))*mirror :
      config.skid&&config.type==='retraction-turns'?rad(18*Math.cos(2*PI*t))*mirror:
      config.skid&&['j-turn','single-arc'].includes(route)?rad(clamp(pose.edge*.7,-18,18))*mirror:
      config.skid?rad(pose.hipYaw)*mirror:0;
    const boardAngle=short?(mirror===-1?PI-state.boardAngle:state.boardAngle):angle+skew+(config.switch?PI:0);
    const scale=short?.73:1;
    const basis=(u,v)=>[pos[0]+scale*(u*Math.cos(boardAngle)-mirror*v*Math.sin(boardAngle)),
      pos[1]+scale*(u*Math.sin(boardAngle)+mirror*v*Math.cos(boardAngle))];
    const line=(a,b,color,stroke=2,extra='')=>`<line x1="${round(a[0])}" y1="${round(a[1])}" x2="${round(b[0])}" y2="${round(b[1])}" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" ${extra}/>`;
    let out=`<defs><marker id="${id}-down" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 Z" fill="var(--sd-muted)"/></marker><marker id="${id}-travel" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 Z" fill="var(--sd-green)"/></marker></defs>`;
    out+=`<text x="14" y="24" class="sd-muted">${short&&state.bad?'问题对照 · 观察后回到正确示范':'俯视 · 路线 / 朝向 / 雪痕'}</text>`;
    out+=line([width-30,43],[width-30,95],'var(--sd-muted)',1.4,`marker-end="url(#${id}-down)"`);
    out+=`<text x="${width-38}" y="112" class="sd-small" text-anchor="end">落线 ↓</text>`;
    out+=`<path d="${full}" fill="none" stroke="var(--sd-line)" stroke-width="2" stroke-dasharray="4 5"/>`;
    if(short)out+=`<path d="${full}" fill="none" stroke="var(--sd-blue)" stroke-opacity=".08" stroke-width="18" stroke-linecap="round"/>`;
    if(skidding) {
      if(short&&['tail-brake','nose-pivot'].includes(shortVariant(config))){
        // A diagnostic sketch: the swath grows at the abrupt board pivot. A
        // uniform wide swath would hide the very fault this comparison teaches.
        pts.slice(1,count).forEach((p,i)=>{
          const st=shortState(config,(i+.5)/100,width);
          const band=5+24*Math.pow(Math.abs(Math.sin(st.phase)),8);
          out+=line(pts[i],p,'var(--sd-blue)',round(band),'opacity=".20"');
        });
      }else out+=`<path d="${passed}" fill="none" stroke="var(--sd-blue)" stroke-opacity=".20" stroke-width="18" stroke-linecap="round"/>`;
      out+=`<path d="${passed}" fill="none" stroke="var(--sd-blue)" stroke-width="1.8"/>`;
    } else {
      out+=`<path d="${passed}" fill="none" stroke="var(--sd-blue)" stroke-width="3" stroke-linecap="round"/>`;
    }
    if(short){
      const bodyPath=Array.from({length:101},(_,i)=>{
        const st=shortState(config,i/100,width),p=st.pose,a=st.boardAngle;
        return map([st.pos[0]+scale*(p.fore*.12*Math.cos(a)-p.shoulderY*.22*Math.sin(a)),
          st.pos[1]+scale*(p.fore*.12*Math.sin(a)+p.shoulderY*.22*Math.cos(a))]);
      }).map((p,i)=>`${i?'L':'M'} ${pt(p)}`).join(' ');
      out+=`<path data-short-body-path d="${bodyPath}" fill="none" stroke="var(--sd-green)" stroke-width="1.7" stroke-dasharray="2 4"/>`;
    }
    const corners=[[-33,-8],[27,-8],[34,-4],[34,4],[27,8],[-33,8],[-37,0]].map(p=>basis(...p));
    out+=`<polygon data-sd-board points="${poly(corners)}" fill="var(--sd-board)" stroke="var(--sd-limb)" stroke-width="1.8"/>`;
    const currentSide=pose.edge>2?8:pose.edge<-2?-8:0;
    if(currentSide) out+=line(basis(-29,currentSide),basis(27,currentSide),'var(--sd-blue)',3,'data-sd-active-edge');
    [-1,1].forEach(sign=> {
      const ankle=basis(sign*14,0);
      out+=line(basis(sign*14,-4),basis(sign*14,6),'var(--sd-limb)',5);
      const hy=rad(pose.hipYaw), sy=rad(pose.shoulderYaw);
      const hip=basis(pose.fore*.12+sign*9*Math.cos(hy),pose.hipY*.18+sign*9*Math.sin(hy));
      const knee=basis(sign*12,pose.hipY*.13+6);
      out+=line(ankle,knee,'var(--sd-limb)',4);
      out+=line(knee,hip,'var(--sd-limb)',4);
      const shoulder=basis(pose.fore*.12+sign*15*Math.cos(sy),pose.shoulderY*.22+sign*15*Math.sin(sy));
      out+=line(hip,shoulder,'var(--sd-person)',5);
      out+=line(shoulder,basis(sign*lerp(20,35,pose.arms),pose.shoulderY*.22+lerp(9,5,pose.arms)),'var(--sd-person)',4);
    });
    const hy=rad(pose.hipYaw), sy=rad(pose.shoulderYaw);
    out+=line(basis(pose.fore*.12-9*Math.cos(hy),pose.hipY*.18-9*Math.sin(hy)),
      basis(pose.fore*.12+9*Math.cos(hy),pose.hipY*.18+9*Math.sin(hy)),'var(--sd-hip)',4);
    out+=line(basis(pose.fore*.12-15*Math.cos(sy),pose.shoulderY*.22-15*Math.sin(sy)),
      basis(pose.fore*.12+15*Math.cos(sy),pose.shoulderY*.22+15*Math.sin(sy)),'var(--sd-person)',5);
    const head=basis(pose.fore*.12,pose.shoulderY*.22);
    out+=`<circle cx="${round(head[0])}" cy="${round(head[1])}" r="6.5" fill="var(--sd-person)" stroke="var(--sd-white)" stroke-width="1"/>`;
    out+=line(head,basis(pose.fore*.12+7*Math.sin(rad(pose.look)),
      pose.shoulderY*.22+7*Math.cos(rad(pose.look))),'var(--sd-white)',2);
    out+=line(basis(29,0),basis(36,0),'var(--sd-limb)',2);
    if(config.type==='short-turn-balance'){
      const pivot=basis(config.variant==='nose-pivot'?18:config.variant==='back-seat'?-18:0,0);
      out+=`<circle data-short-pivot cx="${round(pivot[0])}" cy="${round(pivot[1])}" r="6" fill="none" stroke="var(--sd-hip)" stroke-width="2"/>`;
    }
    if(config.trackDiagnostics) {
      const vx=Math.cos(angle),vy=Math.sin(angle);
      let length=58;
      if(vy>0)length=Math.min(length,(263-pos[1])/vy);
      if(vx>0)length=Math.min(length,(width-18-pos[0])/vx);
      if(vx<0)length=Math.min(length,(pos[0]-18)/(-vx));
      const travel=[pos[0]+length*vx,pos[1]+length*vy];
      out+=line(pos,travel,'var(--sd-green)',2,`data-sd-travel-arrow marker-end="url(#${id}-travel)"`);
      out+=line(basis(-34,0),basis(35,0),'var(--sd-limb)',1.5,'data-sd-board-axis stroke-dasharray="3 3"');
    }
    let footnote=route==='garland'?'同一刃可控引导 · 接近落线后回横坡':
      skidding?'宽色带：可控搓雪示意；不代表实际搓雪量':
      route==='rail'?'细窄线：板尾跟随板头的刃滑轨迹':
      route==='j-turn'||route==='single-arc'?'单刃圆弧转向横坡；轨迹与速度为示意':
      route==='transition'?'两弯间过渡：旧刃弧线 → 回到居中位置 → 新刃弧线':
      route==='retraction'?'连续弯：弯内伸展、过渡回收；轨迹为示意':'直滑示意：本视图只帮助确认板头方向';
    if(config.switch)footnote='反脚：原后脚在滑行方向前方 · 双脚未交换位置';
    if(config.studyFlat)footnote='平板直线参考 · 此处只观察上下屈伸';
    if(config.turnShape)footnote=config.turnShape==='open'?'开放弯：末段更朝落线；此图不计算速度':'更闭合的弯：末段更多转向横坡；此图不计算速度';
    if(short)footnote='浅色带：完整计划路线；绿色虚线：上身中心';
    const limit=Math.max(17,Math.floor((width-28)/12));
    const caption=Array.from(footnote);
    const lines=caption.length>limit?[caption.slice(0,limit).join(''),caption.slice(limit).join('')]:[footnote];
    lines.forEach((s,i)=>{out+=`<text x="${width/2}" y="${lines.length===1?291:278+i*16}" class="sd-small" text-anchor="middle">${esc(s)}</text>`;});
    return out;
  }

  function scenePressure(getPose,t,config,width) {
    const extending=config.type==='pressure-extend';
    const end=extending?.32:.38,mid=end/2,hold=.65;
    const stages=[
      {from:0,to:mid,name:'加速',effect:extending?'趋增':'趋减',color:'var(--sd-blue)'},
      {from:mid,to:end,name:'减速',effect:extending?'趋减':'趋增',color:'var(--sd-hip)'},
      {from:end,to:hold,name:'保持',effect:'回原水平',color:'var(--sd-green)'},
      {from:hold,to:1,name:'恢复',effect:'未计算',color:'var(--sd-muted)'}
    ];
    const left=55,right=width-12,span=right-left;
    const values=Array.from({length:81},(_,i)=>{
      const pose=getPose(i/80),sk=skeleton(pose,config.terrain,i/80);
      return sk.hipCenter[2]-sk.lift;
    });
    const min=Math.min(...values),max=Math.max(...values);
    const y=v=>77-(v-min)/(max-min||1)*37;
    const path=values.map((v,i)=>`${i?'L':'M'} ${round(left+span*i/80)},${round(y(v))}`).join(' ');
    const pointPose=getPose(t),pointSk=skeleton(pointPose,config.terrain,t);
    const x=left+span*t,pointY=y(pointSk.hipCenter[2]-pointSk.lift);
    let out=`<text x="8" y="18">${extending?'伸展':'屈曲'}：动作阶段与接触压力</text>
      <text x="8" y="44" class="sd-small">髋较高</text><text x="8" y="79" class="sd-small">髋较低</text>
      <path d="M ${left} 82 H ${right}" fill="none" stroke="var(--sd-line)" stroke-width="1"/>
      <path d="${path}" fill="none" stroke="var(--sd-person)" stroke-width="2.5"/>
      <text x="8" y="103" class="sd-small">阶段</text><text x="8" y="130" class="sd-small">压力</text>`;
    stages.forEach(s=>{
      const sx=left+span*s.from,sw=span*(s.to-s.from),cx=sx+sw/2;
      out+=`<rect x="${round(sx)}" y="89" width="${round(sw)}" height="46" fill="${s.color}" fill-opacity=".12"/>
        <text x="${round(cx)}" y="105" text-anchor="middle">${s.name}</text>
        <text x="${round(cx)}" y="129" text-anchor="middle">${s.effect}</text>`;
    });
    out+=`<line x1="${round(x)}" y1="31" x2="${round(x)}" y2="136" stroke="var(--sd-muted)" stroke-width="1" stroke-dasharray="3 3"/>
      <circle cx="${round(x)}" cy="${round(pointY)}" r="4" fill="var(--sd-person)" stroke="var(--sd-white)" stroke-width="1.5"/>
      <text x="${left}" y="154" class="sd-small">进度 →</text><text x="${right}" y="154" text-anchor="end" class="sd-small">非测力曲线</text>`;
    return out;
  }

  function mount(target,options) {
    const container=typeof target==='string'?document.querySelector(target):target;
    if(!container) throw new Error('SnowDemo.mount: 找不到容器。');
    const opts=Object.assign({type:'center-low',autoplay:false,loop:false,duration:9000,stance:'regular'},options||{});
    if(!presets[opts.type]&&!opts.keyframes) throw new Error(`SnowDemo.mount: 未知动画类型 ${opts.type}`);
    const preset=opts.type==='hip-mobility'&&opts.variant==='hamstring'?presets['dry-hamstring']:
      presets[opts.type]||presets['center-low'];
    const config=Object.assign({},preset,opts);
    const short=isShort(config),shortInfo=short&&shortVariantsByType[config.type].includes(shortVariant(config))?shortVariants[shortVariant(config)]:null;
    if(short&&!shortInfo)throw new Error(`SnowDemo.mount: 未知短弯对照 ${config.variant}`);
    if(opts.type==='edge-change-down'&&['lower-com','retraction-study'].includes(opts.variant))
      config.transitionReference='snow';
    config.view=config.dry?'body':opts.view||(opts.variant==='arms-feedback'?'body':preset.view);
    if(!opts.path) {
      if(['edge-change-up','edge-change-down','knee-edge-change','mixed-rotation'].includes(opts.type))config.path='transition';
      if(opts.type==='retraction-turns')config.path='retraction';
      if(opts.type==='hip-edge-change')config.path='rail';
      if(['toe-edge','heel-edge','inclination','pressure-flex','pressure-extend','absorption'].includes(opts.type))config.path='single-arc';
      if(opts.type==='counter-rotation')config.path='j-turn';
    }
    if(['counter-rotation','mixed-rotation'].includes(opts.type))config.skid=true;
    config.studyFlat=(opts.variant==='phase-study'||opts.pressureDiagram)&&['pressure-flex','pressure-extend'].includes(opts.type);
    if(config.studyFlat)config.path='straight';
    let chosenFrames=opts.type==='dry-squat'&&opts.variant==='hold'&&!opts.keyframes?
      [key(0,{h:112}),key(.3,{h:90,hipY:-11,shoulderY:9}),key(.8,{h:90,hipY:-11,shoulderY:9}),key(1,{h:112})]:
      opts.keyframes||preset.keyframes;
    if(!opts.keyframes&&opts.variant==='front-center-back')chosenFrames=
      [key(0,{fore:18,h:94}),key(.34,{}),key(.71,{fore:-13,h:94}),key(1,{})];
    if(!opts.keyframes&&opts.variant==='front-return-toe')chosenFrames=
      [key(0,{}),key(.34,{fore:11,h:94}),key(.67,{}),key(1,{})];
    if(!opts.keyframes&&opts.variant==='rear-heel')chosenFrames=
      [key(0,{}),key(.34,{fore:-12,h:94}),key(.67,{fore:-3}),key(1,{})];
    if(!opts.keyframes&&opts.variant==='neutral')chosenFrames=
      [key(0,{h:106}),key(.36,{h:99}),key(.66,{h:99}),key(1,{h:106})];
    if(!opts.keyframes&&['inclination-focused','angulation-focused'].includes(opts.variant)) {
      const atEdge=opts.variant==='inclination-focused'?
        {h:96,edge:18,hipY:18,shoulderY:32}:{h:89,edge:18,hipY:17,shoulderY:8};
      chosenFrames=[key(0,{}),key(.35,atEdge),key(.7,atEdge),key(1,{})];
    }
    if(!opts.keyframes&&config.studyFlat&&opts.type==='pressure-flex')chosenFrames=
      [key(0,{h:102}),key(.38,{h:76}),key(.65,{h:76}),key(1,{h:102})];
    if(!opts.keyframes&&config.studyFlat&&opts.type==='pressure-extend')chosenFrames=
      [key(0,{h:80}),key(.32,{h:102}),key(.65,{h:102}),key(1,{h:80})];
    if(!opts.keyframes&&opts.type==='pressure-flex'&&opts.variant==='toe'&&opts.steps&&opts.steps.length===3)
      chosenFrames=[key(0,{h:103}),key(.38,{h:76}),key(.64,{h:76}),key(1,{h:76})];
    if(!opts.path&&(['open-heel','rear-heel','front-return-toe','closed-toe'].includes(opts.variant)||
      (opts.type==='center-high'&&['toe','heel'].includes(opts.variant))))config.path='single-arc';
    const frames=prepareFrames(chosenFrames);
    const downStudy=opts.type==='edge-change-down'&&['lower-com','retraction-study'].includes(opts.variant);
    const downTitle=opts.variant==='lower-com'?'屈曲减重：重心向雪板降低':'回收过渡：雪板回到身体下方';
    const downSteps=opts.variant==='lower-com'?
      [step(0,'旧刃仍在控制滑行','保留屈曲余量，准备释放旧刃。'),
        step(.18,'重心向板降低','踝膝髋协调屈曲，受控下降，同时减小旧刃角。'),
        step(.46,'屈腿经过居中位置','板接近平，身体在过渡较低；不以最低位置为目标。'),
        step(.65,'渐进建立新刃','逐渐伸腿与支撑，完成计划路线；实际动作可与回收混合。')]:
      [step(0,'旧刃仍在控制滑行','板在身体外侧，腿保留屈曲余量。'),
        step(.18,'板向身体下方回收','两腿协调屈曲，旧刃角减小；板保持贴雪。'),
        step(.46,'板从身下通过','比较固定雪面参考：躯干路径较稳定，双脚仍固定在板上。'),
        step(.65,'新弯渐进伸展','板继续向另一侧运行，恢复下肢支撑；真实动作可与降低重心混合。')];
    const shortSteps=short?[step(0,shortInfo[0],shortInfo[1]),
      step(.24,'停下来比较方向','绿色箭头表示实际移动方向，雪板虚线表示板头板尾的朝向；两者有夹角时，板仍在搓雪。'),
      step(.49,'继续观察换刃','看下方当前阶段，比较两侧动作；切换到“前后刃”或“立体”视角，进度保持不变。'),
      step(.76,'检查另一侧与出口','正确示范中，两脚协调引导、上身平顺；问题对照只用于识别，不需要故意模仿错误。')]:null;
    const rawSteps=Array.isArray(opts.steps)&&opts.steps.length?opts.steps:short?shortSteps:downStudy?downSteps:preset.steps;
    const defaultPhase=phaseMap(opts.type,opts.variant,rawSteps.length,preset);
    const steps=rawSteps.map((s,i)=>typeof s==='string'?step(defaultPhase[i],s,''):
      step(s.at==null?defaultPhase[i]:s.at,s.title||s.label||`阶段 ${i+1}`,s.note||s.detail||''))
      .sort((a,b)=>a.at-b.at);
    const id=`sd-${++sequence}`;
    installStyle();
    const root=document.createElement('div');
    root.className='sd-demo';
    root.dataset.type=opts.type;
    const title=opts.title||(short?shortInfo[0]:downStudy?downTitle:preset.title);
    const pressureEnabled=opts.pressureDiagram&&['pressure-flex','pressure-extend'].includes(opts.type);
    const views=config.dry?[['body','地面动作']]:[['body','立体'],['length','前后'],['width','前后刃'],['track','轨迹']];
    const stanceLabel=opts.type==='switch'?'惯用前脚':'前脚';
    root.innerHTML=`<div class="sd-toolbar"><p class="sd-title">${esc(title)}</p><div class="sd-tabs" role="group" aria-label="演示视角">${views.map(([v,l])=>`<button type="button" data-sd-view="${v}" aria-pressed="${v===config.view}">${l}</button>`).join('')}</div></div>
      ${opts.focus?`<p class="sd-note" style="margin:0 0 8px">观察重点：${esc(opts.focus)}</p>`:''}
      <svg class="sd-scene" xmlns="${NS}" role="img" aria-labelledby="${id}-title ${id}-desc" viewBox="0 0 520 305"><title id="${id}-title">${esc(title)}动作示意</title><desc id="${id}-desc">${config.dry?'离雪关节小人，在地面或垫子上演示受控体能与活动度动作。播放时间不代表训练时长。':'关节小人脚固定在雪板上，髋、膝、躯干随动作阶段变化。绿色菱形为近似重心，虚线为位置投影。图中不计算真实受力。'}</desc><g data-sd-art></g></svg>
      ${config.trackDiagnostics?'<p class="sd-note sd-track-note">绿色箭头标实际移动方向，板上虚线标板头板尾的朝向；宽色带表示搓雪，窄线表示刃滑。箭头只标方向，不表示力或速度大小。</p>':''}
      ${short?'<div class="sd-short-status" aria-live="off"><span>当前动作<b data-short-phase></b></span><span>雪板与身体<b data-short-edge></b><span class="sd-leg-meter" aria-hidden="true"><i data-short-leg></i></span></span></div><p class="sd-note">下方条形随双腿伸屈变化，不表示压力。路线按匀速播放，便于比较动作；图中不计算真实滑行速度，缩小弯形不等于加速下冲。</p>':''}
      ${pressureEnabled?`<svg class="sd-pressure-chart" xmlns="${NS}" viewBox="0 0 520 162" role="img" aria-label="髋高度与屈伸压力阶段的定性对应"><g data-sd-pressure></g></svg><p class="sd-note">平板直线参考：“增 / 减”表示双腿开始动作和逐渐停住时，脚下压力的短暂变化。保持同一高度后，这部分变化会消退；站得高或低本身不能说明压力大小。平地的简化关系是 N ≈ mg + m·aₙ，aₙ 指垂直地面的加速度；雪坡还要考虑坡度、弯形和地形。此图不计算力。</p>`:''}
      <div class="sd-controls"><button class="sd-play" type="button" aria-label="播放动作演示">播放</button><label>速度<select class="sd-speed" aria-label="播放速度"><option value=".25">0.25 倍</option><option value=".5" selected>0.5 倍</option><option value="1">1 倍</option></select></label><label${config.dry?' hidden style="display:none"':''}>${stanceLabel}<select class="sd-stance" aria-label="${stanceLabel}方向"><option value="regular">Regular · 左脚前</option><option value="goofy">Goofy · 右脚前</option></select></label>${!config.studyFlat&&['garland','j-turn','inclination','pressure-flex','pressure-extend','absorption'].includes(opts.type)?'<label>刃<select class="sd-edge-side" aria-label="练习刃"><option value="toe">前刃</option><option value="heel">后刃</option></select></label>':''}</div>
      <div class="sd-progress-label"><label for="${id}-range">拖动查看动作阶段</label><span class="sd-progress-value">0%</span></div><input id="${id}-range" class="sd-range" type="range" min="0" max="1000" step="1" value="0" aria-label="动作阶段"/>
      <p class="sd-phase" aria-live="polite"></p><div class="sd-steps" role="group" aria-label="动作分阶段">${steps.map((s,i)=>`<button type="button" data-sd-step="${i}" aria-pressed="false">${i+1}. ${esc(s.title)}</button>`).join('')}</div>
      <div class="sd-legend"><span><i style="background:var(--sd-person)"></i>肩 / 躯干</span><span><i style="background:var(--sd-hip)"></i>髋</span>${config.dry?'':'<span><i style="background:var(--sd-green)"></i>近似重心 / 投影</span><span><i style="background:var(--sd-blue)"></i>当前刃 / 运动方向</span>'}</div>
      <p class="sd-note">${config.dry?'离雪体能 / 活动度动作，比例为示意；播放时长不代表训练时长。动作在可控制、无疼痛范围内进行；不能代替雪上技能训练。':'动作用于说明先后配合，比例与幅度经过夸张；不计算真实受力，角度和前后脚压力比例不能照图照搬。虚线是位置投影，不是发力箭头。'}</p>`;
    container.appendChild(root);
    const svg=root.querySelector('.sd-scene');
    const art=root.querySelector('[data-sd-art]');
    const pressureArt=root.querySelector('[data-sd-pressure]');
    const pressureSvg=root.querySelector('.sd-pressure-chart');
    const trackNote=root.querySelector('.sd-track-note');
    const playButton=root.querySelector('.sd-play');
    const speedInput=root.querySelector('.sd-speed');
    const stanceInput=root.querySelector('.sd-stance');
    const sideInput=root.querySelector('.sd-edge-side');
    const range=root.querySelector('.sd-range');
    const phase=root.querySelector('.sd-phase');
    const percentage=root.querySelector('.sd-progress-value');
    const viewButtons=Array.from(root.querySelectorAll('[data-sd-view]'));
    const stepButtons=Array.from(root.querySelectorAll('[data-sd-step]'));
    const reduce=global.matchMedia&&global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let progress=0,playing=false,raf=0,lastTime=0,lastPhase=-1,destroyed=false,visible=true;
    let view=config.view,stance=opts.stance,side=opts.type==='heel-edge'||
      opts.edgeSide==='heel'||['heel','open-heel','rear-heel'].includes(opts.variant)?'heel':'toe';
    let width=520;
    stanceInput.value=stance;
    if(sideInput) sideInput.value=side;
    function currentStep() {
      let index=0;
      steps.forEach((s,i)=>{if(progress>=s.at)index=i;});
      return index;
    }
    function getPose(p) {
      if(short)return shortState(config,p,width).pose;
      let pose=sample(frames,p);
      if(opts.variant==='arms-feedback')pose.arms=p<.44?1:
        1-smooth(clamp((p-.44)/.22,0,1));
      if(opts.variant==='open'||opts.variant==='open-heel') {
        pose.hipYaw+=15;pose.shoulderYaw+=22;
      }
      if(opts.variant==='closed-toe') {
        const closing=1-smooth(clamp(p/.55,0,1));
        pose.hipYaw+=12*closing;pose.shoulderYaw+=18*closing;
      }
      if(side==='heel'&&opts.type!=='heel-edge') pose=Object.assign({},pose,{edge:-pose.edge,twist:-pose.twist,
        hipY:-pose.hipY,shoulderY:-pose.shoulderY});
      if((opts.type==='center-high'&&opts.variant==='toe')||opts.variant==='front-return-toe'||opts.variant==='closed-toe')
        pose=Object.assign({},pose,{edge:17,hipY:11,shoulderY:9});
      if(opts.type==='pressure-flex')pose=Object.assign({},pose,side==='heel'?
        {edge:-17,hipY:-18,shoulderY:-7}:{edge:17,hipY:11,shoulderY:9});
      if((opts.type==='center-high'&&opts.variant==='heel')||opts.variant==='open-heel'||opts.variant==='rear-heel')
        pose=Object.assign({},pose,{edge:-17,hipY:-18,shoulderY:-7});
      if(config.studyFlat)pose=Object.assign({},pose,{edge:0,twist:0,hipY:0,shoulderY:5,
        fore:0,torsoX:0,hipYaw:0,shoulderYaw:0});
      if(opts.type==='edge-change-down'&&opts.variant==='retraction-study') {
        // A low-amplitude cross-under reference: keep the torso's snow-world
        // path relatively stable while the board approaches and passes under it.
        // Lateral leg extension, not an airborne board lift, changes leg reach.
        const lateral=pose.edge/25*55;
        pose=Object.assign({},pose,{hipY:lateral,shoulderY:lateral+5,
          referenceHipHeight:90,fore:0,torsoX:0,hipYaw:0,shoulderYaw:0,twist:0});
      }
      return pose;
    }
    function draw() {
      if(destroyed)return;
      const pose=getPose(progress);
      const dryArt=config.dry?sceneDry(pose,progress,config,width):null;
      art.innerHTML=dryArt|| (view==='track'?sceneTrack(pose,progress,config,stance,id,width,side):
        sceneBody(pose,progress,config,view,stance,id,width));
      if(pressureArt)pressureArt.innerHTML=scenePressure(getPose,progress,config,width);
      if(trackNote)trackNote.hidden=view!=='track';
      if(short){
        const state=shortState(config,progress,width),h1=shortState(config,clamp(progress-.005,0,1),width).pose.h;
        const h2=shortState(config,clamp(progress+.005,0,1),width).pose.h;
        const leg=Math.abs(h2-h1)<.12?'双腿保持可调高度':h2>h1?'双腿逐渐伸展':'双腿逐渐屈曲';
        root.querySelector('[data-short-phase]').textContent=state.turn;
        root.querySelector('[data-short-edge]').textContent=`${Math.abs(pose.edge)<3?'接近平板':pose.edge>0?'前刃':'后刃'} · ${shortVariant(config)==='low-stuck'?'一直蹲低，活动余量小':leg}`;
        root.querySelector('[data-short-leg]').style.width=`${round(clamp((pose.h-68)/39,0,1)*100)}%`;
        root.dataset.shortVariant=shortVariant(config);
        root.dataset.shortPhase=state.turn;
      }
      range.value=String(Math.round(progress*1000));
      percentage.textContent=`${Math.round(progress*100)}%`;
      const index=currentStep();
      if(index!==lastPhase) {
        const s=steps[index];
        phase.innerHTML=`<strong>${index+1} / ${steps.length} · ${esc(s.title)}</strong>${esc(s.note)}`;
        stepButtons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
        lastPhase=index;
      }
    }
    function tick(now) {
      if(!playing||destroyed)return;
      if(!lastTime)lastTime=now;
      if(visible) {
        progress+=(now-lastTime)/Math.max(1000,opts.duration)*Number(speedInput.value);
        if(progress>=1) {
          if(opts.loop)progress%=1;
          else{progress=1;pause();}
        }
        draw();
      }
      lastTime=now;
      if(playing)raf=global.requestAnimationFrame(tick);
    }
    function play() {
      if(destroyed||playing)return;
      if(progress>=1)progress=0;
      playing=true;lastTime=0;
      playButton.textContent='暂停';playButton.setAttribute('aria-label','暂停动作演示');
      raf=global.requestAnimationFrame(tick);
    }
    function pause() {
      playing=false;lastTime=0;global.cancelAnimationFrame(raf);
      playButton.textContent='播放';playButton.setAttribute('aria-label','播放动作演示');
    }
    function seek(p) { progress=clamp(Number(p)||0,0,1);lastTime=0;draw(); }
    function setView(v) {
      if(!['body','length','width','track'].includes(v))return;
      if(config.dry&&v!=='body')return;
      view=v;viewButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sdView===v)));draw();
    }
    playButton.addEventListener('click',()=>playing?pause():play());
    range.addEventListener('input',()=>{pause();seek(Number(range.value)/1000);});
    stanceInput.addEventListener('change',()=>{stance=stanceInput.value;draw();});
    if(sideInput)sideInput.addEventListener('change',()=>{side=sideInput.value;draw();});
    viewButtons.forEach(b=>b.addEventListener('click',()=>setView(b.dataset.sdView)));
    stepButtons.forEach((b,i)=>b.addEventListener('click',()=>{pause();seek(steps[i].at);}));
    let resizeObserver=null,intersectionObserver=null;
    function size() {
      // Adjust the viewBox instead of shrinking 520px text at phone widths.
      const actual=svg.getBoundingClientRect().width||520;
      width=clamp(actual,240,640);
      svg.setAttribute('viewBox',`0 0 ${round(width)} 305`);
      if(pressureSvg)pressureSvg.setAttribute('viewBox',`0 0 ${round(width)} 162`);
      draw();
    }
    if(global.ResizeObserver){resizeObserver=new ResizeObserver(size);resizeObserver.observe(svg);}
    else global.addEventListener('resize',size);
    if(global.IntersectionObserver){intersectionObserver=new IntersectionObserver(entries=>{
      visible=entries[0].isIntersecting;lastTime=0;
    },{threshold:0});intersectionObserver.observe(root);}
    function destroy() {
      pause();destroyed=true;
      if(resizeObserver)resizeObserver.disconnect();else global.removeEventListener('resize',size);
      if(intersectionObserver)intersectionObserver.disconnect();
      root.remove();
    }
    size();
    if(opts.autoplay&&!reduce)play();
    return {destroy,play,pause,seek,setView,element:root};
  }
  global.SnowDemo={mount,types:Object.keys(presets),presets,shortVariants:shortVariantsByType,
    paths:['straight','single-arc','j-turn','garland','rail','linked-skid','transition','retraction','short-turns']};
})(window);
