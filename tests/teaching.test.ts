import assert from "node:assert/strict";
import { test } from "node:test";
import { getTeaching, PHASE_LABELS } from "../prototype/lesson.ts";
import { sampleMotion, type Mode } from "../prototype/motion.ts";

test("every motion sample has complete teaching and holding describes controlled side slipping", () => {
  const modes: Mode[] = ["correct", "error", "drill"];
  let holdSamples = 0;
  const observed = new Set<string>();
  for (const mode of modes)
    for (const stance of ["regular", "goofy"] as const)
      for (const hold of [0, 0.3, 0.55, 0.75]) {
        for (let i = 0; i < 400; i++) {
          const s = sampleMotion(i / 400, mode, stance, hold);
          const teaching = getTeaching(
            mode,
            s.phase,
            s.half,
            s.edge,
            s.drillHolding,
          );
          for (const key of [
            "title",
            "action",
            "force",
            "observe",
            "cue",
          ] as const) {
            assert.equal(typeof teaching[key], "string");
            assert.ok(
              teaching[key].trim().length > 4,
              `${mode}/${stance}/${key} missing at ${i}`,
            );
            assert.doesNotMatch(teaching[key], /undefined|NaN/);
          }
          observed.add(`${mode}/${stance}/${s.half}/${s.phase}`);
          if (s.drillHolding) {
            holdSamples++;
            assert.equal(mode, "drill");
            assert.match(teaching.title, /^稳住.*侧滑，再出发$/);
            assert.match(teaching.action, /雪板大致横坡/);
            assert.match(teaching.force, /上坡一侧的刃/);
            assert.match(teaching.cue, /稳住/);
            assert.equal(s.edge, s.half === 0 ? "heel" : "toe");
            assert.ok(
              Math.abs(Math.sin(s.board.yaw)) < 1e-8,
              "holding board should be transverse",
            );
            assert.ok(
              Math.abs(s.travel[0]) < 1e-8 &&
                Math.abs(s.travel[1]) < 1e-8 &&
                Math.abs(s.travel[2] - 1) < 1e-8,
            );
            assert.notEqual(
              teaching.title,
              getTeaching(mode, s.phase, s.half, s.edge, false).title,
            );
          } else {
            assert.equal(s.phaseName, PHASE_LABELS[s.phase]);
            assert.doesNotMatch(teaching.title, /^稳住.*侧滑，再出发$/);
          }
        }
      }
  assert.ok(
    holdSamples > 1000,
    "the test must exercise long and short waiting segments",
  );
  assert.equal(
    observed.size,
    3 * 2 * 2 * 4,
    "all four stages of both turns and both stances must be exercised",
  );
});

test("correct-mode stage text names the old edge on release and the target edge through the new turn", () => {
  for (const stance of ["regular", "goofy"] as const)
    for (const half of [0, 1] as const) {
      const target = half === 0 ? "toe" : "heel";
      const previous = half === 0 ? "heel" : "toe";
      const targetName = target === "toe" ? "前刃" : "后刃";
      const previousName = previous === "toe" ? "前刃" : "后刃";
      for (const [phase, progress] of [
        [0, 0.1],
        [1, 0.36],
        [2, 0.65],
        [3, 0.9],
      ] as const) {
        const s = sampleMotion((half + progress) / 2, "correct", stance);
        const teaching = getTeaching(
          "correct",
          s.phase,
          s.half,
          s.edge,
          s.drillHolding,
        );
        assert.equal(s.half, half);
        assert.equal(s.phase, phase);
        assert.equal(s.edge, phase === 0 ? previous : target);
        assert.ok(
          teaching.title.includes(phase === 0 ? previousName : targetName),
        );
        if (phase === 0) assert.match(teaching.title, /释放/);
        if (phase === 1) assert.match(teaching.title, /接入/);
        if (phase === 2) assert.match(teaching.title, /继续工作/);
        if (phase === 3) assert.match(teaching.title, /准备释放/);
      }
    }
});
