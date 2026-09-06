import { RAD, clamp, copy, inside, seatingZ, listenerZ, speaker, createStudy, predict, sampleField, stageTiling, lineInterval, constrainLayout, tableBounds, colorFor } from './model.js';

const $ = selector => document.querySelector(selector);
const plan = $('#plan'), side = $('#side');
const ctx = plan.getContext('2d'), sc = side.getContext('2d');
let state = createStudy();
const preferences = { defaultOffset: -6, legendMin: 65, legendMax: 110 };
let selected = { kind: 'speaker', id: 1 }, tab = 'space';
let zoom = 1, pan = { x: 0, y: 0 }, transform = null, sideTransform = null;
let heatmap = true, overlap = false, field = sampleField(state), dirtyField = false, scheduled = false;
let history = [], future = [], drag = null, sideDrag = null, hovering = null, spaceHeld = false, toastTimeout;
const fmt = (n, digits = 1) => Number(n.toFixed(digits)).toString();
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const currentSpeaker = () => state.speakers.find(s => s.id === selected?.id && selected.kind === 'speaker');
const currentTable = () => state.tables.find(t => t.id === selected?.id && selected.kind === 'table');

function toast(message) {
  $('#toast').textContent = message; $('#toast').hidden = false;
  clearTimeout(toastTimeout); toastTimeout = setTimeout(() => { $('#toast').hidden = true; }, 3200);
}
function checkpoint() { history.push(copy(state)); if (history.length > 80) history.shift(); future = []; }
function undo(redo = false) {
  const from = redo ? future : history, to = redo ? history : future;
  if (!from.length) return;
  to.push(copy(state)); state = from.pop();
  if (selected?.kind === 'speaker' && !currentSpeaker()) selected = state.speakers[0] ? { kind: 'speaker', id: state.speakers[0].id } : null;
  if (selected?.kind === 'table' && !currentTable()) selected = null;
  renderInspector(); changed();
}
function changed(acoustic = true) {
  if (acoustic) dirtyField = true;
  schedule();
}
function schedule() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    if (dirtyField) { field = sampleField(state); dirtyField = false; }
    renderPlan(); renderSide(); updateReadouts(); updateInputs();
  });
}
function select(kind, id) {
  selected = kind ? { kind, id } : null;
  if (kind === 'speaker') tab = 'speaker';
  else if (kind === 'table') tab = 'furniture';
  else if (kind === 'stage' || kind === 'audience') tab = 'space';
  renderInspector(); schedule();
}
function numberField(label, key, value, unit = 'ft', min = 0, max = 1000, step = .5) {
  return `<label class="field"><span>${label}</span><div class="number-box"><input aria-label="${label}" data-key="${key}" type="number" value="${value}" min="${min}" max="${max}" step="${step}"><span>${unit}</span></div></label>`;
}
function heading(label, symbol, meta = '') { return `<div class="section-heading"><h2><span class="section-symbol">${symbol}</span>${label}</h2><span class="meta">${meta}</span></div>`; }
function xyFields(target, value) { return `<div class="two-fields">${numberField('Across room (X)', `${target}.x`, value.x)}${numberField('From front (Y)', `${target}.y`, value.y)}</div>`; }

