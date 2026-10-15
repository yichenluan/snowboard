import { Component, useEffect, useMemo, useRef, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {surfaceHalfWidthAt,surfaceMeshData,surfaceRollAt} from "./board-surface";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  boardToWorld,
  BOOT_SETUP,
  sampleMotion,
  type MotionState,
  type Vec3,
  type Mode,
  type Stance,
} from "./motion";

export type View = "follow" | "side" | "front" | "boots";
export type Layer = "posture" | "force";
const C = {
  front: "#c47745",
  rear: "#477c95",
  body: "#275b58",
  pants: "#284552",
  snow: "#edf2ed",
  edge: "#13a38e",
  bone: "#ffdfa2",
};
const V = (a: Vec3) => new THREE.Vector3(...a);
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mid = (a: Vec3, b: Vec3): Vec3 => [
  (a[0] + b[0]) / 2,
  (a[1] + b[1]) / 2,
  (a[2] + b[2]) / 2,
];

export function Segment({
  a,
  b,
  r = 0.045,
  color,
  transparent = false,
}: {
  a: Vec3;
  b: Vec3;
  r?: number;
  color: string;
  transparent?: boolean;
}) {
  const direction = V(b).sub(V(a));
  const q = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize(),
  );
  return (
    <mesh position={mid(a, b)} quaternion={q}>
      <capsuleGeometry
        args={[r, Math.max(0.001, direction.length() - r * 2), 5, 10]}
      />
      <meshStandardMaterial
        key={transparent ? "xray" : "solid"}
        color={color}
        roughness={0.75}
        transparent={transparent}
        opacity={transparent ? 0.36 : 1}
        depthWrite={!transparent}
      />
    </mesh>
  );
}
export function Ball({
  position,
  r = 0.04,
  color,
}: {
  position: Vec3;
  r?: number;
  color: string;
}) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[r, 16, 12]} />
      <meshStandardMaterial color={color} roughness={0.6} />
    </mesh>
  );
}
function Polyline({
  points,
  color,
  dashed = false,
}: {
  points: Vec3[];
  color: string;
  dashed?: boolean;
}) {
  const line = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points.map(V));
    const material = dashed
      ? new THREE.LineDashedMaterial({ color, dashSize: 0.08, gapSize: 0.06 })
      : new THREE.LineBasicMaterial({ color });
    const result = new THREE.Line(geometry, material);
    result.computeLineDistances();
    return result;
  }, [points, color, dashed]);
  useEffect(
    () => () => {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    },
    [line],
  );
  return <primitive object={line} />;
}
function Arrow({
  from,
  direction,
  length = 0.65,
  color,
}: {
  from: Vec3;
  direction: Vec3;
  length?: number;
  color: string;
}) {
  const arrow = useMemo(
    () =>
      new THREE.ArrowHelper(
        V(direction).normalize(),
        V(from),
        length,
        color,
        0.12,
        0.065,
      ),
    [],
  );
  useEffect(() => {
    arrow.position.copy(V(from));
    arrow.setDirection(V(direction).normalize());
    arrow.setLength(length, 0.12, 0.065);
    arrow.setColor(color);
  }, [from, direction, length, color, arrow]);
  useEffect(() => () => arrow.dispose(), [arrow]);
  return <primitive object={arrow} />;
}
const shape = new THREE.Shape();
shape.moveTo(-0.79, 0);
shape.quadraticCurveTo(-0.79, 0.16, -0.64, 0.155);
shape.bezierCurveTo(-0.28, 0.123, 0.28, 0.123, 0.64, 0.155);
shape.quadraticCurveTo(0.79, 0.16, 0.79, 0);
shape.quadraticCurveTo(0.79, -0.16, 0.64, -0.155);
shape.bezierCurveTo(0.28, -0.123, -0.28, -0.123, -0.64, -0.155);
shape.quadraticCurveTo(-0.79, -0.16, -0.79, 0);
const boardGeometry = new THREE.ExtrudeGeometry(shape, {
  depth: 0.025,
  bevelEnabled: true,
  bevelSegments: 2,
  steps: 1,
  bevelSize: 0.004,
  bevelThickness: 0.003,
  curveSegments: 20,
});
boardGeometry.rotateX(Math.PI / 2);
boardGeometry.translate(0, 0.0125, 0);
// Keep decals above the extruded top, including its 3 mm bevel.
const rigidDeckMarkHeight = 0.025 / 2 + 0.003 + 0.001;

