// First-slice model. Distances in the study are feet; acoustic distance is metres.
export const FT = 0.3048;
export const RAD = Math.PI / 180;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const copy = value => structuredClone(value);
export const inside = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.d;
export const seatingZ = (state, y) => (y - state.audience.y) * Math.tan(state.audience.rake * RAD);
export const listenerZ = (state, y) => seatingZ(state, y) + state.listenerHeight;

export function speaker(id, x, y, azimuth = 0, offset = -6) {
  return { id, name: `S${String(id).padStart(2, '0')}`, x, y, z: 9, azimuth, tilt: 12, horizontal: 90, vertical: 60, peak: 130, offset, enabled: true };
}

export function createStudy(preset = 'conference', offset = -6) {
  const state = {
    preset, room: { w: 40, d: 100 }, stage: { x: 8, y: 3, w: 24, d: 12, h: 2, panel: '4x8' },
    audience: { x: 2, y: 20, w: 36, d: 74, rake: 0 }, listenerHeight: 4,
    speakers: [speaker(1, 6, 15, 9, offset), speaker(2, 34, 15, -9, offset)],
    tables: [], nextSpeaker: 3, nextTable: 1,
  };
  if (preset === 'concert') {
    state.room = { w: 60, d: 100 };
    state.stage = { x: 10, y: 2, w: 40, d: 16, h: 3, panel: '4x8' };
    state.audience = { x: 3, y: 24, w: 54, d: 70, rake: 9 };
    state.speakers = [speaker(1, 8, 18, 12, offset), speaker(2, 52, 18, -12, offset)];
    state.speakers.forEach(s => { s.z = 14; s.tilt = 4; s.horizontal = 80; });
  }
  if (preset === 'dinner') {
    state.room = { w: 60, d: 80 };
    state.stage = { x: 18, y: 3, w: 24, d: 8, h: 2, panel: '4x8' };
    state.audience = { x: 3, y: 18, w: 54, d: 56, rake: 0 };
    state.speakers = [speaker(1, 12, 12, 15, offset), speaker(2, 48, 12, -15, offset)];
    for (const y of [28, 44, 60]) for (const x of [12, 30, 48]) {
      state.tables.push({ id: state.nextTable++, type: 'round', x, y, w: 8, d: 8, angle: 0 });
    }
  }
  return state;
}

export function contribution(s, p) {
  const dx = p.x - s.x, dy = p.y - s.y, dz = p.z - s.z;
  const length = Math.hypot(dx, dy, dz);
  const a = s.azimuth * RAD, t = s.tilt * RAD;
  const forward = dx * Math.sin(a) * Math.cos(t) + dy * Math.cos(a) * Math.cos(t) - dz * Math.sin(t);
  const right = dx * Math.cos(a) - dy * Math.sin(a);
  const up = dx * Math.sin(a) * Math.sin(t) + dy * Math.cos(a) * Math.sin(t) + dz * Math.cos(t);
  const h = Math.atan2(right, forward) / RAD;
  const v = Math.atan2(up, forward) / RAD;
  const angularLoss = length < 1e-8 ? 0 : 6 * ((h / (s.horizontal / 2)) ** 2 + (v / (s.vertical / 2)) ** 2);
  const loss = Math.min(80, angularLoss);
  const distanceLoss = 20 * Math.log10(Math.max(1, length * FT));
  return { id: s.id, level: s.peak + s.offset - distanceLoss - loss, inZone: (forward > 0 || length < 1e-8) && angularLoss <= 6 + 1e-9 };
}

export function combine(contributions) {
  if (!contributions.length) return { level: null, overlap: false, contributions: [] };
  const sorted = contributions.slice().sort((a, b) => b.level - a.level);
  const maximum = sorted[0].level;
  const energy = sorted.reduce((sum, c) => sum + 10 ** ((c.level - maximum) / 10), 0);
  const overlap = sorted.length >= 2 && sorted[0].inZone && sorted[1].inZone && sorted[0].level - sorted[1].level <= 6 + 1e-9;
  return { level: maximum + 10 * Math.log10(energy), overlap, contributions: sorted };
}

