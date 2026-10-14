/**
 * Qualitative snowboard teaching motion, in metres, independent of any viewport.
 * This is an authored kinematic example, not a force / speed simulation.
 *
 * World: x across the slope, y normal to the snow, z downhill.
 * Board: x nose, y deck normal, z the geometric right-hand side.
 * Regular toes point mostly +z; goofy is a world-x reflection, keeping +x the nose.
 * Rotation is Ry(yaw) * Rx(roll), matching THREE.Euler(roll, yaw, 0, 'YXZ').
 */
export type Vec3 = [number, number, number];
export type Mode = "correct" | "error" | "drill";
export type Stance = "regular" | "goofy";
export type Edge = "toe" | "heel" | "flat";

export interface BoardState {
  position: Vec3;
  yaw: number;
  roll: number;
  length: number;
  width: number;
  thickness: number;
}

export interface BootState {
  position: Vec3;
  yaw: number;
  toeDirection: Vec3;
  up: Vec3;
  localPosition: Vec3;
}

export interface MotionState {
  board: BoardState;
  joints: {
    pelvis: Vec3;
    chest: Vec3;
    neck: Vec3;
    head: Vec3;
    frontHip: Vec3;
    rearHip: Vec3;
    frontKnee: Vec3;
    rearKnee: Vec3;
    frontAnkle: Vec3;
    rearAnkle: Vec3;
    frontShoulder: Vec3;
    rearShoulder: Vec3;
    frontElbow: Vec3;
    rearElbow: Vec3;
    frontHand: Vec3;
    rearHand: Vec3;
  };
  boots: { front: BootState; rear: BootState };
  /** Body-segment weighted position: visual estimate, not measured centre of mass. */
  com: Vec3;
  travel: Vec3;
  edge: Edge;
  phase: 0 | 1 | 2 | 3;
  phaseName: string;
  /** Target edge of this half-cycle: 0 toe, 1 heel, for both stances. */
  half: 0 | 1;
  turnProgress: number;
  drillHolding: boolean;
  /** Authored cue strength, not force or pressure. */
  edgeLoad: number;
  metrics: {
    edgeAngle: number;
    hipHeight: number;
    /** Anatomical knee flexion in degrees, 0 = straight. */
    frontKnee: number;
    rearKnee: number;
    /** Absolute board-axis versus travel angle, in degrees. */
    skidAngle: number;
  };
  contact: Vec3;
  /** Board normal, distinct from the snow normal and from the snow reaction. */
  normal: Vec3;
  snowNormal: Vec3;
  turnYaw: number;
}

export const BODY = Object.freeze({
  thigh: 0.43,
  shin: 0.43,
  upperArm: 0.285,
  forearm: 0.25,
  hipWidth: 0.285,
  shoulderWidth: 0.39,
  stanceWidth: 0.54,
  bootLength: 0.285,
  bootWidth: 0.115,
  ankleHeight: 0.15,
  trunk: 0.35,
  neck: 0.145,
  head: 0.115,
});

const PI = Math.PI;
const TAU = PI * 2;
const DEG = 180 / PI;
const PHASES = ["释放旧刃", "引导入弯", "完成弧线", "准备换侧"] as const;
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: Vec3, b: Vec3): number =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const mag = (a: Vec3): number => Math.hypot(...a);
const unit = (a: Vec3): Vec3 => mul(a, 1 / Math.max(1e-12, mag(a)));
const mix = (a: Vec3, b: Vec3, t: number): Vec3 =>
  add(mul(a, 1 - t), mul(b, t));
const clamp = (n: number, low = 0, high = 1): number =>
  Math.min(high, Math.max(low, n));
const smooth = (n: number): number => {
  const x = clamp(n);
  return x * x * (3 - 2 * x);
};
const ease = (n: number): number => {
  const x = clamp(n);
  return x ** 3 * (10 - 15 * x + 6 * x * x);
};
const frac = (n: number): number => ((n % 1) + 1) % 1;
const yawAxis = (yaw: number): Vec3 => [Math.cos(yaw), 0, -Math.sin(yaw)];
const yawToe = (yaw: number): Vec3 => [Math.sin(yaw), 0, Math.cos(yaw)];
const mirror = (v: Vec3): Vec3 => [-v[0], v[1], v[2]];