function renderInspector() {
  document.querySelectorAll('[data-tab]').forEach(button => button.setAttribute('aria-selected', button.dataset.tab === tab));
  const r = state.room, st = state.stage, a = state.audience;
  let html = '';
  if (tab === 'space') {
    html = `<section class="control-section">${heading('Room', '▱', 'RECTANGLE')}<div class="two-fields">${numberField('Room width', 'room.w', r.w, 'ft', 4)}${numberField('Room depth', 'room.d', r.d, 'ft', 4)}</div><p class="section-note">Front is at the left of the plan. Enter or Tab applies room dimensions.</p></section>
    <section class="control-section">${heading('Stage', '▰')}<div class="stage-summary"><span id="stage-status" class="pill"></span><span id="panel-count"></span></div>
    <label class="field"><span>Preferred panel</span><select class="control-select" data-key="stage.panel"><option value="4x8" ${st.panel === '4x8' ? 'selected' : ''}>4 × 8 ft</option><option value="4x4" ${st.panel === '4x4' ? 'selected' : ''}>4 × 4 ft</option></select></label>
    <div class="two-fields">${numberField('Stage width', 'stage.w', st.w, 'ft', 1)}${numberField('Stage depth', 'stage.d', st.d, 'ft', 1)}</div>${xyFields('stage', st)}${numberField('Stage elevation', 'stage.h', st.h, 'ft', 0, 20)}<p class="section-note">Any footprint is allowed. Nonstandard dimensions are labeled Custom.</p></section>
    <section class="control-section">${heading('Seating area', '▧')}<div class="two-fields">${numberField('Seating width', 'audience.w', a.w, 'ft', 1)}${numberField('Seating depth', 'audience.d', a.d, 'ft', 1)}</div>${xyFields('audience', a)}
    <label class="field"><span>Seating rise angle</span><div class="number-box"><input aria-label="Seating rise angle" data-key="audience.rake" type="number" value="${a.rake}" min="0" max="35" step="1"><span>deg</span></div></label><input aria-label="Seating rise slider" data-key="audience.rake" type="range" min="0" max="35" value="${a.rake}"><div class="range-labels"><span>0° · flat</span><span>35°</span></div><p class="section-note" style="margin-top:10px">Front edge starts at floor level. The listening surface follows the slope.</p></section>`;
  }
  if (tab === 'speaker') {
    html = `<section class="control-section">${heading('Speakers', '◁', `${state.speakers.length} PLACED`)}<div id="speaker-list">${speakerListHTML()}</div><button class="full-button" data-action="add-speaker">＋ Add speaker</button></section>`;
    const s = currentSpeaker();
    if (s) {
      html += `<section class="control-section">${heading('Placement & aim', '⌖')}<label class="field"><span>Speaker name</span><input class="text-control" data-key="speaker.name" aria-label="Speaker name" maxlength="35" value="${escape(s.name)}"></label>${xyFields('speaker', s)}${numberField('Top of speaker', 'speaker.z', s.z, 'ft', 0, 200)}<p class="source-note">Above the common room floor. The cabinet top is the source point in this first slice.</p><div class="two-fields">${numberField('Horizontal aim', 'speaker.azimuth', s.azimuth, 'deg', -180, 180, 1)}${numberField('Downward tilt', 'speaker.tilt', s.tilt, 'deg', -85, 85, 1)}</div><p class="section-note">0° aim faces the rear of the room. Positive tilt aims downward.</p></section>
      <section class="control-section">${heading('Coverage & level', '◌')}<div class="two-fields">${numberField('Horizontal beamwidth', 'speaker.horizontal', s.horizontal, 'deg', 10, 180, 5)}${numberField('Vertical beamwidth', 'speaker.vertical', s.vertical, 'deg', 10, 180, 5)}</div>${numberField('Peak SPL at 1 metre', 'speaker.peak', s.peak, 'dB', 60, 170, 1)}${numberField('Output offset', 'speaker.offset', s.offset, 'dB', -60, 0, 1)}<p class="section-note">−6 dB beamwidths. Offset is relative to peak; 0 dB uses peak output.</p><div class="action-row"><button data-action="duplicate-speaker">Duplicate</button><button data-action="delete-speaker" class="danger">Remove</button></div></section>`;
    } else html += `<div class="empty-state">Select a speaker in the plan<br>to edit its placement and coverage.</div>`;
  }
  if (tab === 'furniture') {
    html = `<section class="control-section">${heading('Add a table', '⊡', `${state.tables.length} PLACED`)}
    <button class="furniture-choice" data-add-table="round"><span class="table-shape round"></span><span><strong>8 ft round</strong><small>8 ft diameter</small></span><span style="margin-left:auto">＋</span></button>
    <button class="furniture-choice" data-add-table="6"><span class="table-shape rect"></span><span><strong>6 ft rectangular</strong><small>6 × 2.5 ft</small></span><span style="margin-left:auto">＋</span></button>
    <button class="furniture-choice" data-add-table="8"><span class="table-shape rect"></span><span><strong>8 ft rectangular</strong><small>8 × 2.5 ft</small></span><span style="margin-left:auto">＋</span></button><p class="section-note">Tables are visual layout objects. They do not affect the SPL prediction.</p></section>`;
    const t = currentTable();
    if (t) html += `<section class="control-section">${heading(`Table ${t.id}`, '⌖')}${xyFields('table', t)}${t.type === 'round' ? '' : numberField('Table rotation', 'table.angle', t.angle, 'deg', -180, 180, 15)}<div class="action-row"><button data-action="duplicate-table">Duplicate</button><button data-action="delete-table" class="danger">Remove</button></div></section>`;
    else html += `<div class="empty-state">Add a table, then drag it into place.<br>Select it to edit its position.</div>`;
  }
  $('#inspector-content').innerHTML = html;
  updateInputs();
}

function speakerListHTML() {
  return state.speakers.map(s => `<div class="speaker-item ${selected?.kind === 'speaker' && selected.id === s.id ? 'selected' : ''}"><button class="speaker-pick" data-speaker-id="${s.id}"><span class="speaker-id">${s.id.toString().padStart(2, '0')}</span><span class="speaker-info"><strong>${escape(s.name)}</strong><small>${fmt(s.horizontal, 0)}° × ${fmt(s.vertical, 0)}° · ${fmt(s.peak + s.offset, 0)} dB @ 1m</small></span></button><button class="mute-button ${s.enabled ? '' : 'off'}" data-mute-id="${s.id}" aria-label="${s.enabled ? 'Mute' : 'Enable'} ${escape(s.name)}">${s.enabled ? 'ON' : 'OFF'}</button></div>`).join('');
}

function targetFor(key) {
  const [group, field] = key.split('.');
  return { object: group === 'speaker' ? currentSpeaker() : group === 'table' ? currentTable() : state[group], field, group };
}
function updateInputs() {
  document.querySelectorAll('[data-key]').forEach(input => {
    const { object, field } = targetFor(input.dataset.key);
    if (object && input !== document.activeElement) input.value = typeof object[field] === 'number' ? fmt(object[field], 2) : object[field];
  });
  const tiling = stageTiling(state.stage);
  if ($('#stage-status')) {
    $('#stage-status').textContent = tiling.custom ? 'Custom' : 'Standard';
    $('#stage-status').className = `pill${tiling.custom ? ' custom' : ''}`;
    $('#panel-count').textContent = tiling.custom ? 'Free-size footprint' : `${tiling.count} × ${Math.min(tiling.w, tiling.d)}×${Math.max(tiling.w, tiling.d)} ft`;
  }
}

