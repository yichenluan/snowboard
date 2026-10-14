import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BODY,
  boardToWorld,
  boardVectorToWorld,
  sampleMotion,
  sampleTrail,
  type Mode,
  type Vec3,
} from "../prototype/motion.ts";

const distance = (a: Vec3, b: Vec3) =>
  Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const modes: Mode[] = ["correct", "error", "drill"];
const close = (a: number, b: number, tolerance = 1e-8) =>
  assert.ok(Math.abs(a - b) < tolerance, `${a} should equal ${b}`);
const vectorClose = (a: Vec3, b: Vec3, tolerance = 1e-8) =>
  a.forEach((n, i) => close(n, b[i], tolerance));
const mirrored = (v: Vec3): Vec3 => [-v[0], v[1], v[2]];

test("all authored poses retain limb lengths and locked bindings", () => {
  for (const mode of modes)
    for (const stance of ["regular", "goofy"] as const)
      for (const hold of [0, 0.3, 0.55, 0.75]) {
        for (let i = 0; i <= 240; i++) {
          const s = sampleMotion(i / 240, mode, stance, hold);
          const j = s.joints;
          for (const [hip, knee, ankle] of [
            [j.frontHip, j.frontKnee, j.frontAnkle],
            [j.rearHip, j.rearKnee, j.rearAnkle],
          ]) {
            close(distance(hip, knee), BODY.thigh);
            close(distance(knee, ankle), BODY.shin);
            assert.ok(ankle[1] > 0.06);
          }
          for (const [shoulder, elbow, hand] of [
            [j.frontShoulder, j.frontElbow, j.frontHand],
            [j.rearShoulder, j.rearElbow, j.rearHand],
          ]) {
            close(distance(shoulder, elbow), BODY.upperArm);
            close(distance(elbow, hand), BODY.forearm);
          }
          vectorClose(
            j.frontAnkle,
            boardToWorld([BODY.stanceWidth / 2, BODY.ankleHeight, 0], s.board),
          );
          vectorClose(
            j.rearAnkle,
            boardToWorld([-BODY.stanceWidth / 2, BODY.ankleHeight, 0], s.board),
          );
          vectorClose(
            s.boots.front.position,
            boardToWorld(s.boots.front.localPosition, s.board),
          );
          vectorClose(
            s.boots.rear.position,
            boardToWorld(s.boots.rear.localPosition, s.board),
          );
          close(Math.hypot(...s.travel), 1);
          close(Math.hypot(...s.normal), 1);
          close(s.contact[1], 0);
          for (const v of Object.values(j))
            for (const value of v) assert.ok(Number.isFinite(value));
          assert.ok(
            s.metrics.frontKnee > 15 && s.metrics.frontKnee < 120,
            `front knee ${s.metrics.frontKnee}`,
          );
          assert.ok(
            s.metrics.rearKnee > 15 && s.metrics.rearKnee < 120,
            `rear knee ${s.metrics.rearKnee}`,
          );
        }
      }
});

test("regular and goofy are world reflections, with the same front binding and target edge", () => {
  for (const mode of modes)
    for (let i = 0; i <= 160; i++) {
      const r = sampleMotion(i / 160, mode, "regular");
      const g = sampleMotion(i / 160, mode, "goofy");
      for (const name of Object.keys(r.joints) as Array<keyof typeof r.joints>)
        vectorClose(g.joints[name], mirrored(r.joints[name]));
      vectorClose(g.board.position, mirrored(r.board.position));
      vectorClose(g.com, mirrored(r.com));
      vectorClose(g.travel, mirrored(r.travel));
      vectorClose(
        g.boots.front.toeDirection,
        mirrored(r.boots.front.toeDirection),
      );
      vectorClose(
        g.boots.rear.toeDirection,
        mirrored(r.boots.rear.toeDirection),
      );
      assert.equal(g.edge, r.edge);
      assert.equal(g.half, r.half);
      close(g.metrics.frontKnee, r.metrics.frontKnee);
    }
});

test("knees bend to each boot toe side independently", () => {
  for (const mode of modes)
    for (const stance of ["regular", "goofy"] as const)
      for (let i = 0; i <= 160; i++) {
        const s = sampleMotion(i / 160, mode, stance);
        for (const side of ["front", "rear"] as const) {
          const hip = s.joints[`${side}Hip`],
            knee = s.joints[`${side}Knee`],
            ankle = s.joints[`${side}Ankle`];
          const mid: Vec3 = [
            (hip[0] + ankle[0]) / 2,
            (hip[1] + ankle[1]) / 2,
            (hip[2] + ankle[2]) / 2,
          ];
          const bend: Vec3 = [
            knee[0] - mid[0],
            knee[1] - mid[1],
            knee[2] - mid[2],
          ];
          assert.ok(dot(bend, s.boots[side].toeDirection) > 0.04);
        }
      }
});

