/**
 * Qualitative snowboard teaching motion, in metres, independent of any viewport.
 * This is an authored kinematic example, not a force / speed simulation.
 *
 * World: x across the slope, y normal to the snow, z downhill.
 * Board: x nose, y deck normal, z the geometric right-hand side.
 * Regular toes point mostly +z; goofy is a world-x reflection, keeping +x the nose.
 * Rotation is Ry(yaw) * Rx(roll), matching THREE.Euler(roll, yaw, 0, 'YXZ').
 */
import {surfacePointToWorld,surfaceSnowHeight,surfaceVectorToWorld,type SegmentRolls} from "./board-surface";
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
  /** Optional authored local rolls; absent retains the original rigid board. */
  segmentRolls?: SegmentRolls;
}

export interface BootState {
  position: Vec3;
  yaw: number;
  toeDirection: Vec3;
  up: Vec3;
  localPosition: Vec3;
  /** Tibia relative to the fixed sole, NOT a measured anatomical ankle angle. */
  cuffPitch: number;
}

export interface MotionState {
  board: BoardState;
  /** Original tail leads when -1. Foot identities and hardware axes stay fixed. */
  rideDirection?: 1 | -1;
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
  gaze: Vec3;
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
    /** Riding-front axis versus travel angle, in degrees; defaults to the nose. */
    skidAngle: number;
  };
  /** Geometric low edge only. Never use as an inferred centre of pressure. */
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
export const PHASES = ["释放旧刃", "接入新刃", "完成弧线", "开始减刃"] as const;

/** Authored soft-boot example, not a universal boot ROM or fitting recommendation. */
export const BOOT_SETUP = Object.freeze({
  highbackLean: 12,
  neutralCuff: 14,
  maxCuff: 20,
});
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
  if(board.segmentRolls)return surfacePointToWorld(local,board);
  return add(board.position, boardVectorToWorld(local, board));
}

/** Orientation of a local board cross-section, especially a fixed binding. */
export function boardVectorToWorldAt(local:Vec3,board:Pick<BoardState,"yaw"|"roll"|"segmentRolls">,x=0):Vec3 {
  return surfaceVectorToWorld(local,board,x);
}

/**
 * Feet and finite cuff motion determine the shins first. The pelvis is then on
 * the intersection circle of two thigh-length spheres (centres include the
 * hip-width offsets). This preserves both legs exactly, without unconstrained
 * ankle flexion or a post-IK clamp that would detach feet/stretch bones.
 */