export function boardVectorToWorld(
  local: Vec3,
  board: Pick<BoardState, "yaw" | "roll">,
): Vec3 {
  const cx = Math.cos(board.roll),
    sx = Math.sin(board.roll);
  const cy = Math.cos(board.yaw),
    sy = Math.sin(board.yaw);
  const y = local[1] * cx - local[2] * sx;
  const z = local[1] * sx + local[2] * cx;
  return [local[0] * cy + z * sy, y, -local[0] * sy + z * cy];
}

export function boardToWorld(local: Vec3, board: BoardState): Vec3 {
  return add(board.position, boardVectorToWorld(local, board));
}

/** Exact two-link IK. Pole is the boot's toe side, never a camera direction. */
function kneeIK(hip: Vec3, ankle: Vec3, toe: Vec3): Vec3 {
  const delta = sub(ankle, hip);
  const distance = mag(delta);
  if (distance >= BODY.thigh + BODY.shin - 1e-6 || distance < 0.12) {
    throw new Error(`Unreachable authored leg: ${distance.toFixed(5)} m`);
  }
  const axis = unit(delta);
  const projection = sub(toe, mul(axis, dot(toe, axis)));
  const bend = unit(projection);
  const along =
    (BODY.thigh ** 2 - BODY.shin ** 2 + distance ** 2) / (2 * distance);
  const height = Math.sqrt(Math.max(0, BODY.thigh ** 2 - along ** 2));
  return add(add(hip, mul(axis, along)), mul(bend, height));
}

function elbowIK(shoulder: Vec3, hand: Vec3, pole: Vec3): Vec3 {
  const delta = sub(hand, shoulder),
    distance = mag(delta),
    axis = unit(delta);
  const bend = unit(sub(pole, mul(axis, dot(pole, axis))));
  const along =
    (BODY.upperArm ** 2 - BODY.forearm ** 2 + distance ** 2) / (2 * distance);
  const height = Math.sqrt(Math.max(0, BODY.upperArm ** 2 - along ** 2));
  return add(add(shoulder, mul(axis, along)), mul(bend, height));
}

function kneeFlexion(hip: Vec3, knee: Vec3, ankle: Vec3): number {
  const upper = unit(sub(hip, knee)),
    lower = unit(sub(ankle, knee));
  return 180 - Math.acos(clamp(dot(upper, lower), -1, 1)) * DEG;
}

interface Route {
  position: Vec3;
  travel: Vec3;
  yaw: number;
  roll: number;
  edgeLoad: number;
  phase: 0 | 1 | 2 | 3;
  half: 0 | 1;
  progress: number;
  holding: boolean;
  lean: number;
  extension: number;
  braking: number;
}