function updateReadouts() {
  $('#speaker-count').textContent = state.speakers.length;
  $('#room-caption').textContent = { conference: 'Conference', concert: 'Concert', dinner: 'Dinner' }[state.preset] || 'Room study';
  $('#room-dimensions').textContent = `${fmt(state.room.w)} × ${fmt(state.room.d)} ft`;
  $('#event-preset').value = state.preset;
  $('#zoom-value').textContent = `${Math.round(zoom * 100)}%`;
  $('#undo').disabled = history.length === 0; $('#redo').disabled = future.length === 0;
  for (const key of ['min', 'median', 'max']) $('#stat-' + key).innerHTML = field[key] === null ? '—' : `${field[key].toFixed(1)}<small>dB</small>`;
  $('#stat-overlap').innerHTML = field.min === null ? '—' : `${Math.round(field.overlap)}<small>%</small>`;
  $('#overlap-summary').hidden = !overlap;
  $('#overlap-summary').textContent = field.min === null ? '—' : `${Math.round(field.overlap)}%`;
  $('#seated').classList.toggle('active', state.listenerHeight === 4);
  $('#standing').classList.toggle('active', state.listenerHeight === 5.5);
  const s = currentSpeaker();
  $('#side-caption').textContent = s ? `${s.name} · along horizontal aim` : 'Select a speaker in the plan';
  const ticks = [...document.querySelectorAll('.legend-ticks span')];
  ticks.forEach((tick, i) => { tick.textContent = fmt(preferences.legendMin + (preferences.legendMax - preferences.legendMin) * i / 3, 0) + (i === 3 ? '+' : ''); });
}

function configureCanvas(canvas, context) {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.round(rect.width * ratio), h = Math.round(rect.height * ratio);
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, rect.width, rect.height);
  return { w: rect.width, h: rect.height };
}
const world = p => ({ x: transform.ox + p.y * transform.s, y: transform.oy + (state.room.w - p.x) * transform.s });
const fromScreen = p => ({ x: state.room.w - (p.y - transform.oy) / transform.s, y: (p.x - transform.ox) / transform.s });
function rectangle(r) {
  const p = world({ x: r.x + r.w, y: r.y });
  return { x: p.x, y: p.y, w: r.d * transform.s, h: r.w * transform.s };
}
function rounded(context, x, y, w, h, radius = 4) { context.beginPath(); context.roundRect(x, y, w, h, radius); }
function text(context, value, x, y, color = '#7b8e76', size = 10, align = 'left', mono = false) {
  context.font = `${size}px ${mono ? '"SFMono-Regular",Consolas,monospace' : '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'}`;
  context.fillStyle = color; context.textAlign = align; context.textBaseline = 'middle'; context.fillText(value, x, y);
}
function line(context, points, color, width = 1, dash = []) {
  context.beginPath(); context.strokeStyle = color; context.lineWidth = width; context.setLineDash(dash);
  points.forEach((p, i) => i === 0 ? context.moveTo(p.x, p.y) : context.lineTo(p.x, p.y)); context.stroke(); context.setLineDash([]);
}
function circle(context, p, radius, fill, stroke = null, width = 1) {
  context.beginPath(); context.arc(p.x, p.y, radius, 0, Math.PI * 2); context.fillStyle = fill; context.fill();
  if (stroke) { context.strokeStyle = stroke; context.lineWidth = width; context.stroke(); }
}