/** A continuous optional torsion skin. Bindings still use rigid local frames. */
function TwistedDeck({board}:{board:MotionState["board"]}) {
  const front=board.segmentRolls!.front,rear=board.segmentRolls!.rear;
  const geometry=useMemo(()=>{
    const data=surfaceMeshData(board),g=new THREE.BufferGeometry();
    g.setAttribute("position",new THREE.Float32BufferAttribute(data.positions,3));g.setIndex(data.indices);g.computeVertexNormals();return g;
  },[front,rear,board.length,board.width,board.thickness]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  const stripe=Array.from({length:41},(_,i)=>boardToWorld([-.62+1.24*i/40,board.thickness/2+.002,0],board));
  const nose=[[.70,0],[.60,-.035],[.60,.035],[.70,0]].map(([x,z])=>boardToWorld([x,board.thickness/2+.003,z],board));
  return <>
    <group position={board.position} rotation={[0,board.yaw,0]}><mesh geometry={geometry}><meshStandardMaterial color="#e7bc78" roughness={.8}/></mesh></group>
    <Polyline points={stripe} color="#2f5459"/><Polyline points={nose} color="#365d61"/>
    {(["front","rear"] as const).map(which=>{
      const roll=board.segmentRolls![which];if(Math.abs(roll)<.008)return null;
      const points=Array.from({length:21},(_,i)=>{
        const x=which==="front"?.16+.57*i/20:-.73+.57*i/20;
        return boardToWorld([x,board.thickness/2+.002,Math.sign(roll)*surfaceHalfWidthAt(x,board)],board);
      });
      return <Polyline key={which} points={points} color="#009b83"/>;
    })}
  </>;
}

function Rider({
  state,
  skeleton,
  layer,
  stance,
}: {
  state: MotionState;
  skeleton: boolean;
  layer: Layer;
  stance: Stance;
}) {
  const j = state.joints,
    b = state.board;
  const xray = skeleton || layer === "force";
  const hipAxis = V(j.frontHip).sub(V(j.rearHip));
  const q = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(b.roll, b.yaw, 0, "YXZ"),
  );
  const shoulderAxis = V(j.frontShoulder).sub(V(j.rearShoulder)).normalize();
  const toeSign = stance === "regular" ? 1 : -1;
  const torsoUp = V(j.neck).sub(V(j.pelvis)).normalize();
  // Orient the visible body from the same joint frame as the skeleton.
  const bodyFrame = (axis: THREE.Vector3) => {
    const right = axis.clone().normalize().multiplyScalar(toeSign);
    const up = torsoUp
      .clone()
      .addScaledVector(right, -torsoUp.dot(right))
      .normalize();
    const forward = new THREE.Vector3().crossVectors(right, up).normalize();
    return new THREE.Quaternion().setFromRotationMatrix(
      new THREE.Matrix4().makeBasis(right, up, forward),
    );
  };
  const chestQuaternion = bodyFrame(shoulderAxis);
  const hipQuaternion = bodyFrame(hipAxis);
  const facing = V(state.gaze);
  const headRight = new THREE.Vector3()
    .crossVectors(new THREE.Vector3(0, 1, 0), facing)
    .normalize();
  const headQuaternion = new THREE.Quaternion().setFromRotationMatrix(
    new THREE.Matrix4().makeBasis(
      headRight,
      new THREE.Vector3(0, 1, 0),
      facing,
    ),
  );
  const edgeSide =
    state.edge === "toe" ? toeSign : state.edge === "heel" ? -toeSign : 0;
  const edgeColor = new THREE.Color("#d2e1d9")
    .lerp(new THREE.Color(C.edge), Math.min(1, Math.abs(b.roll) / 0.25))
    .getStyle();
  const edgePoints = Array.from({ length: 29 }, (_, i): Vec3 => {
    const x = -0.7 + i * 0.05;
    return boardToWorld(
      [
        x,
        0.022,
        (edgeSide *
          (0.127 + 0.025 * Math.pow(Math.abs(x) / 0.7, 2)) *
          b.width) /
          0.31,
      ],
      b,
    );
  });
  const bootQuat = (which: "front" | "rear") => {
    const up = V(state.boots[which].up).normalize();
    const forward = V(state.boots[which].toeDirection).normalize();
    const right = new THREE.Vector3().crossVectors(up, forward).normalize();
    return new THREE.Quaternion().setFromRotationMatrix(
      new THREE.Matrix4().makeBasis(right, up, forward),
    );
  };
  return (
    <>
      {b.segmentRolls?<TwistedDeck board={b}/>:<group position={b.position} quaternion={q}>
        <mesh
          geometry={boardGeometry}
          scale={[b.length / 1.58, 1, b.width / 0.31]}
        >
          <meshStandardMaterial color="#e7bc78" roughness={0.8} />
        </mesh>
        <mesh position={[0, rigidDeckMarkHeight, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.24, 0.032]} />
          <meshStandardMaterial color="#2f5459" />
        </mesh>
        <mesh
          position={[0.64, rigidDeckMarkHeight, 0]}
          rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        >
          <circleGeometry args={[0.055, 3]} />
          <meshBasicMaterial color="#365d61" side={THREE.DoubleSide} />
        </mesh>
      </group>}
      {!b.segmentRolls&&edgeSide !== 0 && <Polyline points={edgePoints} color={edgeColor} />}
      {(["front", "rear"] as const).map((which) => {
        const ankle = which === "front" ? j.frontAnkle : j.rearAnkle,
          quaternion = bootQuat(which);
        const local = (v: Vec3): Vec3 =>
          add(ankle, V(v).applyQuaternion(quaternion).toArray() as Vec3);
        const knee = which === "front" ? j.frontKnee : j.rearKnee;
        const shinUp = V(knee).sub(V(ankle)).normalize();
        const toeDirection = V(state.boots[which].toeDirection);
        const shinForward = toeDirection
          .clone()
          .addScaledVector(shinUp, -toeDirection.dot(shinUp))
          .normalize();
        const shinRight = new THREE.Vector3()
          .crossVectors(shinUp, shinForward)
          .normalize();
        const cuffQuaternion = new THREE.Quaternion().setFromRotationMatrix(
          new THREE.Matrix4().makeBasis(shinRight, shinUp, shinForward),
        );
        const cuffPosition = V(ankle)
          .addScaledVector(shinUp, 0.055)
          .toArray() as Vec3;
        // Highback belongs to the binding, not the animated shin. At the heel
        // control pose its front face meets the cuff's rear face. On toe flexion
        // the cuff can move forward away from it while the sole stays fixed.
        const highbackQuaternion = quaternion
          .clone()
          .multiply(
            new THREE.Quaternion().setFromAxisAngle(
              new THREE.Vector3(1, 0, 0),
              (BOOT_SETUP.highbackLean * Math.PI) / 180,
            ),
          );
        const highbackUp = new THREE.Vector3(0, 1, 0).applyQuaternion(
          highbackQuaternion,
        );
        const highbackForward = new THREE.Vector3(0, 0, 1).applyQuaternion(
          highbackQuaternion,
        );
        const highbackPosition = V(ankle)
          .addScaledVector(highbackUp, 0.055)
          .addScaledVector(highbackForward, -0.07)
          .toArray() as Vec3;
        return (
          <group key={which}>
            <mesh position={local([0, -0.094, 0.028])} quaternion={quaternion}>
              <boxGeometry args={[0.115, 0.085, 0.285]} />
              <meshStandardMaterial color="#eee9d9" roughness={0.9} />
            </mesh>
            <mesh position={cuffPosition} quaternion={cuffQuaternion}>
              <boxGeometry args={[0.108, 0.21, 0.12]} />
              <meshStandardMaterial color="#e2ddcd" roughness={0.9} />
            </mesh>
            <mesh position={local([0, -0.005, 0.055])} quaternion={quaternion}>
              <boxGeometry args={[0.129, 0.033, 0.064]} />
              <meshStandardMaterial
                color={which === "front" ? C.front : C.rear}
              />
            </mesh>
            <mesh position={highbackPosition} quaternion={highbackQuaternion}>
              <boxGeometry args={[0.12, 0.21, 0.02]} />
              <meshStandardMaterial color="#354b55" />
            </mesh>
          </group>
        );
      })}
      <Segment
        a={j.pelvis}
        b={j.chest}
        r={0.145}
        color={C.body}
        transparent={xray}
      />
      <mesh
        position={j.chest}
        quaternion={chestQuaternion}
        scale={[0.225, 0.185, 0.125]}
      >
        <sphereGeometry args={[1, 24, 16]} />
        <meshStandardMaterial
          key={xray ? "xray" : "solid"}
          color={C.body}
          transparent={xray}
          opacity={xray ? 0.32 : 1}
          depthWrite={!xray}
        />
      </mesh>
      <mesh
        position={j.pelvis}
        quaternion={hipQuaternion}
        scale={[0.185, 0.115, 0.125]}
      >
        <sphereGeometry args={[1, 24, 16]} />
        <meshStandardMaterial
          key={xray ? "xray" : "solid"}
          color={C.pants}
          transparent={xray}
          opacity={xray ? 0.32 : 1}
          depthWrite={!xray}
        />
      </mesh>
      <Segment a={j.chest} b={j.neck} r={0.065} color="#dcb18e" />
      <mesh
        position={j.head}
        quaternion={headQuaternion}
        scale={[0.12, 0.145, 0.13]}
      >
        <sphereGeometry args={[1, 24, 20]} />
        <meshStandardMaterial color="#253d4b" roughness={0.6} />
      </mesh>
      <mesh
        position={add(
          j.head,
          facing.clone().multiplyScalar(0.115).toArray() as Vec3,
        )}
        quaternion={headQuaternion}
        scale={[0.104, 0.041, 0.025]}
      >
        <sphereGeometry args={[1, 20, 12]} />
        <meshStandardMaterial
          color="#d99b55"
          metalness={0.15}
          roughness={0.35}
        />
      </mesh>
      {(["front", "rear"] as const).map((which) => {
        const front = which === "front",
          color = front ? C.front : C.rear;
        const hip = front ? j.frontHip : j.rearHip,
          knee = front ? j.frontKnee : j.rearKnee,
          ankle = front ? j.frontAnkle : j.rearAnkle;
        const shoulder = front ? j.frontShoulder : j.rearShoulder,
          elbow = front ? j.frontElbow : j.rearElbow,
          hand = front ? j.frontHand : j.rearHand;
        return (
          <group key={which}>
            <Segment
              a={hip}
              b={knee}
              r={0.077}
              color={color}
              transparent={xray}
            />
            <Segment
              a={knee}
              b={ankle}
              r={0.055}
              color={color}
              transparent={xray}
            />
            <Ball position={knee} r={0.065} color={color} />
            <Segment
              a={shoulder}
              b={elbow}
              r={0.049}
              color={C.body}
              transparent={xray}
            />
            <Segment
              a={elbow}
              b={hand}
              r={0.037}
              color={C.body}
              transparent={xray}
            />
            <Ball position={hand} r={0.043} color="#284552" />
            {skeleton && (
              <>
                <Segment a={hip} b={knee} r={0.015} color={C.bone} />
                <Segment a={knee} b={ankle} r={0.015} color={C.bone} />
                <Segment a={shoulder} b={elbow} r={0.012} color={C.bone} />
                <Segment a={elbow} b={hand} r={0.012} color={C.bone} />
                {[hip, knee, ankle, shoulder, elbow].map((p, i) => (
                  <Ball key={i} position={p} r={0.025} color={C.bone} />
                ))}
              </>
            )}
          </group>
        );
      })}
      {skeleton && (
        <>
          <Segment a={j.pelvis} b={j.chest} r={0.017} color={C.bone} />
          <Polyline
            points={[j.frontShoulder, j.rearShoulder]}
            color="#efc36e"
          />
          <Polyline points={[j.frontHip, j.rearHip]} color="#efc36e" />
        </>
      )}
      {layer === "posture" && (
        <>
          <Ball position={state.com} r={0.035} color="#e1a84d" />
          <Polyline
            points={[state.com, [state.com[0], 0.015, state.com[2]]]}
            color="#b5914b"
            dashed
          />
          {Math.hypot(...state.travel) > 0.001 && <Arrow
            from={add(b.position, [0, 0.03, 0])}
            direction={state.travel}
            length={0.85}
            color="#3c768c"
          />}
        </>
      )}
    </>
  );
}
/** Direction-diagram anchor, deliberately NOT the low edge / pressure centre. */
const forceAnchor = (state: MotionState): Vec3 => [
  state.board.position[0],
  0.07,
  state.board.position[2],
];
function Forces({ state }: { state: MotionState }) {
  const lateral: Vec3 = [
    Math.sin(state.board.yaw),
    0,
    Math.cos(state.board.yaw),
  ];
  const sideSpeed = state.travel[0] * lateral[0] + state.travel[2] * lateral[2];
  const resistance = lateral.map((v) => -Math.sign(sideSpeed) * v) as Vec3;
  return (
    <>
      <Ball position={state.com} r={0.04} color="#ba6c38" />
      <Arrow
        from={state.com}
        direction={[0, -Math.cos(Math.PI / 18), Math.sin(Math.PI / 18)]}
        length={0.68}
        color="#ba6c38"
      />
      <Arrow
        from={forceAnchor(state)}
        direction={[0, 1, 0]}
        length={0.9}
        color="#349583"
      />
      {Math.abs(sideSpeed) > 0.06 && (
        <Arrow
          from={add(forceAnchor(state), [0, 0.04, 0])}
          direction={resistance}
          length={0.65}
          color="#8a6db1"
        />
      )}
    </>
  );
}
function MotionHints({
  state,
  time,
  mode,
  stance,
  hold,
}: {
  state: MotionState;
  time: number;
  mode: Mode;
  stance: Stance;
  hold: number;
}) {
  const next = sampleMotion(Math.min(0.9999, time + 0.012), mode, stance, hold),
    before = sampleMotion(Math.max(0, time - 0.012), mode, stance, hold);
  const d = V(sub(next.joints.pelvis, next.board.position)).sub(
    V(sub(before.joints.pelvis, before.board.position)),
  );
  return d.length() > 0.003 ? (
    <Arrow
      from={add(state.joints.pelvis, [0, 0.08, 0])}
      direction={d.normalize().toArray() as Vec3}
      length={0.28}
      color="#bd8338"
    />
  ) : null;
}
function CameraRig({
  state,
  view,
  reset,
  touchRotate,
}: {
  state: MotionState;
  view: View;
  reset: number;
  touchRotate: boolean;
}) {
  const { camera, gl, invalidate, size } = useThree();
  const controls = useMemo(
    () => new OrbitControls(camera, gl.domElement),
    [camera, gl],
  );
  const previous = useRef(V(state.board.position));
  const stateRef = useRef(state);
  stateRef.current = state;
  const touchRotateRef = useRef(touchRotate);
  touchRotateRef.current = touchRotate;
  const poseCamera = () => {
    const s = stateRef.current,
      target = V(s.board.position).add(
        new THREE.Vector3(0, view === "boots" ? 0.2 : 0.64, 0),
      ),
      yaw = s.board.yaw;
    const offset =
      view === "boots"
        ? new THREE.Vector3(
            Math.cos(yaw) * 1.7 + Math.sin(yaw) * 0.4,
            0.5,
            -Math.sin(yaw) * 1.7 + Math.cos(yaw) * 0.4,
          )
        : view === "front"
          ? new THREE.Vector3(Math.cos(yaw) * 4.1, 1.2, -Math.sin(yaw) * 4.1)
          : view === "side"
            ? new THREE.Vector3(Math.sin(yaw) * 4.1, 1.1, Math.cos(yaw) * 4.1)
            : new THREE.Vector3(3.5, 2.05, 3.55);
    camera.position.copy(target).add(offset);
    camera.up.set(0, 1, 0);
    controls.target.copy(target);
    camera.lookAt(target);
    previous.current.copy(V(s.board.position));
  };
  useEffect(() => {
    controls.enabled = true;
    controls.enableDamping = false;
    controls.enablePan = false;
    controls.minDistance = 1.1;
    controls.maxDistance = 8;
    controls.minPolarAngle = 0.2;
    controls.maxPolarAngle = Math.PI * 0.47;
    const onChange = () => invalidate();
    // Ignore touch input before OrbitControls captures it. Mouse controls stay
    // available while an ordinary finger drag can scroll the surrounding page.
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "touch" && !touchRotateRef.current) {
        event.stopImmediatePropagation();
      }
    };
    controls.addEventListener("change", onChange);
    gl.domElement.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      controls.removeEventListener("change", onChange);
      gl.domElement.removeEventListener("pointerdown", onPointerDown, true);
      controls.dispose();
    };
  }, [controls, gl, invalidate]);
  useEffect(() => {
    poseCamera();
    controls.update();
    invalidate();
  }, [view, reset]);
  useEffect(() => {
    gl.domElement.style.touchAction = touchRotate ? "none" : "pan-y pinch-zoom";
  }, [gl, touchRotate]);
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = size.width < 500 ? 37 : 34;
      camera.updateProjectionMatrix();
    }
    invalidate();
  }, [camera, size.width, invalidate]);
  useFrame(() => {
    // Presets establish a starting angle. Animation follows translation only,
    // so it never replaces the angle or distance chosen by the viewer.
    const now = V(state.board.position),
      delta = now.clone().sub(previous.current);
    camera.position.add(delta);
    controls.target.add(delta);
    previous.current.copy(now);
    controls.update();
  });
  return null;
}
function JointLabels({
  state,
  enabled,
  layer,
}: {
  state: MotionState;
  enabled: boolean;
  layer: Layer;
}) {
  const { camera, gl, size } = useThree();
  const labels = useRef<HTMLSpanElement[]>([]);
  useEffect(() => {
    if (!enabled) return;
    const host = gl.domElement.parentElement!;
    labels.current = (
      layer === "force"
        ? ["重力", "垂直雪面的作用", "侧向作用"]
        : state.rideDirection===-1?["骨盆","原前膝","原后膝","胸部"]:["骨盆", "前膝", "后膝", "胸部"]
    ).map((name, i) => {
      const label = document.createElement("span");
      label.textContent = name;
      Object.assign(label.style, {
        position: "absolute",
        left: "0",
        top: "0",
        pointerEvents: "none",
        fontSize: "11px",
        lineHeight: "20px",
        padding: "1px 7px",
        borderRadius: "4px",
        background: "#fffefae8",
        color:
          layer === "force"
            ? ["#ba6c38", "#349583", "#8a6db1"][i]
            : i === 1
              ? C.front
              : i === 2
                ? C.rear
                : "#3e6256",
        border: "1px solid #c6d5ca",
        whiteSpace: "nowrap",
      });
      host.appendChild(label);
      return label;
    });
    return () => {
      labels.current.forEach((e) => e.remove());
      labels.current = [];
    };
  }, [gl, enabled, layer,state.rideDirection]);
  useFrame(() => {
    const lateral: Vec3 = [
        Math.sin(state.board.yaw),
        0,
        Math.cos(state.board.yaw),
      ],
      slip = state.travel[0] * lateral[0] + state.travel[2] * lateral[2];
    const points =
      layer === "force"
        ? [
            add(state.com, [
              0,
              -0.68 * Math.cos(Math.PI / 18),
              0.68 * Math.sin(Math.PI / 18),
            ]),
            add(forceAnchor(state), [0, 0.9, 0]),
            add(forceAnchor(state), [
              -Math.sign(slip) * lateral[0] * 0.65,
              0.04,
              -Math.sign(slip) * lateral[2] * 0.65,
            ]),
          ]
        : [
            state.joints.pelvis,
            state.joints.frontKnee,
            state.joints.rearKnee,
            state.joints.chest,
          ];
    const front = V(points[1]).project(camera),
      rear = V(points[2]).project(camera);
    labels.current.forEach((label, i) => {
      const projected = V(points[i]).project(camera);
      const dx =
        i === 0
          ? 18
          : i === 3
            ? -62
            : (i === 1 ? front.x < rear.x : rear.x < front.x)
              ? -58
              : 15;
      const x = Math.max(
        4,
        Math.min(size.width - 55, ((projected.x + 1) * size.width) / 2 + dx),
      );
      const y = Math.max(
        55,
        Math.min(
          size.height - 50,
          ((1 - projected.y) * size.height) / 2 + (i === 0 ? -25 : 0),
        ),
      );
      label.style.transform = "translate(" + x + "px," + y + "px)";
      label.style.display =
        Math.abs(projected.x)>1 || Math.abs(projected.y)>1 || projected.z>1 ||
        layer === "force" && i === 2 && Math.abs(slip) <= 0.06
          ? "none"
          : "block";
    });
  });
  return null;
}
const groundLines: Vec3[][] = [];
for (let i = -10; i <= 14; i++)
  groundLines.push(
    [
      [-10, 0.002, i],
      [10, 0.002, i],
    ],
    [
      [i, 0.002, -10],
      [i, 0.002, 18],
    ],
  );