/** A cycle translates downhill. time=1 is the next cycle, not a teleport to time=0. */
function routeAt(time: number, mode: Mode, requestedHold: number): Route {
  const t = Number.isFinite(time) ? time : 0;
  const halfIndex = Math.floor(t * 2);
  const half = (frac(halfIndex / 2) >= 0.5 ? 1 : 0) as 0 | 1;
  const u = frac(t * 2);
  const sign = half === 0 ? 1 : -1;
  const phaseAt = (v: number): 0 | 1 | 2 | 3 =>
    v < 0.2 ? 0 : v < 0.48 ? 1 : v < 0.82 ? 2 : 3;

  if (mode === "drill") {
    const hold = clamp(
      Number.isFinite(requestedHold) ? requestedHold : 0.55,
      0,
      0.75,
    );
    const holding = u < hold;
    const v = holding ? 0 : clamp((u - hold) / (1 - hold));
    const sideDistance = hold * 3.2;
    const turnDistance = 3.6;
    const halfDistance = sideDistance + turnDistance;
    const e = ease(v);
    // The turn geometry is unchanged when the side-slip waiting distance changes.
    const x = sign * 0.65 * Math.sin(PI * e);
    const z =
      halfIndex * halfDistance +
      (holding
        ? (hold > 0 ? u / hold : 0) * sideDistance
        : sideDistance + turnDistance * v);
    const de = 30 * v * v * (v - 1) * (v - 1);
    const dx = holding ? 0 : sign * 0.65 * PI * Math.cos(PI * e) * de;
    const travel = unit([dx, 0, holding ? 3.2 : turnDistance]);
    const travelYaw = Math.atan2(-travel[2], travel[0]);
    // Old uphill edge releases before the new uphill edge develops. At either
    // side-slip endpoint the board is transverse and cannot flip downhill edge.
    const release = 0.2;
    const yawProgress = smooth(v / (v + 0.36 * (1 - v)));
    const yaw = -PI / 2 - sign * (PI * yawProgress - PI / 2);
    const slipOffset = yaw - travelYaw;
    const roll = -0.27 * Math.sin(slipOffset);
    const load = Math.abs(Math.sin(slipOffset));
    return {
      position: [x, 0, z],
      travel,
      yaw,
      roll,
      edgeLoad: load,
      phase: holding ? 3 : phaseAt(v),
      half,
      progress: v,
      holding,
      lean: roll / 0.27,
      extension: holding
        ? 0
        : 1.8 *
          Math.sin(PI * v) ** 2 *
          Math.exp(-(((v - release) / 0.19) ** 2)),
      braking: 0,
    };
  }

  const phi = TAU * t - PI * 0.18;
  const s = Math.sin(phi);
  const amplitude = mode === "error" ? 0.57 : 1.45;
  const length = 9.3;
  const x = amplitude * Math.sin(phi);
  const dx = amplitude * TAU * Math.cos(phi);
  const travel = unit([dx, 0, length]);
  const travelYaw = Math.atan2(-travel[2], travel[0]);
  const braking = mode === "error" ? Math.abs(s) ** 7 : 0;
  // In the error example the body travels in a narrow corridor while the board
  // turns sharply late. It is a visual counterexample, not an exercise to copy.
  const skid =
    mode === "error"
      ? -Math.sign(s) * (0.035 * Math.abs(s) + 0.96 * braking)
      : -0.275 * s;
  const roll =
    mode === "error"
      ? Math.sign(s) * (0.065 * Math.abs(s) + 0.47 * braking)
      : 0.31 * s;
  return {
    position: [x, 0, length * t],
    travel,
    yaw: travelYaw + skid,
    roll,
    edgeLoad: mode === "error" ? braking : Math.abs(s),
    phase: phaseAt(u),
    half,
    progress: u,
    holding: false,
    lean: s,
    extension: 1 - s * s,
    braking,
  };
}