function renderPlan() {
  const size = configureCanvas(plan, ctx);
  ctx.fillStyle = '#f2f5ed'; ctx.fillRect(0, 0, size.w, size.h);
  ctx.fillStyle = '#d5dfcc';
  for (let x = 12; x < size.w; x += 18) for (let y = 12; y < size.h; y += 18) { ctx.beginPath(); ctx.arc(x, y, .65, 0, Math.PI * 2); ctx.fill(); }
  const topSpace = size.w < 610 ? 100 : 82;
  const fit = Math.min(Math.max(80, size.w - 124) / state.room.d, Math.max(100, size.h - topSpace - 79) / state.room.w);
  const s = fit * zoom;
  transform = { s, ox: (size.w - state.room.d * s) / 2 + pan.x, oy: topSpace + (size.h - topSpace - 79 - state.room.w * s) / 2 + pan.y };
  const room = rectangle({ x: 0, y: 0, w: state.room.w, d: state.room.d });
  ctx.save(); ctx.shadowColor = '#374d2e0e'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
  ctx.fillStyle = '#fcfdf9'; ctx.fillRect(room.x, room.y, room.w, room.h); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.rect(room.x, room.y, room.w, room.h); ctx.clip();
  // Room grid uses physical spacing; it never changes the layout coordinates.
  const grid = state.room.d > 200 || state.room.w > 200 ? 20 : 10;
  for (let y = 0; y <= state.room.d; y += grid) line(ctx, [world({ x: 0, y }), world({ x: state.room.w, y })], '#e9eee2');
  for (let x = 0; x <= state.room.w; x += grid) line(ctx, [world({ x, y: 0 }), world({ x, y: state.room.d })], '#e9eee2');
  const ar = rectangle(state.audience);
  ctx.fillStyle = '#e5eddf'; ctx.fillRect(ar.x, ar.y, ar.w, ar.h);
  if (heatmap) for (const cell of field.values) {
    const pos = world({ x: cell.x + field.dx / 2, y: cell.y - field.dy / 2 });
    ctx.fillStyle = colorFor(cell.level, preferences.legendMin, preferences.legendMax);
    ctx.fillRect(pos.x, pos.y, field.dy * s + .35, field.dx * s + .35);
  }
  if (overlap) {
    ctx.save(); ctx.beginPath();
    for (const cell of field.values) if (cell.overlap) {
      const pos = world({ x: cell.x + field.dx / 2, y: cell.y - field.dy / 2 });
      ctx.rect(pos.x, pos.y, field.dy * s + .4, field.dx * s + .4);
    }
    ctx.clip(); ctx.fillStyle = '#fff8cf22'; ctx.fillRect(ar.x, ar.y, ar.w, ar.h);
    for (let d = -size.h; d < size.w + size.h; d += 7) line(ctx, [{ x: d, y: 0 }, { x: d + size.h, y: size.h }], '#28372d77', 1.2);
    ctx.restore();
  }
  ctx.strokeStyle = selected?.kind === 'audience' ? '#174f3d' : '#7e927577'; ctx.lineWidth = selected?.kind === 'audience' ? 2.3 : 1; ctx.setLineDash([5, 3]); ctx.strokeRect(ar.x, ar.y, ar.w, ar.h); ctx.setLineDash([]);
  // Coverage boundary of the selected speaker on the actual listener surface.
  const source = currentSpeaker();
  if (source && source.enabled) {
    const boundary = [];
    for (let j = 0; j <= 100; j++) {
      const y = state.audience.y + j / 100 * state.audience.d;
      let first = null, last = null;
      for (let i = 0; i <= 100; i++) {
        const x = state.audience.x + i / 100 * state.audience.w;
        const result = predict({ ...state, speakers: [source] }, x, y);
        if (result.contributions[0]?.inZone) { if (first === null) first = x; last = x; }
      }
      if (first !== null) boundary.push({ left: world({ x: first, y }), right: world({ x: last, y }) });
    }
    if (boundary.length > 1) {
      line(ctx, boundary.map(b => b.left), '#ffffffbc', 1.4, [5, 4]); line(ctx, boundary.map(b => b.right), '#ffffffbc', 1.4, [5, 4]);
    }
  }
  const sr = rectangle(state.stage), tiling = stageTiling(state.stage);
  ctx.fillStyle = '#c5bcaa'; ctx.fillRect(sr.x, sr.y, sr.w, sr.h);
  ctx.save(); ctx.beginPath(); ctx.rect(sr.x, sr.y, sr.w, sr.h); ctx.clip();
  if (!tiling.custom) {
    for (let x = tiling.w; x < state.stage.w; x += tiling.w) line(ctx, [world({ x: state.stage.x + x, y: state.stage.y }), world({ x: state.stage.x + x, y: state.stage.y + state.stage.d })], '#a99e8960');
    for (let y = tiling.d; y < state.stage.d; y += tiling.d) line(ctx, [world({ x: state.stage.x, y: state.stage.y + y }), world({ x: state.stage.x + state.stage.w, y: state.stage.y + y })], '#a99e8960');
  }
  ctx.restore();
  ctx.strokeStyle = selected?.kind === 'stage' ? '#4c654e' : '#9e967f'; ctx.lineWidth = selected?.kind === 'stage' ? 2.3 : 1; ctx.strokeRect(sr.x, sr.y, sr.w, sr.h);
  if (sr.w > 35 && sr.h > 30) {
    text(ctx, 'STAGE', sr.x + sr.w / 2, sr.y + sr.h / 2 - 7, '#625f4e', 10, 'center');
    text(ctx, `${fmt(state.stage.w)} × ${fmt(state.stage.d)}`, sr.x + sr.w / 2, sr.y + sr.h / 2 + 9, '#7b7361', 9, 'center', true);
    if (tiling.custom && sr.h > 60) text(ctx, 'CUSTOM', sr.x + sr.w / 2, sr.y + sr.h / 2 + 24, '#795f37', 8, 'center');
  }
  for (const table of state.tables) drawTable(table);
  ctx.restore();
  // Wall, dimensional annotations, and named footprints.
  ctx.strokeStyle = '#74836c'; ctx.lineWidth = 2; ctx.strokeRect(room.x, room.y, room.w, room.h);
  const dimY = room.y - 15;
  line(ctx, [{ x: room.x, y: dimY }, { x: room.x + room.w, y: dimY }], '#aab8a0');
  for (const x of [room.x, room.x + room.w]) line(ctx, [{ x, y: dimY - 4 }, { x, y: dimY + 4 }], '#aab8a0');
  ctx.fillStyle = '#f2f5ed'; ctx.fillRect(room.x + room.w / 2 - 31, dimY - 7, 62, 14);
  text(ctx, `${fmt(state.room.d)} ft`, room.x + room.w / 2, dimY, '#7b8b70', 10, 'center', true);
  ctx.save(); ctx.translate(room.x - 22, room.y + room.h / 2); ctx.rotate(-Math.PI / 2); text(ctx, `${fmt(state.room.w)} ft`, 0, 0, '#7b8b70', 10, 'center', true); ctx.restore();
  text(ctx, 'FRONT', room.x, room.y + room.h + 18, '#8a9880', 8, 'left'); text(ctx, 'REAR', room.x + room.w, room.y + room.h + 18, '#8a9880', 8, 'right');
  if (ar.w > 95) {
    text(ctx, `LISTENING AREA   ${fmt(state.audience.rake, 0)}° RISE`, ar.x + 7, ar.y + 13, heatmap ? '#ffffffdc' : '#62785a', 8);
  }
  for (const source of state.speakers) drawSpeaker(source);
  if (selected?.kind === 'stage' || selected?.kind === 'audience') {
    const r = state[selected.kind];
    circle(ctx, world({ x: r.x + r.w, y: r.y + r.d }), 5, '#fff', '#316e50', 2);
  }
  $('#legend').hidden = !heatmap;
  if (hovering && !drag) updatePointReadout(hovering);
}

