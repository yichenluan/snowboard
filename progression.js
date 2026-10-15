/* Ability relationships and personal self-checks. No automatic skill certification. */
(() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  const statusNames = {complete:'已通过自查', ready:'现在可练', locked:'先补前置', review:'需补核前置'};
  const safeUrl = value => { try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; } };

  function validate(map) {
    if (!map || !Array.isArray(map.nodes) || !map.nodes.length || !Array.isArray(map.stages) || !map.stages.length) return false;
    const ids = new Set(map.nodes.map(n => n?.id));
    const stages = new Set(map.stages.map(s => s?.id));
    if (ids.size !== map.nodes.length || ids.has(undefined)) return false;
    if (!Array.isArray(map.targets) || !Array.isArray(map.sources)) return false;
    if (map.targets.some(t => !t?.id || !t.title || !Array.isArray(t.nodeIds) || t.nodeIds.some(id => !ids.has(id)))) return false;
    if (map.sources.some(s => !s?.title || !s.url || !s.note)) return false;
    if (map.moduleLinks && Object.values(map.moduleLinks).some(links => !Array.isArray(links) || links.some(id => !ids.has(id)))) return false;
    for (const node of map.nodes) {
      if (!node.title || !stages.has(node.stage) || !Array.isArray(node.requires) || !Array.isArray(node.supports) || !Array.isArray(node.gate) || !Array.isArray(node.lessons)) return false;
      if ([...node.requires, ...node.supports].some(id => !ids.has(id) || id === node.id)) return false;
    }
    const visited = new Set(), active = new Set(), byId = new Map(map.nodes.map(n => [n.id, n]));
    function visit(id) {
      if (active.has(id)) return false;
      if (visited.has(id)) return true;
      active.add(id);
      if (!byId.get(id).requires.every(visit)) return false;
      active.delete(id); visited.add(id); return true;
    }
    return map.nodes.every(n => visit(n.id));
  }

  function analyze(map, progress = [], target = 'all') {
    const byId = new Map(map.nodes.map(n => [n.id, n]));
    const marked = new Set(Array.isArray(progress) ? progress.filter(id => byId.has(id)) : []);
    const complete = new Set(), checked = new Set();
    function isComplete(id) {
      if (checked.has(id)) return complete.has(id);
      checked.add(id);
      if (marked.has(id) && byId.get(id).requires.every(isComplete)) complete.add(id);
      return complete.has(id);
    }
    map.nodes.forEach(n => isComplete(n.id));
    const status = new Map(map.nodes.map(n => [n.id, complete.has(n.id) ? 'complete' : marked.has(n.id) ? 'review' : n.requires.every(id => complete.has(id)) ? 'ready' : 'locked']));
    function ancestors(ids) {
      const result = new Set();
      function add(id) { if (!byId.has(id) || result.has(id)) return; result.add(id); byId.get(id).requires.forEach(add); }
      ids.forEach(add); return result;
    }
    const targetInfo = (map.targets || []).find(t => t.id === target);
    const targetPath = targetInfo ? ancestors(targetInfo.nodeIds || []) : new Set(map.nodes.map(n => n.id));
    const ready = map.nodes.filter(n => n.role !== 'support' && status.get(n.id) === 'ready' && targetPath.has(n.id));
    const review = map.nodes.filter(n => status.get(n.id) === 'review');
    return {byId, marked, complete, status, ancestors, targetPath, ready, review, targetInfo};
  }

  function relationButton(node, analysis) {
    return `<button type="button" data-skill-select="${esc(node.id)}" class="skill-relation-link ${analysis.status.get(node.id)}">${esc(node.title)}<small>${statusNames[analysis.status.get(node.id)]}</small></button>`;
  }

  function markup(map, analysis, selectedId, target, lessons) {
    const selected = analysis.byId.get(selectedId) || analysis.ready[0] || map.nodes[0];
    const path = analysis.ancestors([selected.id]);
    selected.supports.forEach(id => path.add(id));
    const next = map.nodes.filter(n => n.requires.includes(selected.id));
    const supported = map.nodes.filter(n => n.supports.includes(selected.id));
    const status = analysis.status.get(selected.id);
    const missing = selected.requires.filter(id => !analysis.complete.has(id));
    const lessonById = new Map(lessons.map(l => [l.id, l]));
    const validLessons = selected.lessons.map(id => lessonById.get(id)).filter(Boolean);
    const options = [{id:'all', title:'先巩固主干，再选分支'}, ...(map.targets || [])];
    const nodeButton = n => {
      const state = analysis.status.get(n.id);
      const faded = analysis.targetInfo && !analysis.targetPath.has(n.id) && n.role !== 'support';
      const parents = n.requires.map(id => analysis.byId.get(id).title);
      const laneName = {carving:'刻滑路线',short:'搓雪小回转',switch:'并行 · 反脚'}[n.lane];
      return `<button type="button" class="skill-node ${state}${n.id === selected.id ? ' is-selected' : ''}${path.has(n.id) ? ' is-path' : ''}${faded ? ' is-faded' : ''}" data-lane="${esc(n.lane || 'common')}" data-skill-node="${esc(n.id)}" data-skill-select="${esc(n.id)}" aria-pressed="${n.id === selected.id}" aria-label="${esc(n.title)}，${statusNames[state]}${n.role === 'support' ? '，辅助技术' : ''}">${laneName ? `<span class="skill-lane">${laneName}</span>` : ''}<strong>${esc(n.title)}</strong><small><span class="skill-status-dot" aria-hidden="true"></span>${n.role === 'support' ? '辅助 · ' : ''}${statusNames[state]}</small><span class="skill-parent-copy">${parents.length ? '前置：' + esc(parents.join(' + ')) : '起点：先对照通过标准自查'}</span></button>`;
    };
    const recommendations = analysis.ready.slice(0, 2);
    const abilities = map.nodes.filter(n => n.role !== 'support');
    return `<section class="skill-planner" aria-labelledby="skill-planner-title">
      <header class="skill-planner-head"><div><div class="map-kicker">YOUR NEXT TURN · 能力前置与进阶</div><h2 id="skill-planner-title">现在练什么，下一步去哪里</h2><p>${esc(map.intro)}</p></div><label class="skill-target-select">我想发展的方向<select data-skill-target aria-label="选择进阶方向">${options.map(o => `<option value="${esc(o.id)}"${o.id === target ? ' selected' : ''}>${esc(o.title)}</option>`).join('')}</select></label></header>
      <div class="skill-goals"><button type="button" data-skill-goal="carving" aria-pressed="${target === 'carving'}"><small>重点路线 01</small><strong>刻滑主线</strong><span>基础刻滑 → 进阶大弯；低姿态另作选修</span></button><button type="button" data-skill-goal="short" aria-pressed="${target === 'short'}"><small>重点路线 02</small><strong>搓雪小回转</strong><span>基础控速 → 进阶短弯 → 整段复盘</span></button></div>${map.goalNote ? `<p class="skill-goal-note">${esc(map.goalNote)}</p>` : ''}
      <div class="skill-summary"><p><strong>${abilities.filter(n => analysis.complete.has(n.id)).length} / ${abilities.length} 项结果能力通过自查</strong><span>读过条目或某一趟成功，尚不等于掌握。</span></p><div class="skill-recommendations"><span>现在可练 · 每次选一个</span>${recommendations.length ? recommendations.map(n => `<button type="button" data-skill-select="${esc(n.id)}">${esc(n.title)} →</button>`).join('') : '<span>当前方向已完成自查，可以换一个条件复测，或选择另一条路线。</span>'}</div>${analysis.review.length ? `<p class="skill-progress-warning">${analysis.review.length} 项已勾选但前置未确认，这些勾选暂不计为通过。请点击“需补核前置”的节点核对。</p>` : ''}</div>
      <div class="skill-legend"><span><i class="complete"></i>已通过自查</span><span><i class="ready"></i>现在可练</span><span><i class="locked"></i>先补前置</span><span><i class="review"></i>需补核前置</span><span class="skill-line-key">实线箭头：练习前置</span><span class="skill-line-key support">虚线箭头：选中节点的辅助技术</span></div>
      <div class="skill-layout"><div class="skill-graph-scroll" tabindex="0" aria-label="能力关系图，可横向滚动"><div class="skill-graph" style="--skill-cols:${map.stages.length}"><svg class="skill-edges" aria-hidden="true"></svg>${map.stages.map((s, i) => `<section class="skill-column"><h3 class="skill-stage-title"><small>${String(i + 1).padStart(2, '0')}</small>${esc(s.title)}</h3>${map.nodes.filter(n => n.stage === s.id && n.role !== 'support').map(nodeButton).join('')}</section>`).join('')}<section class="skill-support-strip"><h3>辅助技术 · 按问题选练，不计入结果能力进度</h3><div>${map.nodes.filter(n => n.role === 'support').map(nodeButton).join('')}</div></section></div></div>
      <section class="skill-details" aria-labelledby="skill-selected-title"><header><div><small class="skill-selected-status ${status}">${statusNames[status]}${selected.role === 'support' ? ' · 辅助技术' : ''}</small><h3 id="skill-selected-title">${esc(selected.title)}</h3><p>${esc(selected.focus)}</p></div><label class="skill-mastery-toggle"><input type="checkbox" data-skill-mastered="${esc(selected.id)}"${analysis.marked.has(selected.id) ? ' checked' : ''}>我已按下方标准通过自查</label></header>
      <div class="skill-details-grid"><div><h4>通过标准</h4><ul>${selected.gate.map(g => `<li>${esc(g)}</li>`).join('')}</ul><p class="skill-practice"><strong>这次怎么练</strong>${esc(selected.practice)}</p>${missing.length ? `<p class="skill-progress-warning">开始前先确认：${missing.map(id => esc(analysis.byId.get(id).title)).join('、')}。</p>` : ''}<div class="skill-lesson-links">${validLessons.map(l => `<button type="button" data-skill-lesson="${esc(l.id)}">${esc(l.title)} ↗</button>`).join('')}</div></div>
      <div class="skill-relations"><h4>从哪里来 → 下一步去哪里</h4><div><strong>练习前置${selected.requires.length > 1 ? '（全部满足）' : ''}</strong><div class="skill-relation-links">${selected.requires.length ? selected.requires.map(id => relationButton(analysis.byId.get(id), analysis)).join('') : '<span>入口能力；不具备双刃停止时，先接受现场入门教学。</span>'}</div></div><div><strong>通过后可衔接</strong><div class="skill-relation-links">${next.length ? next.map(n => relationButton(n, analysis)).join('') : '<span>复测不同弯形与熟悉雪况中的稳定性，也可发展其他分支。</span>'}</div></div>${selected.supports.length ? `<div><strong>辅助技术（按问题选练）</strong><div class="skill-relation-links">${selected.supports.map(id => relationButton(analysis.byId.get(id), analysis)).join('')}</div></div>` : ''}${supported.length ? `<div><strong>本技术可以帮助</strong><div class="skill-relation-links">${supported.map(n => relationButton(n, analysis)).join('')}</div></div>` : ''}</div></div></section></div>
      <details class="skill-topology-note"><summary>如何理解这些关系与自查状态</summary><p>${esc(map.relationshipNote || '箭头是一种练习组织：前置关注路线、控速和可恢复性；辅助动作按具体问题选择。不同分支可以并行，已勾选不会自动替你确认前置能力。')}</p><p>自查只保存在当前浏览器，不会自动同步到其他设备。改变目标只突出路线，不会清除记录。每次选一个问题，在熟悉、人少的缓坡练，并回完整滑行复测。</p>${(map.sources || []).map(s => `<p>${safeUrl(s.url) ? `<a href="${esc(safeUrl(s.url))}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a>` : esc(s.title)}：${esc(s.note)}</p>`).join('')}</details>
    </section>`;
  }

  function mount(root, options) {
    const {map, lessons, onProgress, onTarget, onLesson, onSelect} = options;
    let progress = options.progress || [], target = options.target || 'all', selectedId = options.selectedId;
    let observer, frame, disposed = false;
    function drawEdges(analysis, selected) {
      const graph = root.querySelector('.skill-graph'), svg = root.querySelector('.skill-edges');
      if (!graph || !svg || getComputedStyle(svg).display === 'none') return;
      const rect = graph.getBoundingClientRect(), positions = new Map();
      root.querySelectorAll('[data-skill-node]').forEach(el => { const r = el.getBoundingClientRect(); positions.set(el.dataset.skillNode, {left:r.left - rect.left, right:r.right - rect.left, top:r.top - rect.top, bottom:r.bottom - rect.top, y:r.top - rect.top + r.height / 2}); });
      const path = analysis.ancestors([selected]);
      const selectedNode = analysis.byId.get(selected);
      const curves = [];
      const stageIndex = new Map(map.stages.map((stage, index) => [stage.id, index]));
      let upperLane = 8;
      const supportLane = Math.max(...map.nodes.filter(n => n.role !== 'support').map(n => positions.get(n.id)?.bottom || 0)) + 12;
      function curve(from, to, support) {
        const a = positions.get(from), b = positions.get(to); if (!a || !b) return;
        if (analysis.byId.get(to).role === 'support') {
          // Optional cards may wrap to a second row: use the gutters so a
          // prerequisite never appears to pass through an unrelated card.
          curves.push(`<path class="skill-edge is-path${support ? ' support' : ''}" d="M ${a.right} ${a.y} H ${a.right + 5} V ${supportLane} H ${b.left - 5} V ${b.y} H ${b.left - 2}" marker-end="url(#skill-arrow${support ? '-support' : ''})"/>`);
          return;
        }
        if (support && analysis.byId.get(from).role === 'support') {
          const x1 = (a.left + a.right) / 2, x2 = b.right + 8;
          curves.push(`<path class="skill-edge support is-path" d="M ${x1} ${a.top} V ${supportLane} H ${x2} V ${b.y} H ${b.right + 3}" marker-end="url(#skill-arrow-support)"/>`);
          return;
        }
        // Long dependencies travel above the columns, never through another skill card.
        if (stageIndex.get(analysis.byId.get(to).stage) - stageIndex.get(analysis.byId.get(from).stage) > 1) {
          const cls = support ? ' support is-path' : path.has(from) && path.has(to) ? ' is-path' : analysis.status.get(to) === 'ready' ? ' is-suggested' : '';
          curves.push(`<path class="skill-edge${cls}" d="M ${a.right} ${a.y} H ${a.right + 8} V ${upperLane} H ${b.left - 8} V ${b.y} H ${b.left - 3}" marker-end="url(#skill-arrow${support ? '-support' : ''})"/>`);
          upperLane += 5;
          return;
        }
        const sameColumn = b.left <= a.right;
        const x1 = sameColumn ? a.left : a.right, x2 = b.left;
        const bend = sameColumn ? Math.min(a.left, b.left) - 12 : (x1 + x2) / 2;
        const cls = support ? ' support is-path' : path.has(from) && path.has(to) ? ' is-path' : analysis.status.get(to) === 'ready' ? ' is-suggested' : '';
        curves.push(`<path class="skill-edge${cls}" d="M ${x1} ${a.y} C ${bend} ${a.y}, ${bend} ${b.y}, ${x2 - 3} ${b.y}" marker-end="url(#skill-arrow${support ? '-support' : ''})"/>`);
      }
      map.nodes.filter(n => n.role !== 'support').forEach(n => n.requires.forEach(id => curve(id, n.id, false)));
      if (selectedNode?.role === 'support') selectedNode.requires.forEach(id => curve(id, selected, false));
      selectedNode?.supports.forEach(id => curve(id, selected, true));
      svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
      svg.innerHTML = `<defs><marker id="skill-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 8 4 L 0 8 z" fill="#8fa596"/></marker><marker id="skill-arrow-support" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 8 4 L 0 8 z" fill="#b09459"/></marker></defs>${curves.join('')}`;
    }
    function draw(focusSelector) {
      observer?.disconnect(); cancelAnimationFrame(frame);
      const analysis = analyze(map, progress, target);
      if (!analysis.byId.has(selectedId)) selectedId = analysis.ready[0]?.id || map.nodes[0].id;
      root.innerHTML = markup(map, analysis, selectedId, target, lessons);
      root.querySelectorAll('[data-skill-select]').forEach(button => button.onclick = () => { selectedId = button.dataset.skillSelect; onSelect?.(selectedId); draw(`[data-skill-node="${CSS.escape(selectedId)}"]`); root.querySelector('.skill-details')?.scrollIntoView({block:'nearest'}); });
      function changeTarget(value, focus = '[data-skill-target]') { target = value; const next = analyze(map, progress, target); selectedId = next.ready[0]?.id || next.targetInfo?.nodeIds?.at(-1) || map.nodes[0].id; onTarget?.(target); onSelect?.(selectedId); draw(focus); }
      root.querySelector('[data-skill-target]').onchange = event => changeTarget(event.target.value);
      root.querySelectorAll('[data-skill-goal]').forEach(button => button.onclick = () => changeTarget(button.dataset.skillGoal, `[data-skill-goal="${button.dataset.skillGoal}"]`));
      root.querySelector('[data-skill-mastered]').onchange = event => { const id = event.target.dataset.skillMastered; progress = event.target.checked ? [...new Set([...progress, id])] : progress.filter(value => value !== id); onProgress?.(progress); draw('[data-skill-mastered]'); };
      root.querySelectorAll('[data-skill-lesson]').forEach(button => button.onclick = () => onLesson?.(button.dataset.skillLesson));
      if (focusSelector) root.querySelector(focusSelector)?.focus({preventScroll:true});
      const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => { if (!disposed) drawEdges(analysis, selectedId); }); };
      if (typeof ResizeObserver === 'function') { observer = new ResizeObserver(schedule); observer.observe(root.querySelector('.skill-graph')); }
      schedule();
    }
    draw();
    return {destroy() { disposed = true; observer?.disconnect(); cancelAnimationFrame(frame); }};
  }

  function lessonContext(map, lesson, progress) {
    const direct = map.nodes.filter(n => n.lessons.includes(lesson.id));
    const moduleIds = map.moduleLinks?.[lesson.module] || [];
    const related = direct.length ? direct : map.nodes.filter(n => moduleIds.includes(n.id));
    if (!related.length) return '';
    const analysis = analyze(map, progress);
    const directIds = new Set(direct.map(n => n.id));
    const before = [...new Set(related.flatMap(n => n.requires))].filter(id => !directIds.has(id));
    const next = map.nodes.filter(n => n.requires.some(id => related.some(r => r.id === id)));
    const link = n => `<button type="button" data-show-skill="${esc(n.id)}">${esc(n.title)}<small>${statusNames[analysis.status.get(n.id)]}</small></button>`;
    return `<aside class="skill-lesson-context" aria-label="本点的能力前置与进阶关系"><div><strong>在能力路线中的位置</strong><p>${direct.length ? '本点用于建立或检验以下能力。' : '本点是本模块的辅助内容，按具体问题选择；不要求整模块学完再进阶。'}</p></div><div class="skill-context-links">${related.map(link).join('')}</div>${direct.length && before.length ? `<div><small>前置能力</small><div class="skill-context-links">${before.map(id => link(analysis.byId.get(id))).join('')}</div></div>` : ''}${direct.length && next.length ? `<div><small>下一步方向</small><div class="skill-context-links">${next.map(link).join('')}</div></div>` : ''}</aside>`;
  }

  window.SnowProgression = {validate, analyze, mount, lessonContext};
})();