function buildRegular(time: number, mode: Mode, hold: number): MotionState {
  const route = routeAt(time, mode, hold);
  const board: BoardState = {
    position: [...route.position],
    yaw: route.yaw,
    roll: route.roll,
    length: 1.58,
    width: 0.265,
    thickness: 0.026,
  };
  // The active lower edge lies on the snow plane; the far edge rises above it.
  board.position[1] =
    (board.thickness / 2) * Math.cos(board.roll) +
    (board.width / 2) * Math.abs(Math.sin(board.roll));
  const normal = boardVectorToWorld([0, 1, 0], board);
  const frontBootToe: Vec3 = [Math.sin(18 / DEG), 0, Math.cos(18 / DEG)];
  const rearBootToe: Vec3 = [Math.sin(-9 / DEG), 0, Math.cos(-9 / DEG)];
  const makeBoot = (x: number, toe: Vec3): BootState => {
    const localPosition: Vec3 = [x, 0.073, 0];
    const toeDirection = unit(boardVectorToWorld(toe, board));
    return {
      position: boardToWorld(localPosition, board),
      localPosition,
      yaw: Math.atan2(-toeDirection[2], toeDirection[0]),
      toeDirection,
      up: normal,
    };
  };
  const boots = {
    front: makeBoot(BODY.stanceWidth / 2, frontBootToe),
    rear: makeBoot(-BODY.stanceWidth / 2, rearBootToe),
  };
  const frontAnkle = boardToWorld(
    [BODY.stanceWidth / 2, BODY.ankleHeight, 0],
    board,
  );
  const rearAnkle = boardToWorld(
    [-BODY.stanceWidth / 2, BODY.ankleHeight, 0],
    board,
  );
  const forward = yawAxis(board.yaw);
  const toe = yawToe(board.yaw);
  // Toe/heel flexion is asymmetric: avoid copying a heelside sitting pose onto
  // toeside. These are authored example dimensions, not prescribed technique.
  const toeLean = Math.max(0, route.lean);
  const heelLean = Math.max(0, -route.lean);
  const pelvisHeight =
    0.8 + 0.115 * route.extension + 0.06 * toeLean - 0.035 * route.braking;
  const foreAft = mode === "error" ? 0.11 * route.braking : 0.018 * route.lean;
  const pelvisToe = -0.035 + 0.22 * route.lean + 0.02 * route.lean ** 2;
  const pelvis = add(
    add(board.position, mul(forward, foreAft)),
    mul(toe, pelvisToe),
  );
  pelvis[1] = board.position[1] + pelvisHeight;
  const hipYaw =
    board.yaw +
    0.11 +
    (mode === "error" ? 0.14 * route.lean : 0.035 * route.lean);
  const hipAxis = yawAxis(hipYaw);
  const frontHip = add(pelvis, mul(hipAxis, BODY.hipWidth / 2));
  const rearHip = add(pelvis, mul(hipAxis, -BODY.hipWidth / 2));
  const frontKnee = kneeIK(frontHip, frontAnkle, boots.front.toeDirection);
  const rearKnee = kneeIK(rearHip, rearAnkle, boots.rear.toeDirection);

  // The torso changes heading less than the board while remaining naturally open.
  const shoulderYaw = -PI / 2 + 0.28 + (board.yaw + PI / 2) * 0.62;
  // A neutral, fixed-length trunk articulates at the hip. On toeside the hips
  // move towards the toe edge while the trunk stays more upright than the legs;
  // it does not reach further in with the chest or arch the lumbar spine.
  const torsoPitch = 0.1 - 0.17 * toeLean + 0.25 * heelLean;
  const torsoUp = add(
    [0, Math.cos(torsoPitch), 0],
    mul(toe, Math.sin(torsoPitch)),
  );
  const rawShoulderAxis = yawAxis(shoulderYaw);
  const shoulderAxis = unit(
    sub(rawShoulderAxis, mul(torsoUp, dot(rawShoulderAxis, torsoUp))),
  );
  const chest = add(pelvis, mul(torsoUp, BODY.trunk));
  const neck = add(chest, mul(torsoUp, BODY.neck));
  const head = add(neck, mul(torsoUp, BODY.head));
  const frontShoulder = add(chest, mul(shoulderAxis, BODY.shoulderWidth / 2));
  const rearShoulder = add(chest, mul(shoulderAxis, -BODY.shoulderWidth / 2));
  const shoulderToe = yawToe(shoulderYaw);
  const frontHand = add(
    add(frontShoulder, [0, -0.34, 0]),
    add(mul(shoulderToe, 0.25), mul(shoulderAxis, 0.035)),
  );
  const rearHand = add(
    add(rearShoulder, [0, -0.34, 0]),
    add(mul(shoulderToe, 0.25), mul(shoulderAxis, -0.035)),
  );
  const frontElbow = elbowIK(frontShoulder, frontHand, shoulderAxis);
  const rearElbow = elbowIK(rearShoulder, rearHand, mul(shoulderAxis, -1));
  const joints = {
    pelvis,
    chest,
    neck,
    head,
    frontHip,
    rearHip,
    frontKnee,
    rearKnee,
    frontAnkle,
    rearAnkle,
    frontShoulder,
    rearShoulder,
    frontElbow,
    rearElbow,
    frontHand,
    rearHand,
  };

  const bodySegments: Array<[Vec3, number]> = [
    [mix(pelvis, neck, 0.5), 0.48],
    [head, 0.08],
    [mix(frontHip, frontKnee, 0.43), 0.1],
    [mix(rearHip, rearKnee, 0.43), 0.1],
    [mix(frontKnee, frontAnkle, 0.43), 0.047],
    [mix(rearKnee, rearAnkle, 0.43), 0.047],
    [boots.front.position, 0.015],
    [boots.rear.position, 0.015],
    [mix(frontShoulder, frontElbow, 0.44), 0.027],
    [mix(rearShoulder, rearElbow, 0.44), 0.027],
    [mix(frontElbow, frontHand, 0.45), 0.022],
    [mix(rearElbow, rearHand, 0.45), 0.022],
  ];
  const totalMass = bodySegments.reduce((sum, [, mass]) => sum + mass, 0);
  const com = mul(
    bodySegments.reduce<Vec3>(
      (sum, [point, mass]) => add(sum, mul(point, mass)),
      [0, 0, 0],
    ),
    1 / totalMass,
  );
  const edge: Edge =
    Math.abs(board.roll) < 0.008 ? "flat" : board.roll > 0 ? "toe" : "heel";
  const contact = boardToWorld(
    [0, -board.thickness / 2, (Math.sign(board.roll) * board.width) / 2],
    board,
  );
  const nose = yawAxis(board.yaw);
  return {
    board,
    joints,
    boots,
    com,
    travel: route.travel,
    edge,
    phase: route.phase,
    phaseName: route.holding ? "稳住侧滑，准备下一弯" : PHASES[route.phase],
    half: route.half,
    turnProgress: route.progress,
    drillHolding: route.holding,
    edgeLoad: route.edgeLoad,
    metrics: {
      edgeAngle: Math.abs(board.roll) * DEG,
      hipHeight: pelvisHeight,
      frontKnee: kneeFlexion(frontHip, frontKnee, frontAnkle),
      rearKnee: kneeFlexion(rearHip, rearKnee, rearAnkle),
      skidAngle: Math.acos(clamp(dot(nose, route.travel), -1, 1)) * DEG,
    },
    contact,
    normal,
    snowNormal: [0, 1, 0],
    turnYaw: board.yaw,
  };
}