function drawTable(table) {
  const p = world(table), active = selected?.kind === 'table' && selected.id === table.id;
  ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(table.angle * RAD);
  ctx.fillStyle = '#fffdf1e3'; ctx.strokeStyle = active ? '#254f39' : '#737c6288'; ctx.lineWidth = active ? 2.2 : 1;
  ctx.beginPath();
  if (table.type === 'round') ctx.arc(0, 0, table.w * transform.s / 2, 0, Math.PI * 2);
  else ctx.roundRect(-table.d * transform.s / 2, -table.w * transform.s / 2, table.d * transform.s, table.w * transform.s, 2);
  ctx.fill(); ctx.stroke(); ctx.restore();
  if (transform.s * table.w > 25) text(ctx, `T${table.id}`, p.x, p.y, '#77806a', 8, 'center', true);
}

function speakerHandles(s) {
  const p = world(s), a = s.azimuth * RAD;
  return { p, aim: { x: p.x + Math.cos(a) * 46, y: p.y - Math.sin(a) * 46 } };
}
function drawSpeaker(s) {
  const active = selected?.kind === 'speaker' && selected.id === s.id;
  const { p, aim } = speakerHandles(s), a = s.azimuth * RAD;
  if (active) {
    circle(ctx, p, 16, '#ffffff8c', '#2c654c33', 1);
    line(ctx, [p, aim], '#214f3b', 1.3, [3, 3]); circle(ctx, aim, 5, '#f8fff0', '#2a6547', 1.7);
  }
  ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(-a);
  ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-7, -7); ctx.lineTo(-7, 7); ctx.closePath();
  ctx.fillStyle = s.enabled ? '#254f3c' : '#99a294'; ctx.fill(); ctx.strokeStyle = '#f9fff1'; ctx.lineWidth = 1.4; ctx.stroke(); ctx.restore();
  const labelWidth = Math.max(30, Math.min(140, s.name.length * 6 + 12));
  rounded(ctx, p.x - labelWidth / 2, p.y + 16, labelWidth, 18, 4); ctx.fillStyle = active ? '#28583f' : '#fbfcf6ee'; ctx.fill();
  text(ctx, s.name, p.x, p.y + 25, active ? '#f4faeb' : '#637659', 9, 'center', true);
}

function renderSide() {
  const size = configureCanvas(side, sc), source = currentSpeaker();
  if (!source) {
    text(sc, 'Select a speaker to explore its height and vertical coverage.', size.w / 2, size.h / 2, '#8fa083', 12, 'center'); sideTransform = null; return;
  }
  const roomRange = lineInterval(source, { x: 0, y: 0, ...state.room });
  if (!roomRange) { sideTransform = null; return; }
  const [lo, hi] = roomRange;
  const maxZ = Math.max(16, source.z + 5, seatingZ(state, state.audience.y + state.audience.d) + state.listenerHeight + 4, state.stage.h + 4);
  const left = 55, right = size.w - 30, baseline = size.h - 31;
  const sx = (right - left) / Math.max(1, hi - lo), sz = (baseline - 17) / maxZ;
  const at = (t, z) => ({ x: left + (t - lo) * sx, y: baseline - z * sz });
  sideTransform = { at, sx, sz, baseline, lo, hi, left, source: source.id };
  for (let z = 0; z <= maxZ; z += maxZ > 35 ? 10 : 5) {
    line(sc, [at(lo, z), at(hi, z)], '#e2e9d9', 1, z === 0 ? [] : [2, 4]);
    text(sc, `${z} ft`, left - 10, at(lo, z).y, '#94a087', 9, 'right', true);
  }
  for (let t = Math.ceil(lo / 20) * 20; t <= hi; t += 20) {
    text(sc, `${Math.round(t)} ft`, at(t, 0).x, baseline + 15, '#94a087', 9, 'center', true);
  }
  const stageRange = lineInterval(source, state.stage);
  if (stageRange) {
    const a = at(stageRange[0], state.stage.h), b = at(stageRange[1], 0);
    sc.fillStyle = '#c6bdab'; sc.fillRect(a.x, a.y, b.x - a.x, b.y - a.y); sc.strokeStyle = '#a69b83'; sc.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
  }
  const audienceRange = lineInterval(source, state.audience);
  if (audienceRange) {
    const yz = t => source.y + Math.cos(source.azimuth * RAD) * t;
    const start = at(audienceRange[0], seatingZ(state, yz(audienceRange[0]))), end = at(audienceRange[1], seatingZ(state, yz(audienceRange[1])));
    sc.beginPath(); sc.moveTo(start.x, baseline); sc.lineTo(start.x, start.y); sc.lineTo(end.x, end.y); sc.lineTo(end.x, baseline); sc.closePath(); sc.fillStyle = '#dbe6cf'; sc.fill();
    line(sc, [start, end], '#8ca77a', 1.3);
    const ls = at(audienceRange[0], listenerZ(state, yz(audienceRange[0]))), le = at(audienceRange[1], listenerZ(state, yz(audienceRange[1])));
    line(sc, [ls, le], '#5e915e', 1.5, [5, 4]);
    text(sc, `${state.listenerHeight === 4 ? 'Seated' : 'Standing'} listening surface · ${state.listenerHeight} ft`, (ls.x + le.x) / 2, Math.min(ls.y, le.y) - 11, '#718d63', 9, 'center');
  } else text(sc, 'Aim line misses the seating area', size.w - 30, 15, '#9d916f', 10, 'right');
  // Beam angles are plotted using independent horizontal and vertical scales.
  const origin = at(0, source.z);
  sc.save(); sc.beginPath(); sc.rect(left, 2, right - left, baseline - 2); sc.clip();
  const extent = Math.max(10, hi);
  const beamPoint = angle => at(extent, source.z - Math.tan(clamp(angle, -89, 89) * RAD) * extent);
  const upper = beamPoint(source.tilt - source.vertical / 2), lower = beamPoint(source.tilt + source.vertical / 2);
  sc.beginPath(); sc.moveTo(origin.x, origin.y); sc.lineTo(upper.x, upper.y); sc.lineTo(lower.x, lower.y); sc.closePath(); sc.fillStyle = '#7dba9720'; sc.fill();
  line(sc, [origin, upper], '#80aa7d', 1, [5, 4]); line(sc, [origin, lower], '#80aa7d', 1, [5, 4]);
  line(sc, [origin, beamPoint(source.tilt)], '#487955aa', 1, [3, 3]); sc.restore();
  line(sc, [at(0, 0), origin], '#9dad92', 1, [2, 3]);
  circle(sc, origin, 6, '#28583f', '#f7fcef', 2);
  const physicalHandleDistance = Math.min(Math.max((hi - lo) * .16, 3), Math.max(3, hi * .55));
  const angleRad = source.tilt * RAD;
  // Screen-normalize the handle so it stays reachable at steep tilts.
  const vx = Math.cos(angleRad) * sx, vy = Math.sin(angleRad) * sz;
  const length = Math.hypot(vx, vy);
  const handle = { x: origin.x + vx / length * Math.min(65, physicalHandleDistance * sx), y: origin.y + vy / length * Math.min(65, physicalHandleDistance * sx) };
  sideTransform.origin = origin; sideTransform.handle = handle;
  line(sc, [origin, handle], '#315d41', 1.3); circle(sc, handle, 5, '#fbfff5', '#315d41', 1.7);
  text(sc, `${source.name} · top ${fmt(source.z)} ft`, origin.x + 12, origin.y - 10, '#456b46', 10, 'left', true);
  text(sc, `${fmt(source.tilt)}° tilt`, handle.x + 10, handle.y + 2, '#7a9070', 9, 'left', true);
}

