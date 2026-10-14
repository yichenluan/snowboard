import { Component, useEffect, useMemo, useRef, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  boardToWorld,
  sampleMotion,
  type MotionState,
  type Vec3,
  type Mode,
  type Stance,
} from "./motion";

export type View = "follow" | "side" | "front" | "free";
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

function Segment({
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
        color={color}
        roughness={0.75}
        transparent={transparent}
        opacity={transparent ? 0.36 : 1}
      />
    </mesh>
  );
}
function Ball({
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
  const hipYaw =
    Math.atan2(-hipAxis.z, hipAxis.x) + (stance === "regular" ? 0 : Math.PI);
  const q = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(b.roll, b.yaw, 0, "YXZ"),
  );
  const shoulderAxis = V(j.frontShoulder).sub(V(j.rearShoulder)).normalize();
  const facing = new THREE.Vector3(
    -shoulderAxis.z,
    0,
    shoulderAxis.x,
  ).multiplyScalar(stance === "regular" ? 1 : -1);
  const chestYaw = Math.atan2(facing.x, facing.z);
  const toeSign = stance === "regular" ? 1 : -1;
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
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
    const forward = V(state.boots[which].toeDirection).normalize();
    const right = new THREE.Vector3().crossVectors(up, forward).normalize();
    return new THREE.Quaternion().setFromRotationMatrix(
      new THREE.Matrix4().makeBasis(right, up, forward),
    );
  };
  return (
    <>
      <group position={b.position} quaternion={q}>
        <mesh
          geometry={boardGeometry}
          scale={[b.length / 1.58, 1, b.width / 0.31]}
        >
          <meshStandardMaterial color="#e7bc78" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.24, 0.032]} />
          <meshStandardMaterial color="#2f5459" />
        </mesh>
        <mesh
          position={[0.64, 0.011, 0]}
          rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        >
          <circleGeometry args={[0.055, 3]} />
          <meshBasicMaterial color="#365d61" side={THREE.DoubleSide} />
        </mesh>
      </group>
      {edgeSide !== 0 && <Polyline points={edgePoints} color={edgeColor} />}
      {(["front", "rear"] as const).map((which) => {
        const ankle = which === "front" ? j.frontAnkle : j.rearAnkle,
          quaternion = bootQuat(which);
        const local = (v: Vec3): Vec3 =>
          add(ankle, V(v).applyQuaternion(quaternion).toArray() as Vec3);
        return (
          <group key={which}>
            <mesh position={local([0, -0.094, 0.028])} quaternion={quaternion}>
              <boxGeometry args={[0.115, 0.085, 0.285]} />
              <meshStandardMaterial color="#eee9d9" roughness={0.9} />
            </mesh>
            <mesh position={local([0, 0.027, -0.045])} quaternion={quaternion}>
              <boxGeometry args={[0.108, 0.15, 0.115]} />
              <meshStandardMaterial color="#e2ddcd" roughness={0.9} />
            </mesh>
            <mesh position={local([0, -0.005, 0.055])} quaternion={quaternion}>
              <boxGeometry args={[0.129, 0.033, 0.064]} />
              <meshStandardMaterial
                color={which === "front" ? C.front : C.rear}
              />
            </mesh>
            <mesh position={local([0, -0.025, -0.125])} quaternion={quaternion}>
              <boxGeometry args={[0.12, 0.23, 0.02]} />
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
        rotation={[0, chestYaw, 0]}
        scale={[0.225, 0.185, 0.125]}
      >
        <sphereGeometry args={[1, 24, 16]} />
        <meshStandardMaterial
          color={C.body}
          transparent={xray}
          opacity={xray ? 0.32 : 1}
        />
      </mesh>
      <mesh
        position={j.pelvis}
        rotation={[0, hipYaw, 0]}
        scale={[0.185, 0.115, 0.125]}
      >
        <sphereGeometry args={[1, 24, 16]} />
        <meshStandardMaterial
          color={C.pants}
          transparent={xray}
          opacity={xray ? 0.32 : 1}
        />
      </mesh>
      <Segment a={j.chest} b={j.neck} r={0.065} color="#dcb18e" />
      <mesh
        position={j.head}
        rotation={[0, chestYaw, 0]}
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
        rotation={[0, chestYaw, 0]}
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
          <Arrow
            from={add(b.position, [0, 0.03, 0])}
            direction={state.travel}
            length={0.85}
            color="#3c768c"
          />
        </>
      )}
    </>
  );
}
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
      <Ball position={state.contact} r={0.035} color="#349583" />
      <Arrow
        from={state.contact}
        direction={[0, 1, 0]}
        length={0.9}
        color="#349583"
      />
      {Math.abs(sideSpeed) > 0.06 && (
        <Arrow
          from={add(state.contact, [0, 0.04, 0])}
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
}: {
  state: MotionState;
  view: View;
  reset: number;
}) {
  const { camera, gl, invalidate, size } = useThree();
  const controls = useMemo(
    () => new OrbitControls(camera, gl.domElement),
    [camera, gl],
  );
  const previous = useRef(V(state.board.position));
  const stateRef = useRef(state);
  stateRef.current = state;
  const poseCamera = () => {
    const s = stateRef.current,
      target = V(s.board.position).add(new THREE.Vector3(0, 0.8, 0)),
      yaw = s.board.yaw;
    const offset =
      view === "front"
        ? new THREE.Vector3(Math.cos(yaw) * 4.1, 1.2, -Math.sin(yaw) * 4.1)
        : view === "side"
          ? new THREE.Vector3(Math.sin(yaw) * 4.1, 1.1, Math.cos(yaw) * 4.1)
          : new THREE.Vector3(3.5, 2.05, 3.55);
    camera.position.copy(target).add(offset);
    camera.up.set(0, 1, 0);
    controls.target.copy(target);
    camera.lookAt(target);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = size.width < 500 ? 37 : 34;
      camera.updateProjectionMatrix();
    }
  };
  useEffect(() => {
    controls.enableDamping = false;
    controls.enablePan = false;
    controls.minDistance = 2.6;
    controls.maxDistance = 8;
    controls.minPolarAngle = 0.2;
    controls.maxPolarAngle = Math.PI * 0.47;
    const onChange = () => invalidate();
    controls.addEventListener("change", onChange);
    return () => {
      controls.removeEventListener("change", onChange);
      controls.dispose();
    };
  }, [controls, invalidate]);
  useEffect(() => {
    poseCamera();
    controls.update();
    gl.domElement.style.touchAction = view === "free" ? "none" : "pan-y";
    invalidate();
  }, [view, reset, size.width]);
  useFrame(() => {
    controls.enabled = view === "free";
    if (view === "free") {
      const now = V(state.board.position),
        delta = now.clone().sub(previous.current);
      camera.position.add(delta);
      controls.target.add(delta);
    } else poseCamera();
    previous.current.copy(V(state.board.position));
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
        ? ["重力", "雪面支持", "滑移阻力"]
        : ["骨盆", "前膝", "后膝"]
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
  }, [gl, enabled, layer]);
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
            add(state.contact, [0, 0.9, 0]),
            add(state.contact, [
              -Math.sign(slip) * lateral[0] * 0.65,
              0.04,
              -Math.sign(slip) * lateral[2] * 0.65,
            ]),
          ]
        : [state.joints.pelvis, state.joints.frontKnee, state.joints.rearKnee];
    const front = V(points[1]).project(camera),
      rear = V(points[2]).project(camera);
    labels.current.forEach((label, i) => {
      const projected = V(points[i]).project(camera);
      const dx =
        i === 0
          ? 18
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
class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="scene-fallback">
        <strong>当前设备未能打开三维画面</strong>
        <p>仍可使用轨迹、阶段说明与下方练习。</p>
        <a href="../#lesson=s-short-integrated">打开原有示意 →</a>
      </div>
    ) : (
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
}) {
  return (
    <SceneBoundary>
      <Canvas
        frameloop="demand"
        dpr={[1, 1.7]}
        camera={{ position: [4, 3, 5], fov: 34, near: 0.05, far: 120 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        fallback={
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
        <CameraRig state={state} view={view} reset={reset} />
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
      {state.edge !== "flat" && (
        <path
          d={path([
            boardToWorld([-0.69, 0, edgeSign * 0.14], b),
            boardToWorld([0.69, 0, edgeSign * 0.14], b),
          ])}
          stroke="#009b83"
          strokeWidth="3"
        />
      )}
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
        黄：板头朝向
      </text>
      <text x="221" y="211" fontSize="11" fill="#168c76">
        绿：工作刃
      </text>
    </svg>
  );
}