function Snow({
  trail,
  time,
  mode,
}: {
  trail: Vec3[];
  time: number;
  mode: Mode;
}) {
  const points = useMemo(
    () => trail.map((p) => [p[0], 0.009, p[2]] as Vec3),
    [trail],
  );
  const travelled = useMemo(
    () => points.slice(0, Math.max(2, Math.ceil(points.length * time))),
    [points, time],
  );
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.012, 4]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color={C.snow} roughness={1} />
      </mesh>
      {groundLines.map((p, i) => (
        <Polyline key={i} points={p} color="#d5dfd8" />
      ))}
      <Polyline points={points} color="#c1cfc7" dashed />
      <Polyline
        points={travelled}
        color={mode === "error" ? "#bd7551" : "#85aca3"}
      />
      <Arrow
        from={[-2.3, 0.04, 2.5]}
        direction={[0, 0, 1]}
        length={1.3}
        color="#90a49a"
      />
    </>
  );
}
export class SceneBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (this.props.fallback ?? (
      <div className="scene-fallback">
        <strong>当前设备未能打开三维画面</strong>
        <p>仍可使用轨迹、阶段说明与下方练习。</p>
        <a href="../#lesson=s-short-integrated">打开课内示意 →</a>
      </div>
    )) : (
      this.props.children
    );
  }
}
export function TeachingScene({
  state,
  trail,
  time,
  mode,
  stance,
  hold,
  view,
  layer,
  skeleton,
  motion,
  reset,
  touchRotate,
  fallback,
  supportRail,
  corridor,
  corridorSections,
}: {
  state: MotionState;
  trail: Vec3[];
  time: number;
  mode: Mode;
  stance: Stance;
  hold: number;
  view: View;
  layer: Layer;
  skeleton: boolean;
  motion: boolean;
  reset: number;
  touchRotate: boolean;
  fallback?: ReactNode;
  supportRail?: [Vec3, Vec3];
  corridor?: {width:number;start:number;end:number};
  corridorSections?: {width:number;start:number;end:number;label:string}[];
}) {
  return (
    <SceneBoundary fallback={fallback}>
      <Canvas
        frameloop="demand"
        dpr={[1, 1.7]}
        camera={{ position: [4, 3, 5], fov: 34, near: 0.05, far: 120 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        fallback={fallback ??
          <div className="scene-fallback">
            设备暂不支持三维显示；可继续查看轨迹和分阶段说明。
          </div>
        }
        onCreated={({ gl }) => {
          gl.setClearColor("#edf2ed");
        }}
      >
        <ambientLight intensity={1.6} />
        <hemisphereLight args={["#fbf8ea", "#6e8779", 1.8]} />
        <directionalLight position={[-3, 7, 4]} intensity={2.3} />
        <Snow trail={trail} time={time} mode={mode} />
        {corridor&&[-1,1].map(side=><Segment key={side} a={[side*corridor.width/2,.012,corridor.start]} b={[side*corridor.width/2,.012,corridor.end]} r={.018} color="#7c817a"/>)}
        {corridorSections?.map((section,i)=><group key={i}>{[-1,1].map(side=><Segment key={side} a={[side*section.width/2,.012,section.start]} b={[side*section.width/2,.012,section.end]} r={.018} color="#7c817a"/>)}</group>)}
        {supportRail&&<group><Segment a={supportRail[0]} b={supportRail[1]} r={0.024} color="#7c817a"/>{supportRail.map((p,i)=><Segment key={i} a={[p[0],0,p[2]]} b={p} r={0.024} color="#7c817a"/>)}</group>}
        <mesh
          position={[state.board.position[0], 0.001, state.board.position[2]]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[1, 0.36, 1]}
        >
          <circleGeometry args={[0.7, 32]} />
          <meshBasicMaterial
            color="#253d35"
            transparent
            opacity={0.08}
            depthWrite={false}
          />
        </mesh>
        <Rider
          state={state}
          skeleton={skeleton}
          layer={layer}
          stance={stance}
        />
        {layer === "force" ? (
          <Forces state={state} />
        ) : (
          motion && (
            <MotionHints
              state={state}
              time={time}
              mode={mode}
              stance={stance}
              hold={hold}
            />
          )
        )}
        <CameraRig
          state={state}
          view={view}
          reset={reset}
          touchRotate={touchRotate}
        />
        <JointLabels
          state={state}
          enabled={skeleton || layer === "force"}
          layer={layer}
        />
      </Canvas>
    </SceneBoundary>
  );
}
export function TopMap({
  state,
  trail,
  time,
  stance,
  mode,
}: {
  state: MotionState;
  trail: Vec3[];
  time: number;
  stance: Stance;
  mode: Mode;
}) {
  const minX = -2.5,
    maxX = 2.5,
    minZ = -0.6,
    maxZ = 11.32;
  const scale = Math.min(280 / (maxX - minX), 165 / (maxZ - minZ));
  const p = (v: Vec3) => [
    160 + (v[0] - (minX + maxX) / 2) * scale,
    24 + (v[2] - minZ) * scale,
  ];
  const str = (v: Vec3) => p(v).join(","),
    path = (ps: Vec3[]) => ps.map((v, i) => (i ? "L" : "M") + str(v)).join(" ");
  const b = state.board,
    corners: Vec3[] = [
      [-0.79, 0, -0.135],
      [0.79, 0, -0.135],
      [0.79, 0, 0.135],
      [-0.79, 0, 0.135],
    ];
  const edgeSign =
    (state.edge === "toe" ? 1 : -1) * (stance === "regular" ? 1 : -1);
  const boardLine = [
      boardToWorld([-0.79, 0, 0], b),
      boardToWorld([0.79, 0, 0], b),
    ],
    travelEnd = add(b.position, state.travel.map((x) => x * 0.9) as Vec3),
    j = state.joints;
  return (
    <svg
      viewBox="0 0 320 220"
      role="img"
      aria-label="与三维姿态同步的俯视路线：板头朝向、实际移动方向和两腿位置"
    >
      <defs>
        <marker
          id="map-travel-arrow"
          viewBox="0 0 8 8"
          refX="7"
          refY="4"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path d="M0 0L8 4L0 8Z" fill="#497b91" />
        </marker>
        <marker
          id="map-board-arrow"
          viewBox="0 0 8 8"
          refX="7"
          refY="4"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path d="M0 0L8 4L0 8Z" fill="#b17738" />
        </marker>
      </defs>
      <path
        d={path(trail)}
        fill="none"
        stroke="#dce7df"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path
        d={path(trail.slice(0, Math.max(2, Math.ceil(time * trail.length))))}
        fill="none"
        stroke={mode === "error" ? "#bd7551" : "#84aa9a"}
        strokeWidth="2"
      />
      <polygon
        points={corners.map((c) => str(boardToWorld(c, b))).join(" ")}
        fill="#e2be80"
        stroke="#98662f"
        strokeWidth="1"
      />
      {!b.segmentRolls&&state.edge !== "flat" && (
        <path
          d={path([
            boardToWorld([-0.69, 0, edgeSign * 0.14], b),
            boardToWorld([0.69, 0, edgeSign * 0.14], b),
          ])}
          stroke="#009b83"
          strokeWidth="3"
        />
      )}
      {b.segmentRolls&&(["front","rear"] as const).map(which=>{
        const roll=b.segmentRolls![which];if(Math.abs(roll)<.008)return null;
        const xs=which==="front"?[.16,.69]:[-.69,-.16];
        return <path key={which} d={path(xs.map(x=>boardToWorld([x,0,Math.sign(roll)*surfaceHalfWidthAt(x,b)],b)))} stroke="#009b83" strokeWidth="3"/>;
      })}
      <path
        d={path([
          j.frontAnkle,
          j.frontKnee,
          j.frontHip,
          j.rearHip,
          j.rearKnee,
          j.rearAnkle,
        ])}
        fill="none"
        stroke="#4c7166"
        strokeWidth="2"
      />
      <path
        d={path([j.frontShoulder, j.rearShoulder])}
        stroke="#294c50"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle
        cx={p(j.frontAnkle)[0]}
        cy={p(j.frontAnkle)[1]}
        r="3"
        fill={C.front}
      />
      <circle
        cx={p(j.rearAnkle)[0]}
        cy={p(j.rearAnkle)[1]}
        r="3"
        fill={C.rear}
      />
      <path
        d={path(boardLine)}
        stroke="#b17738"
        strokeWidth="2"
        markerEnd="url(#map-board-arrow)"
      />
      <path
        d={path([b.position, travelEnd])}
        stroke="#497b91"
        strokeWidth="2.5"
        markerEnd="url(#map-travel-arrow)"
      />
      <path d="M296 24v37m-4-5 4 5 4-5" stroke="#8a9c91" fill="none" />
      <text x="280" y="17" fontSize="11" fill="#6c8074">
        下坡
      </text>
      <text x="12" y="211" fontSize="11" fill="#497b91">
        蓝：移动方向
      </text>
      <text x="116" y="211" fontSize="11" fill="#a46e32">
        {state.rideDirection===-1?"黄：原板头":"黄：板头朝向"}
      </text>
      <text x="221" y="211" fontSize="11" fill="#168c76">
        {b.segmentRolls?"绿：各段较低板刃":"绿：工作刃"}
      </text>
    </svg>
  );
}