function pointerPosition(event, canvas) { const r = canvas.getBoundingClientRect(); return { x: event.clientX - r.left, y: event.clientY - r.top }; }
const near = (a, b, radius = 12) => Math.hypot(a.x - b.x, a.y - b.y) <= radius;
function tableHit(p, t) {
  const dx = p.x - t.x, dy = p.y - t.y;
  if (t.type === 'round') return Math.hypot(dx, dy) <= t.w / 2;
  const a = -t.angle * RAD, x = dx * Math.cos(a) - dy * Math.sin(a), y = dx * Math.sin(a) + dy * Math.cos(a);
  return Math.abs(x) <= t.w / 2 && Math.abs(y) <= t.d / 2;
}
function hitTest(p) {
  const s = currentSpeaker();
  if (s && near(p, speakerHandles(s).aim, 11)) return { kind: 'aim', id: s.id };
  if (selected?.kind === 'stage' || selected?.kind === 'audience') {
    const r = state[selected.kind];
    if (near(p, world({ x: r.x + r.w, y: r.y + r.d }), 10)) return { kind: 'resize', target: selected.kind };
  }
  for (const s of [...state.speakers].reverse()) if (near(p, world(s), 15)) return { kind: 'speaker', id: s.id };
  const q = fromScreen(p);
  for (const t of [...state.tables].reverse()) if (tableHit(q, t)) return { kind: 'table', id: t.id };
  if (inside(q, state.stage)) return { kind: 'stage' };
  if (inside(q, state.audience)) return { kind: 'audience' };
  return null;
}
function updatePointReadout(p) {
  const q = fromScreen(p), box = $('#point-readout');
  if (!inside(q, state.audience) || drag || spaceHeld) { box.hidden = true; return; }
  const result = predict(state, q.x, q.y);
  const level = result.level === null ? 'No active speakers' : `${result.level.toFixed(1)} <span style="font-size:10px">dB</span>`;
  box.innerHTML = `<strong>${level}</strong><small>X ${fmt(q.x)} · Y ${fmt(q.y)} ft</small><small>Listener ${fmt(listenerZ(state, q.y))} ft above floor</small>${overlap && result.overlap ? '<small class="advisory">▨ Comparable coverage overlap</small>' : ''}`;
  box.hidden = false;
  box.style.left = `${clamp(p.x + 17, 10, plan.clientWidth - box.offsetWidth - 12)}px`;
  box.style.top = `${clamp(p.y + 15, 5, plan.clientHeight - box.offsetHeight - 32)}px`;
}