export function predict(state, x, y) {
  const p = { x, y, z: listenerZ(state, y) };
  return combine(state.speakers.filter(s => s.enabled).map(s => contribution(s, p)));
}

export function sampleField(state) {
  const r = state.audience;
  const step = Math.max(r.w, r.d) / 90;
  const nx = Math.max(2, Math.ceil(r.w / step)), ny = Math.max(2, Math.ceil(r.d / step));
  const values = [], levels = [];
  let overlaps = 0;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const x = r.x + (i + 0.5) * r.w / nx, y = r.y + (j + 0.5) * r.d / ny;
    const p = predict(state, x, y);
    values.push({ x, y, level: p.level, overlap: p.overlap });
    if (p.level !== null) levels.push(p.level);
    if (p.overlap) overlaps++;
  }
  levels.sort((a, b) => a - b);
  return { values, dx: r.w / nx, dy: r.d / ny, min: levels[0] ?? null, max: levels.at(-1) ?? null, median: levels.length ? levels[Math.floor(levels.length / 2)] : null, overlap: overlaps / values.length * 100 };
}

function divisible(a, b) { return Math.abs(a / b - Math.round(a / b)) < 1e-7; }
export function stageTiling(stage) {
  if (!divisible(stage.w, 4) || !divisible(stage.d, 4)) return { custom: true };
  if (stage.panel === '4x8') {
    if (divisible(stage.d, 8)) return { custom: false, w: 4, d: 8, count: stage.w * stage.d / 32 };
    if (divisible(stage.w, 8)) return { custom: false, w: 8, d: 4, count: stage.w * stage.d / 32 };
  }
  return { custom: false, w: 4, d: 4, count: stage.w * stage.d / 16 };
}

// Intersection of an infinite horizontal aim line with a footprint, in feet from the speaker.
export function lineInterval(s, r) {
  const u = { x: Math.sin(s.azimuth * RAD), y: Math.cos(s.azimuth * RAD) };
  let low = -Infinity, high = Infinity;
  for (const [axis, size] of [['x', 'w'], ['y', 'd']]) {
    if (Math.abs(u[axis]) < 1e-10) {
      if (s[axis] < r[axis] || s[axis] > r[axis] + r[size]) return null;
    } else {
      const a = (r[axis] - s[axis]) / u[axis], b = (r[axis] + r[size] - s[axis]) / u[axis];
      low = Math.max(low, Math.min(a, b)); high = Math.min(high, Math.max(a, b));
    }
  }
  return low <= high ? [low, high] : null;
}

export function constrainLayout(state) {
  for (const r of [state.stage, state.audience]) {
    r.w = clamp(r.w, 1, state.room.w); r.d = clamp(r.d, 1, state.room.d);
    r.x = clamp(r.x, 0, state.room.w - r.w); r.y = clamp(r.y, 0, state.room.d - r.d);
  }
  for (const s of state.speakers) { s.x = clamp(s.x, 0, state.room.w); s.y = clamp(s.y, 0, state.room.d); }
  for (const t of state.tables) {
    const bounds = tableBounds(t);
    t.x = clamp(t.x, bounds.w / 2, Math.max(bounds.w / 2, state.room.w - bounds.w / 2));
    t.y = clamp(t.y, bounds.d / 2, Math.max(bounds.d / 2, state.room.d - bounds.d / 2));
  }
}

export function tableBounds(t) {
  if (t.type === 'round') return { w: t.w, d: t.d };
  const a = t.angle * RAD;
  return { w: Math.abs(t.w * Math.cos(a)) + Math.abs(t.d * Math.sin(a)), d: Math.abs(t.w * Math.sin(a)) + Math.abs(t.d * Math.cos(a)) };
}

const stops = [[39, 67, 115], [41, 126, 164], [82, 179, 169], [178, 207, 112], [240, 195, 84], [223, 113, 63], [169, 53, 59]];
export function colorFor(level, minimum = 65, maximum = 110) {
  if (level === null) return '#e4eae4';
  const v = clamp((level - minimum) / (maximum - minimum), 0, 1) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(v)), f = v - i;
  return `rgb(${stops[i].map((a, j) => Math.round(a + f * (stops[i + 1][j] - a))).join(',')})`;
}