function pelvisFromKnees(
  front: Vec3,
  rear: Vec3,
  hipAxis: Vec3,
  up: Vec3,
  toe: Vec3,
  thighBack: number,
): Vec3 {
  const offset = mul(hipAxis, BODY.hipWidth / 2);
  const a = sub(front, offset),
    b = add(rear, offset);
  const separation = mag(sub(b, a));
  if (separation >= 2 * BODY.thigh || separation < 1e-6) {
    throw new Error("Unreachable boot-constrained pelvis");
  }
  const axis = unit(sub(b, a));
  const desired = sub(
    mul(up, Math.cos(thighBack)),
    mul(toe, Math.sin(thighBack)),
  );
  const radial = unit(sub(desired, mul(axis, dot(desired, axis))));
  const radius = Math.sqrt(BODY.thigh ** 2 - (separation / 2) ** 2);
  return add(mix(a, b, 0.5), mul(radial, radius));
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

export interface Route {
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

/** Geometry of the side-slip connector, shared by its route and event timing. */
function drillGeometry(v: number, sign = 1) {
  const e = ease(v);
  const de = 30 * v * v * (v - 1) * (v - 1);
  const travel = unit([sign * 0.65 * PI * Math.cos(PI * e) * de, 0, 3.6]);
  const yawProgress = smooth(v / (v + 0.36 * (1 - v)));
  const yaw = -PI / 2 - sign * (PI * yawProgress - PI / 2);
  return { travel, yaw, slip: yaw - Math.atan2(-travel[2], travel[0]) };
}
const DRILL_FLAT = (() => {
  let lo = 0,
    hi = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (drillGeometry(mid).slip > 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
})();
// Monotone C1 curve with a shared slope at the event. This authors one
// extension/flexion cycle, independent of small changes in skid angle.
function drillLean(v: number) {
  const before = v < DRILL_FLAT;
  const span = before ? DRILL_FLAT : 1 - DRILL_FLAT;
  const u = before ? v / span : (v - DRILL_FLAT) / span;
  const y0 = before ? -1 : 0,
    y1 = before ? 0 : 1;
  const m0 = before ? 0 : 2,
    m1 = before ? 2 : 0;
  return (
    (2 * u ** 3 - 3 * u * u + 1) * y0 +
    (u ** 3 - 2 * u * u + u) * span * m0 +
    (-2 * u ** 3 + 3 * u * u) * y1 +
    (u ** 3 - u * u) * span * m1
  );
}

/** A cycle translates downhill. time=1 is the next cycle, not a teleport to time=0. */
function routeAt(time: number, mode: Mode, requestedHold: number): Route {
  const t = Number.isFinite(time) ? time : 0;
  const halfIndex = Math.floor(t * 2);
  const half = (frac(halfIndex / 2) >= 0.5 ? 1 : 0) as 0 | 1;
  const u = frac(t * 2);
  const sign = half === 0 ? 1 : -1;
  const phaseAt = (v: number): 0 | 1 | 2 | 3 =>
    v < 0.18 ? 0 : v < 0.48 ? 1 : v < 0.82 ? 2 : 3;

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
    const geometry = drillGeometry(v, sign);
    const travel: Vec3 = holding ? [0, 0, 1] : geometry.travel;
    // Old uphill edge releases before the new uphill edge develops. At either
    // side-slip endpoint the board is transverse and cannot flip downhill edge.
    const yaw = geometry.yaw;
    const slipOffset = geometry.slip;
    const roll = -0.27 * Math.sin(slipOffset);
    const load = Math.abs(Math.sin(slipOffset));
    return {
      position: [x, 0, z],
      travel,
      yaw,
      roll,
      edgeLoad: load,
      phase: holding
        ? 3
        : roll * sign < 0
          ? 0
          : v < 0.48
            ? 1
            : v < 0.82
              ? 2
              : 3,
      half,
      progress: v,
      holding,
      lean: sign * drillLean(v),
      extension: 1 - drillLean(v) ** 2,
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
      : 0.24 * s;
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

/** Each lesson authors posture independently; the equipment/bone solver is shared. */
export interface PoseOptions {
  segmentRolls?: SegmentRolls;
  rideDirection?: 1 | -1;
  cuffPitch?: number;
  rearCuffPitch?: number;
  shinSide?: number;
  hipTilt?: number;
  legBend?: number;
  hipYaw?: number;
  shoulderYaw?: number;
  torsoPitch?: number;
  torsoAlong?: number;
  frontHand?: Vec3;
  rearHand?: Vec3;
  lookDirection?: Vec3;
}

export function buildPose(route: Route, mode: Mode = "correct", pose: PoseOptions = {}): MotionState {
  const board: BoardState = {
    position: [...route.position],
    yaw: route.yaw,
    roll: route.roll,
    length: 1.58,
    width: 0.265,
    thickness: 0.026,
    ...(pose.segmentRolls?{segmentRolls:{...pose.segmentRolls}}:{}),
  };
  // The active lower edge lies on the snow plane; the far edge rises above it.
  board.position[1] = board.segmentRolls?surfaceSnowHeight(board):
    (board.thickness / 2) * Math.cos(board.roll) +
    (board.width / 2) * Math.abs(Math.sin(board.roll));
  const normal = boardVectorToWorld([0, 1, 0], board);
  const frontBootToe: Vec3 = [Math.sin(18 / DEG), 0, Math.cos(18 / DEG)];
  const rearBootToe: Vec3 = [Math.sin(-9 / DEG), 0, Math.cos(-9 / DEG)];
  const makeBoot = (x: number, toe: Vec3): BootState => {
    const localPosition: Vec3 = [x, 0.073, 0];
    const toeDirection = unit(boardVectorToWorldAt(toe, board, x));
    return {
      position: boardToWorld(localPosition, board),
      localPosition,
      yaw: Math.atan2(-toeDirection[2], toeDirection[0]),
      toeDirection,
      up: boardVectorToWorldAt([0,1,0],board,x),
      cuffPitch: BOOT_SETUP.neutralCuff,
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
  const toe = yawToe(board.yaw);
  // The sole and highback keep their binding frame. More heel-edge angle does
  // not require folding the boot further toward the toe: knee/hip flexion and
  // the whole board's tilt supply the visibly different heel-side arrangement.
  const toeLean = Math.max(0, route.lean);
  const heelLean = Math.max(0, -route.lean);
  const cuffPitch = pose.cuffPitch ?? BOOT_SETUP.neutralCuff + 3 * route.lean + route.lean ** 2;
  const makeKnee = (ankle: Vec3, boot: BootState, cuff: number): Vec3 => {
    boot.cuffPitch = cuff;
    const pitch = cuff / DEG;
    // A small boot-relative lateral lean is an authored equipment assumption.
    // It moves the entire shin before solving the pelvis, never detaches a foot.
    const toeLocal = boot.toeDirection;
    const up=boot.up;
    const side: Vec3 = [up[1]*toeLocal[2]-up[2]*toeLocal[1], up[2]*toeLocal[0]-up[0]*toeLocal[2], up[0]*toeLocal[1]-up[1]*toeLocal[0]];
    return add(
      ankle,
      mul(
        unit(add(add(
          mul(up, Math.cos(pitch)),
          mul(boot.toeDirection, Math.sin(pitch)),
        ), mul(side, Math.tan(pose.shinSide ?? 0)))),
        BODY.shin,
      ),
    );
  };
  const frontKnee = makeKnee(frontAnkle, boots.front, cuffPitch);
  const rearKnee = makeKnee(rearAnkle, boots.rear, pose.rearCuffPitch ?? cuffPitch);
  const hipYaw =
    pose.hipYaw ?? board.yaw + 0.11 + (mode === "error" ? 0.14 : 0.035) * route.lean;
  const hipTilt = pose.hipTilt ?? 0;
  const hipAxis = add(mul(yawAxis(hipYaw), Math.cos(hipTilt)), [0, Math.sin(hipTilt), 0]);
  // One extension-transition example: least flexed near flat, flexion develops
  // on the new edge. These are authored dimensions, not prescribed joint angles.
  const legBend = pose.legBend ??
    30 + (17 + 3 * route.lean) * (1 - route.extension) + 4 * route.braking;
  const pelvis = pelvisFromKnees(
    frontKnee,
    rearKnee,
    hipAxis,
    normal,
    boardVectorToWorld([0, 0, 1], board),
    (legBend - cuffPitch) / DEG,
  );
  const pelvisHeight = pelvis[1] - board.position[1];
  const frontHip = add(pelvis, mul(hipAxis, BODY.hipWidth / 2));
  const rearHip = add(pelvis, mul(hipAxis, -BODY.hipWidth / 2));

  // The torso changes heading less than the board while remaining naturally open.
  const shoulderYaw = pose.shoulderYaw ?? -PI / 2 + 0.28 + (board.yaw + PI / 2) * 0.62;
  // A neutral, fixed-length trunk articulates at the hip. On toeside the hips
  // move towards the toe edge while the trunk stays more upright than the legs;
  // it does not reach further in with the chest or arch the lumbar spine.
  const torsoPitch = pose.torsoPitch ?? 0.1 - 0.17 * toeLean + 0.4 * heelLean;
  const torsoUp = unit(add(add(
    [0, Math.cos(torsoPitch), 0],
    mul(toe, Math.sin(torsoPitch)),
  ), mul(yawAxis(board.yaw), pose.torsoAlong ?? 0)));
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
  const frontHand = pose.frontHand ?? add(
    add(frontShoulder, [0, -0.34, 0]),
    add(mul(shoulderToe, 0.25), mul(shoulderAxis, 0.035)),
  );
  const rearHand = pose.rearHand ?? add(
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
  let contact = boardToWorld(
    [0, -board.thickness / 2, (Math.sign(board.roll) * board.width) / 2],
    board,
  );
  if(board.segmentRolls){
    const front=boardToWorld([BODY.stanceWidth/2,-board.thickness/2,Math.sign(board.segmentRolls.front)*board.width/2],board);
    const rear=boardToWorld([-BODY.stanceWidth/2,-board.thickness/2,Math.sign(board.segmentRolls.rear)*board.width/2],board);
    contact=front[1]<rear[1]?front:rear;
  }
  const nose = mul(yawAxis(board.yaw),pose.rideDirection??1);
  // Look toward the route with a finite neck turn, independent of shoulder yaw.
  const lookDirection = pose.lookDirection ?? route.travel;
  const travelFacing = Math.hypot(...lookDirection)>1e-8 ? Math.atan2(lookDirection[0],lookDirection[2]) : shoulderYaw;
  const headTurn = clamp(
    Math.atan2(
      Math.sin(travelFacing - shoulderYaw),
      Math.cos(travelFacing - shoulderYaw),
    ),
    -PI / 3,
    PI / 3,
  );
  const gaze = yawToe(shoulderYaw + headTurn);
  return {
    board,
    ...(pose.rideDirection?{rideDirection:pose.rideDirection}:{}),
    joints,
    boots,
    com,
    travel: route.travel,
    gaze,
    edge,
    phase: route.phase,
    phaseName: route.holding
      ? "稳住侧滑，准备下一弯"
      : mode === "drill" && route.phase === 3
        ? "恢复侧滑"
        : PHASES[route.phase],
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
  return applyStance(buildPose(routeAt(time, mode, hold), mode), stance);
}

export function applyStance(state: MotionState, stance: Stance): MotionState {
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
      ...(state.board.segmentRolls?{segmentRolls:{front:-state.board.segmentRolls.front,rear:-state.board.segmentRolls.rear}}:{}),
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
    gaze: mirror(state.gaze),
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