plan.addEventListener('pointerdown', event => {
  if (!transform) return;
  const p = pointerPosition(event, plan);
  if (spaceHeld || event.button === 1) {
    event.preventDefault(); drag = { kind: 'pan', start: p, initial: { ...pan } }; plan.setPointerCapture(event.pointerId); return;
  }
  if (event.button !== 0) return;
  const hit = hitTest(p);
  if (!hit) { hovering = p; updatePointReadout(p); return; }
  if (!['aim', 'resize'].includes(hit.kind)) select(hit.kind, hit.id);
  checkpoint();
  const object = hit.kind === 'speaker' || hit.kind === 'aim' ? currentSpeaker() : hit.kind === 'table' ? currentTable() : state[hit.target || hit.kind];
  drag = { ...hit, start: fromScreen(p), initial: copy(object) }; plan.setPointerCapture(event.pointerId); $('#point-readout').hidden = true;
});
plan.addEventListener('pointermove', event => {
  if (!transform) return;
  const p = pointerPosition(event, plan); hovering = p;
  if (!drag) {
    const hit = hitTest(p); plan.style.cursor = spaceHeld ? 'grab' : hit ? (hit.kind === 'resize' ? 'nesw-resize' : hit.kind === 'aim' ? 'crosshair' : 'grab') : 'crosshair';
    updatePointReadout(p); return;
  }
  if (drag.kind === 'pan') { pan = { x: drag.initial.x + p.x - drag.start.x, y: drag.initial.y + p.y - drag.start.y }; schedule(); return; }
  const q = fromScreen(p);
  if (drag.kind === 'aim') {
    const s = currentSpeaker(); s.azimuth = Math.round(Math.atan2(q.x - s.x, q.y - s.y) / RAD); changed(); return;
  }
  if (drag.kind === 'resize') {
    const r = state[drag.target]; r.w = Math.round(clamp(q.x - r.x, 1, state.room.w - r.x) * 2) / 2; r.d = Math.round(clamp(q.y - r.y, 1, state.room.d - r.y) * 2) / 2; changed(); return;
  }
  const object = drag.kind === 'speaker' ? currentSpeaker() : drag.kind === 'table' ? currentTable() : state[drag.kind];
  object.x = Math.round((drag.initial.x + q.x - drag.start.x) * 4) / 4;
  object.y = Math.round((drag.initial.y + q.y - drag.start.y) * 4) / 4;
  constrainLayout(state); changed(drag.kind !== 'table' && drag.kind !== 'stage');
});
function finishPlanDrag() { drag = null; plan.style.cursor = spaceHeld ? 'grab' : 'default'; schedule(); }
plan.addEventListener('pointerup', finishPlanDrag); plan.addEventListener('pointercancel', finishPlanDrag);
plan.addEventListener('pointerleave', () => { hovering = null; $('#point-readout').hidden = true; });
plan.addEventListener('wheel', event => {
  event.preventDefault(); const point = pointerPosition(event, plan);
  zoomAt(point, Math.exp(-event.deltaY * .0015));
}, { passive: false });
function zoomAt(point, factor) {
  if (!transform) return;
  const previous = zoom; zoom = clamp(zoom * factor, .5, 4);
  const ratio = zoom / previous, center = { x: plan.clientWidth / 2, y: (transform.oy - pan.y) + state.room.w * transform.s / 2 };
  pan = { x: point.x - center.x - (point.x - center.x - pan.x) * ratio, y: point.y - center.y - (point.y - center.y - pan.y) * ratio };
  schedule();
}

side.addEventListener('pointerdown', event => {
  if (!sideTransform || event.button !== 0) return;
  const p = pointerPosition(event, side);
  const kind = near(p, sideTransform.origin, 13) ? 'height' : near(p, sideTransform.handle, 13) ? 'tilt' : null;
  if (!kind) return;
  checkpoint(); sideDrag = { kind, transform: { ...sideTransform } }; side.setPointerCapture(event.pointerId);
});
side.addEventListener('pointermove', event => {
  if (!sideTransform) return;
  const p = pointerPosition(event, side);
  if (!sideDrag) { side.style.cursor = near(p, sideTransform.origin, 13) ? 'ns-resize' : near(p, sideTransform.handle, 13) ? 'crosshair' : 'default'; return; }
  const s = currentSpeaker(), t = sideDrag.transform;
  if (!s) return;
  if (sideDrag.kind === 'height') s.z = Math.round(clamp((t.baseline - p.y) / t.sz, 0, 200) * 4) / 4;
  else s.tilt = Math.round(clamp(Math.atan2((p.y - t.origin.y) / t.sz, (p.x - t.origin.x) / t.sx) / RAD, -85, 85));
  changed();
});
side.addEventListener('pointerup', () => { sideDrag = null; schedule(); }); side.addEventListener('pointercancel', () => { sideDrag = null; });

let editingElement = null, editingSaved = false;
$('#inspector-content').addEventListener('focusin', event => {
  if (event.target.matches('[data-key]')) { editingElement = event.target; editingSaved = false; }
});
function applyControl(input) {
  const key = input.dataset.key;
  if (!key) return;
  const { object, field: property, group } = targetFor(key);
  if (!object) return;
  let value = input.value;
  if (input.type === 'number' || input.type === 'range') {
    if (value === '' || !Number.isFinite(Number(value))) return;
    value = clamp(Number(value), Number(input.min), Number(input.max));
    if (group === 'room') {
      const required = Math.max(4, ...state.tables.map(t => tableBounds(t)[property]));
      if (value < required) { toast(`The placed tables need at least ${fmt(required)} ft. Remove or rotate them first.`); input.value = object[property]; return; }
    }
  }
  if (object[property] === value) return;
  if (editingElement !== input || !editingSaved) { checkpoint(); editingSaved = true; }
  object[property] = value; constrainLayout(state);
  if (property === 'name') $('#speaker-list').innerHTML = speakerListHTML();
  changed(group !== 'table' && group !== 'stage');
}
$('#inspector-content').addEventListener('input', event => {
  if (!event.target.dataset.key?.startsWith('room.')) applyControl(event.target);
});
$('#inspector-content').addEventListener('keydown', event => {
  if (event.key === 'Enter' && event.target.dataset.key?.startsWith('room.')) {
    event.preventDefault();
    applyControl(event.target);
    event.target.blur();
  }
});
$('#inspector-content').addEventListener('change', event => {
  if (event.target.dataset.key?.startsWith('room.')) applyControl(event.target);
  if (event.target.dataset.key && event.target.type === 'number') {
    const { object, field } = targetFor(event.target.dataset.key);
    if (object) event.target.value = fmt(object[field], 2);
  }
  if ($('#speaker-list')) $('#speaker-list').innerHTML = speakerListHTML();
});
$('#inspector-content').addEventListener('focusout', event => {
  if (event.target.dataset.key?.startsWith('room.')) applyControl(event.target);
  if (editingElement === event.target) { editingElement = null; schedule(); }
});