export function sampleMotion(
  time: number,
  mode: Mode,
  stance: Stance = "regular",
  hold = 0.55,
): MotionState {
  const state = buildRegular(time, mode, hold);
  if (stance === "regular") return state;
  const mirrorBoot = (boot: BootState): BootState => ({
    ...boot,
    position: mirror(boot.position),
    toeDirection: mirror(boot.toeDirection),
    up: mirror(boot.up),
    yaw: -PI - boot.yaw,
    localPosition: [
      boot.localPosition[0],
      boot.localPosition[1],
      -boot.localPosition[2],
    ],
  });
  return {
    ...state,
    board: {
      ...state.board,
      position: mirror(state.board.position),
      yaw: -PI - state.board.yaw,
      roll: -state.board.roll,
    },
    joints: Object.fromEntries(
      Object.entries(state.joints).map(([name, value]) => [
        name,
        mirror(value),
      ]),
    ) as MotionState["joints"],
    boots: {
      front: mirrorBoot(state.boots.front),
      rear: mirrorBoot(state.boots.rear),
    },
    com: mirror(state.com),
    travel: mirror(state.travel),
    contact: mirror(state.contact),
    normal: mirror(state.normal),
    turnYaw: -PI - state.turnYaw,
  };
}

/** Fixed world-space line. Generate once per mode/hold/stance; never per frame. */
export function sampleTrail(
  mode: Mode,
  stance: Stance = "regular",
  hold = 0.55,
  samples = 180,
): Vec3[] {
  const count = Math.max(8, Math.floor(samples));
  return Array.from({ length: count + 1 }, (_, i) => {
    const route = routeAt(i / count, mode, hold);
    const point: Vec3 = [route.position[0], 0.006, route.position[2]];
    return stance === "goofy" ? mirror(point) : point;
  });
}
