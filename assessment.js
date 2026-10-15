/* Local snow-session evidence. These records never award a certification or skill check. */
(() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  const statuses = {unseen:'未观察', develop:'需发展', repeat:'本条件可重复'};
  const fields = [
    ['date','日期','date'], ['terrain','坡面与地点','text','例如：熟悉整备坡，具体滑段与坡度变化'],
    ['snow','雪况与能见度','text','例如：平整压雪、局部硬雪、可见距离'],
    ['speed','速度与控速','text','描述全段是否加速、可否按计划退出；没有测量就不填速度数值'],
    ['corridor','通道宽度与判断方法','text','记录约宽度、参照物和可用空间；目标条件以本次专项为准'],
    ['equipment','装备与固定器设置','text','记录与上次不同之处；不确定可写未记录'],
    ['stance','站姿与滑行方向','text','Regular / Goofy，正脚 / 反脚'],
    ['change','这次只改变什么','text','例如：保持坡面、速度和弯形，只调整释放时机'],
    ['evidenceRef','录像或板痕证据索引','text','本地文件名、链接、拍摄角度及时间点；这里只保存文字'],
    ['feedback','外部观察与反馈','textarea','观察者身份、是否现任 CASI 四级教练或考官、日期、原话；没有就写尚无'],
    ['nextPractice','下一趟只练什么','textarea','具体问题 → 对应练习 → 保持哪些条件 → 如何复测']
  ];
  function normalize(record, protocol) {
    // A missing ID can be a legacy/local draft. An explicitly different ID is
    // another task's evidence and must never be relabelled as this protocol.
    if (record?.protocolId !== undefined && record.protocolId !== protocol.id) record = null;
    const result = {id:typeof record?.id === 'string' ? record.id : '', protocolId:protocol.id, criteria:{}};
    for (const [key] of fields) result[key] = typeof record?.[key] === 'string' ? record[key] : '';
    for (const criterion of protocol.criteria) {
      const saved = record?.criteria?.[criterion.id];
      result.criteria[criterion.id] = {status:Object.hasOwn(statuses, saved?.status) ? saved.status : 'unseen', note:typeof saved?.note === 'string' ? saved.note : ''};
    }
    return result;
  }
  function isDirty(record, records, protocol) {
    const current=normalize(record,protocol), saved=records.find(r=>r?.id===current.id&&r.protocolId===protocol.id);
    if(saved)return JSON.stringify(current)!==JSON.stringify(normalize(saved,protocol));
    return fields.some(([key])=>key!=='date'&&current[key].trim()) || Object.values(current.criteria).some(c=>c.status!=='unseen'||c.note.trim());
  }
  function mount(root, {protocol, records, draft, onDraft, onSave, onLesson}) {
    let current = normalize(draft, protocol);
    let savedRecords = Array.isArray(records) ? records : [];
    const fieldHint = (key, fallback) => typeof protocol.fieldHints?.[key] === 'string' ? protocol.fieldHints[key] : fallback || '';
    const today = () => {const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
    function readForm() {
      const values = new FormData(root.querySelector('form'));
      const next = {...current, criteria:{}};
      for (const [key] of fields) next[key] = String(values.get(key) || '');
      for (const criterion of protocol.criteria) next.criteria[criterion.id] = {status:String(values.get(`status-${criterion.id}`)), note:String(values.get(`note-${criterion.id}`) || '')};
      return normalize(next, protocol);
    }
    function canReplaceDraft() {
      current=readForm();
      return !isDirty(current,savedRecords,protocol) || window.confirm('当前草稿尚未保存为一趟记录。是否放弃这份草稿并切换？选择取消后，可先点击“保存这趟记录”或“保存修改”。');
    }
    function draw(openEditor = false) {
      if (!current.date) current.date = today();
      const entries = savedRecords.filter(r => r?.protocolId === protocol.id);
      root.innerHTML = `<h2>${esc(protocol.title)}</h2><p>${esc(protocol.intro)}</p><p class="assessment-boundary">记录本次条件、完整滑段和可观察证据。这里不计算 CASI 分数，也不自动勾选能力。记录和草稿只保存在当前浏览器，不上传录像、不发布评论。</p>
        <details ${openEditor ? 'open' : ''} class="assessment-editor"><summary>${current.id ? '编辑这趟记录' : '记录一趟练习'}</summary><form>
        <div class="assessment-fields">${fields.map(([key,label,type,placeholder])=>`<label>${esc(label)}${type==='textarea'?`<textarea name="${key}" rows="3" maxlength="4000" placeholder="${esc(fieldHint(key,placeholder))}">${esc(current[key])}</textarea>`:`<input type="${type}" name="${key}" value="${esc(current[key])}" maxlength="1000" ${['date','terrain','snow'].includes(key)?'required':''} placeholder="${esc(fieldHint(key,placeholder))}">`}</label>`).join('')}</div>
        <h3>逐项观察 · 看不清就保留“未观察”</h3><p>“本条件可重复”需要同条件复测证据；换坡面或雪况后重新判断。下列维度是本站复盘组织。</p>
        <div class="assessment-criteria">${protocol.criteria.map(c=>`<fieldset><legend>${esc(c.title)}</legend><p>${esc(c.observe || c.description || '')}</p><label>本次观察状态<select name="status-${esc(c.id)}" aria-label="${esc(c.title)}状态">${Object.entries(statuses).map(([value,label])=>`<option value="${value}" ${current.criteria[c.id].status===value?'selected':''}>${label}</option>`).join('')}</select></label><label>证据或不确定之处<textarea rows="2" maxlength="2000" name="note-${esc(c.id)}" placeholder="哪一弯、哪一帧、前后两趟的差异；不要只写感觉">${esc(current.criteria[c.id].note)}</textarea></label>${c.lessonId?`<button type="button" class="stage-link" data-assessment-lesson="${esc(c.lessonId)}">打开对应练习 ↗</button>`:''}</fieldset>`).join('')}</div>
        <div class="assessment-actions"><button type="submit" class="primary-button">${current.id?'保存修改':'保存这趟记录'}</button><button type="button" class="quiet-button" data-assessment-new>另记一趟</button></div><p data-assessment-status role="status" aria-live="polite"></p></form></details>
        <details class="assessment-history" ${entries.length?'open':''}><summary>已保存的滑段 · ${entries.length} 趟</summary><p>逐趟比较条件和证据。两趟结论相同不代表不同条件下也成立。</p>${entries.slice().reverse().map(raw=>{const r=normalize(raw,protocol);const observed=Object.values(r.criteria).filter(c=>c.status!=='unseen').length;return `<article><h3>${esc(r.date)} · ${esc(r.terrain||'坡面未记录')}</h3><p>${esc(r.snow)} · 已观察 ${observed} / ${protocol.criteria.length} 项</p><p><strong>下一趟：</strong>${esc(r.nextPractice||'尚未选择')}</p><button class="quiet-button" type="button" data-assessment-edit="${esc(r.id)}">查看 / 编辑这趟证据</button></article>`;}).join('')}</details>`;
      const form = root.querySelector('form');
      form.oninput = () => {current = readForm(); if(onDraft(current) === false) root.querySelector('[data-assessment-status]').textContent='浏览器保存失败，当前草稿尚未持久保存。';};
      form.onsubmit = event => {
        event.preventDefault(); current = readForm();
        const missing = protocol.criteria.find(c => current.criteria[c.id].status !== 'unseen' && !current.criteria[c.id].note.trim());
        if (missing) {root.querySelector('[data-assessment-status]').textContent=`请为“${missing.title}”写下观察证据，或改为“未观察”。`; form.elements.namedItem(`note-${missing.id}`).focus(); return;}
        const record = {...current, id:current.id || crypto.randomUUID()};
        const matches = r => r?.id === record.id && r.protocolId === protocol.id;
        const next = savedRecords.some(matches) ? savedRecords.map(r=>matches(r) ? record : r) : [...savedRecords, record];
        if (onSave(next,record) === false) {root.querySelector('[data-assessment-status]').textContent='浏览器保存失败，记录仍留在当前页面；请保持页面并复制需要的文字。'; return;}
        current=record; savedRecords=next; draw(true); root.querySelector('[data-assessment-status]').textContent='已保存到当前浏览器。此记录不代表官方评定。';
      };
      root.querySelector('[data-assessment-new]').onclick=()=>{if(!canReplaceDraft())return;current=normalize(null,protocol); onDraft(current); draw(true); root.querySelector('input').focus();};
      root.querySelectorAll('[data-assessment-edit]').forEach(button=>button.onclick=()=>{if(!canReplaceDraft())return;current=normalize(savedRecords.find(r=>r?.id===button.dataset.assessmentEdit&&r.protocolId===protocol.id),protocol); onDraft(current); draw(true); const editor=root.querySelector('.assessment-editor'); editor.open=true; editor.scrollIntoView({block:'start'});});
      root.querySelectorAll('[data-assessment-lesson]').forEach(button=>button.onclick=()=>onLesson(button.dataset.assessmentLesson));
    }
    draw();
  }
  window.SnowAssessment = {normalize,isDirty,mount};
})();