function addSpeaker() {
  checkpoint(); const id = state.nextSpeaker++;
  const existing = currentSpeaker();
  const x = clamp(existing ? existing.x + 4 : state.room.w / 2, 0, state.room.w), y = clamp(existing ? existing.y + 3 : state.audience.y - 3, 0, state.room.d);
  state.speakers.push(speaker(id, x, y, 0, preferences.defaultOffset)); select('speaker', id); changed();
}
function addTable(type) {
  const w = type === 'round' ? 8 : Number(type), d = type === 'round' ? 8 : 2.5;
  if (state.room.w < w || state.room.d < d) { toast('This table is larger than the room. Enlarge the room first.'); return; }
  checkpoint(); const id = state.nextTable++;
  state.tables.push({ id, type: type === 'round' ? 'round' : 'rect', w, d, x: state.room.w / 2, y: clamp(state.audience.y + 10 + (state.tables.length % 4) * 5, d / 2, state.room.d - d / 2), angle: 0 });
  constrainLayout(state); select('table', id); changed(false);
}
function removeSelected() {
  if (!['speaker', 'table'].includes(selected?.kind)) return;
  checkpoint();
  if (selected.kind === 'speaker') {
    state.speakers = state.speakers.filter(s => s.id !== selected.id);
    selected = state.speakers[0] ? { kind: 'speaker', id: state.speakers[0].id } : null;
  } else { state.tables = state.tables.filter(t => t.id !== selected.id); selected = null; }
  renderInspector(); changed();
}
function duplicateSelected() {
  const s = currentSpeaker(), t = currentTable(); if (!s && !t) return;
  checkpoint();
  if (s) {
    const id = state.nextSpeaker++; const clone = { ...s, id, name: `S${String(id).padStart(2, '0')}`, x: s.x + 4, y: s.y + 3 };
    state.speakers.push(clone); constrainLayout(state); select('speaker', id); changed();
  } else {
    const id = state.nextTable++; state.tables.push({ ...t, id, x: t.x + t.w + 2, y: t.y }); constrainLayout(state); select('table', id); changed(false);
  }
}
document.addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button) return;
  if (button.dataset.tab) { tab = button.dataset.tab; renderInspector(); }
  if (button.dataset.speakerId) select('speaker', Number(button.dataset.speakerId));
  if (button.dataset.muteId) {
    checkpoint(); const s = state.speakers.find(s => s.id === Number(button.dataset.muteId)); s.enabled = !s.enabled;
    $('#speaker-list').innerHTML = speakerListHTML(); changed();
  }
  if (button.dataset.addTable) addTable(button.dataset.addTable);
  if (button.dataset.action === 'add-speaker' || button.id === 'add-speaker') addSpeaker();
  if (button.dataset.action?.startsWith('delete-')) removeSelected();
  if (button.dataset.action?.startsWith('duplicate-')) duplicateSelected();
});
$('#undo').onclick = () => undo(); $('#redo').onclick = () => undo(true);
$('#zoom-in').onclick = () => zoomAt({ x: plan.clientWidth / 2, y: plan.clientHeight / 2 }, 1.2);
$('#zoom-out').onclick = () => zoomAt({ x: plan.clientWidth / 2, y: plan.clientHeight / 2 }, 1 / 1.2);
$('#fit').onclick = () => { zoom = 1; pan = { x: 0, y: 0 }; schedule(); };
$('#seated').onclick = () => { if (state.listenerHeight !== 4) { checkpoint(); state.listenerHeight = 4; changed(); } };
$('#standing').onclick = () => { if (state.listenerHeight !== 5.5) { checkpoint(); state.listenerHeight = 5.5; changed(); } };
$('#heatmap-toggle').onchange = event => { heatmap = event.target.checked; schedule(); };
$('#overlap-toggle').onchange = event => { overlap = event.target.checked; schedule(); };
$('#event-preset').onchange = event => {
  checkpoint(); state = createStudy(event.target.value, preferences.defaultOffset); selected = { kind: 'speaker', id: 1 }; tab = 'space';
  zoom = 1; pan = { x: 0, y: 0 }; renderInspector(); changed(); toast('Starting layout loaded. Undo restores your previous study.');
};
$('#settings-button').onclick = () => $('#settings-dialog').showModal();
$('#model-notes-button').onclick = () => $('#model-dialog').showModal();
$('#default-offset').oninput = event => { if (event.target.value !== '' && Number.isFinite(Number(event.target.value))) preferences.defaultOffset = clamp(Number(event.target.value), -60, 0); };
for (const key of ['min', 'max']) $(`#legend-${key}`).onchange = event => {
  const value = Number(event.target.value);
  if (!Number.isFinite(value) || (key === 'min' && value >= preferences.legendMax) || (key === 'max' && value <= preferences.legendMin)) {
    event.target.value = preferences[key === 'min' ? 'legendMin' : 'legendMax']; toast('Legend maximum must be greater than its minimum.'); return;
  }
  preferences[key === 'min' ? 'legendMin' : 'legendMax'] = value; schedule();
};
document.addEventListener('keydown', event => {
  if (event.target.matches('input,select,textarea') || document.querySelector('dialog[open]')) return;
  if (event.code === 'Space') { event.preventDefault(); spaceHeld = true; plan.style.cursor = 'grab'; }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); undo(event.shiftKey); }
  if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); removeSelected(); }
});
document.addEventListener('keyup', event => { if (event.code === 'Space') { spaceHeld = false; plan.style.cursor = 'default'; } });
window.addEventListener('blur', () => { spaceHeld = false; drag = null; sideDrag = null; });
new ResizeObserver(schedule).observe($('#plan-container'));
new ResizeObserver(schedule).observe($('.side-container'));
renderInspector(); schedule();