test("the low edge remains uphill of the side-slip direction", () => {
  for (const mode of modes)
    for (const stance of ["regular", "goofy"] as const)
      for (let i = 0; i <= 400; i++) {
        const s = sampleMotion(i / 400, mode, stance, 0.55);
        if (s.edge === "flat") continue;
        const lowEdge = boardVectorToWorld(
          [0, 0, Math.sign(s.board.roll)],
          s.board,
        );
        assert.ok(
          dot(lowEdge, s.travel) < 0.0001,
          `downhill edge in ${mode}/${stance}/${i}`,
        );
      }
});

test("cycle joins are continuous up to downhill translation", () => {
  for (const mode of modes)
    for (const hold of [0, 0.3, 0.55, 0.75]) {
      const first = sampleMotion(0, mode, "regular", hold);
      const last = sampleMotion(1, mode, "regular", hold);
      close(first.board.yaw, last.board.yaw);
      close(first.board.roll, last.board.roll);
      const z = last.board.position[2] - first.board.position[2];
      vectorClose(last.com, [first.com[0], first.com[1], first.com[2] + z]);
      for (const name of Object.keys(first.joints) as Array<
        keyof typeof first.joints
      >) {
        vectorClose(last.joints[name], [
          first.joints[name][0],
          first.joints[name][1],
          first.joints[name][2] + z,
        ]);
      }
      for (const boundary of [0, 0.5, 1]) {
        const before = sampleMotion(boundary - 1e-5, mode, "regular", hold);
        const after = sampleMotion(boundary + 1e-5, mode, "regular", hold);
        assert.ok(
          distance(before.joints.head, after.joints.head) < 0.003,
          `${mode} head jump at ${boundary}`,
        );
        assert.ok(
          distance(before.board.position, after.board.position) < 0.003,
        );
        assert.ok(Math.abs(before.board.yaw - after.board.yaw) < 0.003);
      }
    }
});

test("shortening the drill wait changes waiting only, not the authored turn geometry", () => {
  for (const progress of [0, 0.1, 0.3, 0.5, 0.8, 1 - 1e-8]) {
    const a = sampleMotion(
      (0.65 + 0.35 * progress) / 2,
      "drill",
      "regular",
      0.65,
    );
    const b = sampleMotion(
      (0.15 + 0.85 * progress) / 2,
      "drill",
      "regular",
      0.15,
    );
    close(a.board.position[0], b.board.position[0]);
    close(a.board.yaw, b.board.yaw);
    close(a.board.roll, b.board.roll);
    close(a.metrics.frontKnee, b.metrics.frontKnee);
  }
});

test("drill nose turns monotonically through downhill without overshoot or reversal", () => {
  for (const half of [0, 1]) {
    let previous = sampleMotion(half / 2, "drill", "regular", 0).board.yaw;
    for (let i = 1; i < 500; i++) {
      const current = sampleMotion(half / 2 + i / 1000, "drill", "regular", 0)
        .board.yaw;
      assert.ok(current >= -Math.PI - 1e-8 && current <= 1e-8);
      assert.ok(
        half === 0 ? current <= previous + 1e-8 : current >= previous - 1e-8,
      );
      previous = current;
    }
  }
});

test("travel arrow agrees with the derivative of the actual authored path", () => {
  for (const mode of modes)
    for (let i = 1; i < 300; i++) {
      const time = i / 300;
      const before = sampleMotion(time - 1e-6, mode);
      const now = sampleMotion(time, mode);
      const after = sampleMotion(time + 1e-6, mode);
      const delta: Vec3 = [
        after.board.position[0] - before.board.position[0],
        0,
        after.board.position[2] - before.board.position[2],
      ];
      const length = Math.hypot(...delta);
      const direction = delta.map((n) => n / length) as Vec3;
      vectorClose(direction, now.travel, 1e-5);
    }
});

test("output is deterministic and requires no window, DOM, or viewport", () => {
  for (const mode of modes) {
    assert.deepEqual(sampleMotion(0.36, mode), sampleMotion(0.36, mode));
    const trail = sampleTrail(mode, "regular", 0.55, 120);
    assert.equal(trail.length, 121);
    assert.ok(trail[120][2] > trail[0][2]);
    trail.forEach((point) =>
      point.forEach((n) => assert.ok(Number.isFinite(n))),
    );
    assert.deepEqual(
      sampleTrail(mode, "goofy", 0.55, 120),
      trail.map(mirrored),
    );
  }
});
