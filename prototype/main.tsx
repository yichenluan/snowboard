import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { sampleMotion, sampleTrail, type Mode, type Stance } from "./motion";
import { TeachingScene, TopMap, type View, type Layer } from "./scene";
import {
  MODES,
  phaseLabels,
  PRACTICE,
  SOURCES,
  BOUNDARY,
  getTeaching,
} from "./lesson";
import "./styles.css";

const views: { id: View; label: string }[] = [
  { id: "follow", label: "整体" },
  { id: "side", label: "看前后重心" },
  { id: "front", label: "看髋与反弓" },
  { id: "boots", label: "看雪靴与高背" },
];
const edgeName = {
  toe: "前刃 · 脚尖侧",
  heel: "后刃 · 脚跟侧",
  flat: "接近放平",
};
function App() {
  const [mode, setMode] = useState<Mode>(() => {
    const m = new URLSearchParams(location.search).get("mode");
    return m === "error" || m === "drill" ? m : "correct";
  });
  const [time, setTime] = useState(() => {
      const value = new URLSearchParams(location.search).get("t");
      return value !== null && Number.isFinite(+value)
        ? Math.max(0, Math.min(1, +value))
        : 0.84;
    }),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(0.5),
    [loop, setLoop] = useState(false);
  const [stance, setStance] = useState<Stance>("regular"),
    [view, setView] = useState<View>("front"),
    [layer, setLayer] = useState<Layer>("posture");
  const [skeleton, setSkeleton] = useState(false),
    [motion, setMotion] = useState(true),
    [hold, setHold] = useState(0.55),
    [touchRotate, setTouchRotate] = useState(false),
    [reset, setReset] = useState(0);
  const state = useMemo(
    () => sampleMotion(Math.min(time, 1 - 1e-6), mode, stance, hold),
    [time, mode, stance, hold],
  );
  const trail = useMemo(
    () => sampleTrail(mode, stance, hold),
    [mode, stance, hold],
  );
  const lesson = getTeaching(
    mode,
    state.phase,
    state.half,
    state.edge,
    state.drillHolding,
  );
  const labels = phaseLabels(mode);
  const phaseTimes = useMemo(
    () =>
      labels.map((_, phase) => {
        const samples = Array.from(
          { length: 201 },
          (_, i) => (state.half + i / 200) / 2,
        ).filter((t) => {
          const s = sampleMotion(Math.min(t, 0.99999), mode, stance, hold);
          return s.phase === phase && !s.drillHolding && s.half === state.half;
        });
        return samples.length
          ? samples[Math.floor(samples.length * 0.35)]
          : (state.half + phase / 4) / 2;
      }),
    [state.half, mode, stance, hold],
  );
  useEffect(() => {
    if (!playing) return;
    let frame = 0,
      last = 0,
      accumulated = 0;
    const step = (now: number) => {
      if (!last) last = now;
      accumulated += Math.min(80, now - last);
      last = now;
      if (accumulated >= 32) {
        const dt = (accumulated / 16000) * speed;
        accumulated = 0;
        setTime((previous) => {
          const next = previous + dt;
          if (next >= 1) {
            if (loop) return next % 1;
            setPlaying(false);
            return 1;
          }
          return next;
        });
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    const pauseWhenHidden = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", pauseWhenHidden);
    };
  }, [playing, speed, loop]);
  const checkpoints = useMemo(
    () =>
      ([0, 1] as const).map((half) => {
        // Find the actual edge crossing in the SAME motion model, also
        // in the side-slip drill. No independent animation timeline.
        let lo = half / 2,
          hi = (half + 1) / 2 - 1e-6;
        const oldSign = Math.sign(
          sampleMotion(lo, mode, stance, hold).board.roll,
        );
        for (let i = 0; i < 24; i++) {
          const mid = (lo + hi) / 2;
          if (
            Math.sign(sampleMotion(mid, mode, stance, hold).board.roll) ===
            oldSign
          )
            lo = mid;
          else hi = mid;
        }
        const crossing = (lo + hi) / 2;
        const offset = 0.055 * (mode === "drill" ? 1 - hold : 1);
        return { half, crossing, offset };
      }),
    [mode, stance, hold],
  );
  const selectMode = (next: Mode) => {
    setPlaying(false);
    setMode(next);
    const url = new URL(location.href);
    url.searchParams.set("mode", next);
    history.replaceState(null, "", url);
    if (next === "drill") setTime(0);
  };
  const seek = (t: number) => {
    setPlaying(false);
    setTime(Math.max(0, Math.min(1, t)));
  };
  const selected = MODES.find((m) => m.id === mode)!;
  const togglePlay = () => {
    if (time >= 1) setTime(0);
    setPlaying((v) => !v);
  };
  const currentPhase = state.drillHolding ? "侧滑准备" : labels[state.phase];
  return (
    <main className="lab-page">
      <header className="lab-header">
        <div>
          <a className="lab-brand" href="../">
            ↗ 雪上笔记
          </a>
          <p className="lab-kicker">动作实验室 / 01</p>
          <h1 className="lab-title">把一次小回转，看清楚。</h1>
          <p className="lab-intro">
            身体怎样动，作用怎样传到板上，旧弯怎样接到新弯。先看整体，再暂停拆开观察。
          </p>
        </div>
        <div>
          <a className="lab-back" href="../#lesson=s-short-integrated">
            返回完整教学 ↗
          </a>
          <span className="lab-status">三维教学原型 · 后刃与换刃复核版</span>
        </div>
      </header>
      <nav className="mode-tabs" aria-label="选择教学模式">
        {MODES.map((m, i) => (
          <button
            key={m.id}
            data-mode={m.id}
            className={"mode-tab " + (mode === m.id ? "active" : "")}
            aria-pressed={mode === m.id}
            onClick={() => selectMode(m.id)}
          >
            <span>0{i + 1}</span>
            <strong>{m.shortTitle}</strong>
            <small>{m.intro}</small>
          </button>
        ))}
      </nav>
      <div className="lab-workspace">
        <section className="stage-column" aria-label="三维动作与播放控制">
          <div className="scene-shell">
            <header className="scene-header">
              <span className="scene-title">{selected.title}</span>
              <nav
                className="view-tabs"
                aria-label="切换预设视角，随后仍可拖动旋转"
              >
                {views.map((v) => (
                  <button
                    key={v.id}
                    className="view-tab"
                    onClick={() => {
                      setView(v.id);
                      setReset((n) => n + 1);
                    }}
                  >
                    {v.label}
                  </button>
                ))}
                <button
                  className={
                    "view-tab touch-rotate-toggle " +
                    (touchRotate ? "active" : "")
                  }
                  aria-pressed={touchRotate}
                  onClick={() => setTouchRotate((enabled) => !enabled)}
                >
                  触屏旋转：{touchRotate ? "开" : "关"}
                </button>
              </nav>
            </header>
            <div
              className="scene-canvas"
              aria-label="三维关节人偶与雪板"
              data-mode={mode}
              data-phase={state.phase}
              data-time={time.toFixed(4)}
              data-edge={state.edge}
              data-touch-rotate={touchRotate}
            >
              <TeachingScene
                state={state}
                trail={trail}
                time={time}
                mode={mode}
                stance={stance}
                hold={hold}
                view={view}
                layer={layer}
                skeleton={skeleton}
                motion={motion}
                reset={reset}
                touchRotate={touchRotate}
              />
              <div className="scene-overlay">
                <span className="scene-badge">{edgeName[state.edge]}</span>
                <span className="scene-badge">
                  {state.half === 0 ? "第 1 弯 → 前刃" : "第 2 弯 → 后刃"} ·{" "}
                  {currentPhase}
                </span>
              </div>
              <div className="scene-transport">
                <button
                  onClick={togglePlay}
                  aria-label={playing ? "画面内暂停" : "画面内播放"}
                >
                  {playing ? "Ⅱ" : "▶"}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  value={Math.round(time * 1000)}
                  aria-label="画面内动作进度"
                  onChange={(e) => seek(+e.target.value / 1000)}
                />
                <button
                  onClick={() =>
                    seek(
                      state.drillHolding
                        ? phaseTimes[0]
                        : state.phase < 3
                          ? phaseTimes[state.phase + 1]
                          : phaseTimes[0] + (state.half === 0 ? 0.5 : -0.5),
                    )
                  }
                  aria-label="观察下一阶段"
                >
                  下一阶段 →
                </button>
              </div>
              <div className="camera-hint">
                <span className="camera-mouse-hint">
                  鼠标拖动旋转 · 滚轮缩放 · 播放时保留观察角度
                </span>
                <span className="camera-touch-hint">
                  {touchRotate
                    ? "单指旋转 · 双指缩放 · 关闭触屏旋转可滑动页面"
                    : "手指上下滑动页面 · 开启“触屏旋转”可转动模型"}
                </span>
              </div>
            </div>
            <div className="scene-legend">
              {layer === "posture" ? (
                <>
                  <span className="legend-item">
                    <i style={{ background: "#c47745" }} />
                    前脚一侧腿
                  </span>
                  <span className="legend-item">
                    <i style={{ background: "#477c95" }} />
                    后脚一侧腿
                  </span>
                  <span className="legend-item">
                    <i style={{ background: "#13a38e" }} />
                    当前工作刃
                  </span>
                  <span className="legend-item">
                    <i style={{ background: "#bd8338" }} />
                    骨盆相对板的移动
                  </span>
                  <span className="legend-item">金点：人体质心估计</span>
                </>
              ) : (
                <>
                  <span className="legend-item">
                    <i style={{ background: "#ba6c38" }} />
                    重力
                  </span>
                  <span className="legend-item">
                    <i style={{ background: "#349583" }} />
                    雪面法向支持
                  </span>
                  <span className="legend-item">
                    <i style={{ background: "#8a6db1" }} />
                    抑制横向滑移的作用
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="layer-controls" aria-label="教学图层">
            <div className="view-tabs">
              <button
                className={"view-tab " + (layer === "posture" ? "active" : "")}
                aria-pressed={layer === "posture"}
                onClick={() => setLayer("posture")}
              >
                身体与运动
              </button>
              <button
                className={"view-tab " + (layer === "force" ? "active" : "")}
                aria-pressed={layer === "force"}
                onClick={() => setLayer("force")}
              >
                雪面与受力方向
              </button>
            </div>
            <label className="toggle-control">
              <input
                type="checkbox"
                checked={skeleton}
                onChange={(e) => setSkeleton(e.target.checked)}
              />
              透视关节
            </label>
            <label className="toggle-control">
              <input
                type="checkbox"
                checked={motion}
                disabled={layer === "force"}
                onChange={(e) => setMotion(e.target.checked)}
              />
              显示身体移动提示
            </label>
            <label className="toggle-control">
              前脚
              <select
                aria-label="前脚方向"
                value={stance}
                onChange={(e) => setStance(e.target.value as Stance)}
              >
                <option value="regular">左脚在前</option>
                <option value="goofy">右脚在前</option>
              </select>
            </label>
            <button
              className="reset-camera"
              onClick={() => {
                setView("follow");
                setReset((v) => v + 1);
              }}
            >
              重置视角
            </button>
          </div>
          {layer === "force" && (
            <p className="force-note">
              图中分开画作用方向，箭头长度不代表大小，也没有计算合力。缓坡坐标下，重力含沿坡分量；雪面作用箭头画在板中央便于阅读，起点只是排版锚点，不是接触点或压力中心。身体如何配合，见同步的阶段说明。
            </p>
          )}
          <section className="lab-timeline" aria-label="逐阶段观察">
            <div className="timeline-top">
              <button
                className="play-button"
                onClick={togglePlay}
                aria-label={playing ? "暂停演示" : "播放演示"}
              >
                {playing ? "Ⅱ 暂停" : "▶ 播放"}
              </button>
              <label>
                播放速度{" "}
                <select
                  aria-label="播放速度"
                  value={speed}
                  onChange={(e) => setSpeed(+e.target.value)}
                >
                  <option value={0.25}>0.25 倍</option>
                  <option value={0.5}>0.5 倍</option>
                  <option value={1}>1 倍</option>
                </select>
              </label>
              <label className="toggle-control">
                <input
                  type="checkbox"
                  checked={loop}
                  onChange={(e) => setLoop(e.target.checked)}
                />
                循环两弯
              </label>
            </div>
            <input
              className="timeline-range"
              type="range"
              min="0"
              max="1000"
              value={Math.round(time * 1000)}
              aria-label="完整两弯的动作进度"
              onChange={(e) => seek(+e.target.value / 1000)}
            />
            <div className="timeline-bottom">
              <button onClick={() => seek(0)}>回到起点</button>
              <span>
                第 1 弯 · 前刃 ← {Math.round(time * 100)}% → 第 2 弯 · 后刃
              </span>
              <button onClick={() => seek((state.half === 0 ? 0.5 : 0) + 0.09)}>
                看另一侧
              </button>
            </div>
            <nav className="phase-steps" aria-label="当前弯的四个阶段">
              {labels.map((name, i) => (
                <button
                  key={name}
                  className={
                    "phase-step " +
                    (!state.drillHolding && state.phase === i ? "active" : "")
                  }
                  aria-current={
                    !state.drillHolding && state.phase === i
                      ? "step"
                      : undefined
                  }
                  onClick={() => seek(phaseTimes[i])}
                >
                  <span>{i + 1}</span>
                  {name}
                </button>
              ))}
            </nav>
            <p className="prototype-note">
              点击阶段会暂停；拖动进度可逐帧观察。示意播放节奏不等于实际滑速。
            </p>
          </section>
          {mode !== "error" && (
            <section
              className="transition-inspector"
              aria-label="两种换刃的关键帧"
            >
              <strong>逐帧核对换刃</strong>
              <p>
                先减旧刃 → 低刃角过渡 →
                接入新刃。此例适量伸展过渡，屈曲换刃是另一种策略。身体移动提示不是发力箭头。
              </p>
              {checkpoints.map(({ half, crossing, offset }) => {
                return (
                  <div className="transition-row" key={half}>
                    <span>{half === 0 ? "后换前" : "前换后"}</span>
                    {[
                      { label: "减旧刃", at: crossing - offset },
                      { label: "近放平", at: crossing },
                      { label: "接新刃", at: crossing + offset },
                    ].map(({ label, at }) => (
                      <button
                        key={label}
                        onClick={() => seek(at)}
                        aria-label={`${half === 0 ? "后换前" : "前换后"}：${label}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                );
              })}
              <p>
                观察后刃：鞋底固定，靴筒由高背承托，膝髋仍能配合。观察前刃：膝向鞋头侧调节，髋跟上，胸口不抢先扑入。
              </p>
            </section>
          )}
          {mode === "drill" ? (
            <section className="drill-levels">
              <strong>循序渐进：只缩短侧滑等待</strong>
              <div className="view-tabs">
                {[
                  { n: 0.55, label: "① 较长侧滑" },
                  { n: 0.25, label: "② 缩短侧滑" },
                  { n: 0, label: "③ 连续接弯" },
                ].map((x) => (
                  <button
                    key={x.n}
                    className={"view-tab " + (hold === x.n ? "active" : "")}
                    aria-pressed={hold === x.n}
                    onClick={() => {
                      setHold(x.n);
                      seek(0);
                    }}
                  >
                    {x.label}
                  </button>
                ))}
              </div>
              <p>先恢复侧滑控制，再接下一弯。等待变短，释放和弧线仍要完整。</p>
            </section>
          ) : (
            <div className="comparison-hint">
              <button
                onClick={() =>
                  selectMode(mode === "error" ? "correct" : "error")
                }
              >
                {mode === "error" ? "切回正确示范" : "对照急甩尾横刹"}
              </button>
              <span>
                保留当前进度与视角，比较肩髋、双腿和板尾。两种示意的播放进度对齐，不代表真实用时相同。
              </span>
            </div>
          )}
        </section>
        <aside className="lesson-panel" aria-label="与动作同步的讲解">
          <p className="phase-kicker">
            {state.drillHolding ? "练习准备" : "阶段 0" + (state.phase + 1)} /{" "}
            {state.half === 0 ? "接入前刃" : "接入后刃"}
          </p>
          <h2 className="phase-title">{lesson.title}</h2>
          {mode === "error" && (
            <p className="error-banner">
              这是用来辨认问题的反例，请按正确示范与下方练习纠正。
            </p>
          )}
          <article className="teaching-card">
            <h3 className="teaching-label">身体怎样动</h3>
            <p className="teaching-text" data-teaching="action">
              {lesson.action}
            </p>
          </article>
          <article className="teaching-card" data-kind="force">
            <h3 className="teaching-label">作用怎样传到雪板</h3>
            <p className="teaching-text" data-teaching="force">
              {lesson.force}
            </p>
          </article>
          <p className="teaching-cue">{lesson.cue}</p>
          <div className="top-map">
            <TopMap
              state={state}
              trail={trail}
              time={time}
              stance={stance}
              mode={mode}
            />
            <p className="top-map-caption">
              同一时刻的俯视图 · 肩、髋、双腿来自同一三维模型
            </p>
          </div>
          <article className="teaching-card">
            <h3 className="teaching-label">看哪里，判断有没有做到</h3>
            <p className="teaching-text" data-teaching="observe">
              {lesson.observe}
            </p>
          </article>
        </aside>
      </div>
      <section className="practice-panel">
        <h2>{PRACTICE.title}</h2>
        <p>{PRACTICE.terrain}</p>
        <div className="practice-grid">
          <div>
            <h3>怎么做</h3>
            <ol>
              {PRACTICE.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </div>
          <div>
            <h3>做到什么再升级</h3>
            <ul>
              {PRACTICE.pass.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>出现什么就退一步</h3>
            <ul>
              {PRACTICE.reset.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <a href="../#lesson=s-short-diagnosis">查看完整纠错课 ↗</a>
          </div>
        </div>
      </section>
      <details className="source-panel">
        <summary>动作依据与示意范围</summary>
        <ul>
          {SOURCES.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.label} ↗
              </a>
              <p>{s.note}</p>
            </li>
          ))}
        </ul>
        <p className="prototype-note">{BOUNDARY}</p>
        <p className="prototype-note">
          正常示范选用轻微伸展过渡；伸展是否减压取决于动作时序，不能仅凭站高或蹲低判断。本例靴筒相对鞋底的前倾约为
          12–18°，只是这套示意装备的编排范围，不是雪靴通用上限，也不是临床踝角。人体质心由身体分段位置粗略估计，不测量肌肉激活、足底压力或关节负荷。
        </p>
      </details>
      <footer className="lab-footer">
        <span>雪上笔记 · 动作实验室 01</span>
        <a href="../">返回技术全景与 102 课 →</a>
        <span>Three.js + React Three Fiber · 2026.10</span>
      </footer>
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
