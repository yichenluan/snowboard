import assert from "node:assert/strict";
import { test } from "node:test";
import {
  boardVectorToWorld,
  sampleMotion,
  type Mode,
  type Stance,
  type Vec3,
} from "../prototype/motion.ts";

const sub = (a: Vec3, b: Vec3): Vec3 => a.map((v, i) => v - b[i]) as Vec3;
const dot = (a: Vec3, b: Vec3) => a.reduce((sum, v, i) => sum + v * b[i], 0);
const length = (v: Vec3) => Math.hypot(...v);
const unit = (v: Vec3): Vec3 => v.map((n) => n / length(v)) as Vec3;
const midpoint = (a: Vec3, b: Vec3): Vec3 =>
  a.map((v, i) => (v + b[i]) / 2) as Vec3;
const modes: Mode[] = ["correct", "error", "drill"];
const stances: Stance[] = ["regular", "goofy"];

// These protect the authored teaching relationships, not biomechanical certification
// or a claim that one exact pose is mandatory for every rider and snow condition.
test("changing edges does not stretch the torso or manufacture a lumbar arch", () => {
  for (const mode of modes) {
    for (const stance of stances) {
      const reference = sampleMotion(0, mode, stance).joints;
      const chestLength = length(sub(reference.chest, reference.pelvis));
      const neckLength = length(sub(reference.neck, reference.chest));
      const headLength = length(sub(reference.head, reference.neck));
      for (let i = 0; i <= 400; i++) {
        const j = sampleMotion(i / 400, mode, stance).joints;
        const torso = sub(j.chest, j.pelvis);
        const neck = sub(j.neck, j.chest);
        const head = sub(j.head, j.neck);
        assert.ok(Math.abs(length(torso) - chestLength) < 1e-8);
        assert.ok(Math.abs(length(neck) - neckLength) < 1e-8);
        assert.ok(Math.abs(length(head) - headLength) < 1e-8);
        assert.ok(dot(unit(torso), unit(neck)) > 0.999999);
        assert.ok(dot(unit(torso), unit(head)) > 0.999999);
      }
    }
  }
});

test("the demonstration uses different hip and torso responses on toe and heel edges", () => {
  for (const mode of ["correct", "drill"] as const) {
    for (const stance of stances) {
      const counted = { toe: 0, heel: 0 };
      for (let i = 0; i < 400; i++) {
        const s = sampleMotion(i / 400, mode, stance);
        if (s.metrics.edgeAngle < 14 || s.edge === "flat") continue;
        const edge = s.edge;
        counted[edge]++;
        const boardSide = boardVectorToWorld(
          [0, 0, stance === "regular" ? 1 : -1],
          s.board,
        );
        const toe = unit([boardSide[0], 0, boardSide[2]]);
        const ankle = midpoint(s.joints.frontAnkle, s.joints.rearAnkle);
        const lower = sub(s.joints.pelvis, ankle);
        const torso = sub(s.joints.chest, s.joints.pelvis);
        const lowerTilt = Math.atan2(dot(lower, toe), lower[1]);
        const torsoTilt = Math.atan2(dot(torso, toe), torso[1]);
        if (edge === "toe") {
          assert.ok(
            dot(lower, toe) > 0.05,
            "toe edge should not leave the hips behind the ankles",
          );
          assert.ok(
            torsoTilt < lowerTilt - 0.04,
            "chest should not reach farther inward than the lower body",
          );
        } else {
          assert.ok(
            dot(lower, toe) < -0.05,
            "heel edge should move the pelvis toward the heels",
          );
          assert.ok(
            torsoTilt > lowerTilt + 0.04,
            "heel-side hip flexion should retain torso counterbalance",
          );
        }
      }
      assert.ok(
        counted.toe > 15 && counted.heel > 15,
        "both edge-control phases must be exercised",
      );
    }
  }
});
