import test from 'node:test';
import assert from 'node:assert/strict';
import { FT, speaker, contribution, combine, createStudy, listenerZ, predict, sampleField, stageTiling, lineInterval } from '../prototype/model.js';
const close = (actual, expected, epsilon = 1e-8) => assert.ok(Math.abs(actual - expected) < epsilon, `${actual} != ${expected}`);

test('reference output uses per-speaker offset and loses 6.02 dB at double distance', () => {
  const s = { ...speaker(1, 0, 0), z: 0, tilt: 0 };
  close(contribution(s, { x: 0, y: 1 / FT, z: 0 }).level, 124);
  close(contribution(s, { x: 0, y: 2 / FT, z: 0 }).level, 124 - 20 * Math.log10(2));
  close(contribution({ ...s, offset: 0 }, { x: 0, y: 1 / FT, z: 0 }).level, 130);
  assert.ok(Number.isFinite(contribution(s, { x: 0, y: 0, z: 0 }).level));
});

test('horizontal and vertical nominal beam edges are -6 dB at equal distance', () => {
  const s = { ...speaker(1, 0, 0), z: 0, tilt: 0, horizontal: 90, vertical: 60 };
  const horizontal = contribution(s, { x: Math.SQRT1_2 / FT, y: Math.SQRT1_2 / FT, z: 0 });
  const vertical = contribution(s, { x: 0, y: Math.cos(Math.PI / 6) / FT, z: Math.sin(Math.PI / 6) / FT });
  close(horizontal.level, 118); close(vertical.level, 118);
  assert.equal(horizontal.inZone, true); assert.equal(vertical.inZone, true);
  assert.equal(contribution(s, { x: 0, y: -20, z: 0 }).inZone, false);
});

test('aiming follows azimuth and downward tilt in 3D', () => {
  const s = { ...speaker(1, 0, 0), z: 10, tilt: 30, azimuth: 90 };
  const p = { x: Math.cos(Math.PI / 6) / FT, y: 0, z: 10 - Math.sin(Math.PI / 6) / FT };
  close(contribution(s, p).level, 124);
});

test('energy sum and advisory use the two strongest contributors', () => {
  const c = (level, inZone = true) => ({ level, inZone });
  close(combine([c(90), c(90)]).level, 93.01029995663981);
  assert.equal(combine([c(90), c(87)]).overlap, true);
  assert.equal(combine([c(90), c(84)]).overlap, true);
  assert.equal(combine([c(90), c(75)]).overlap, false);
  assert.equal(combine([c(110), c(90), c(89)]).overlap, false);
  assert.equal(combine([c(90, false), c(89)]).overlap, false);
  assert.equal(combine([c(90)]).overlap, false);
  assert.equal(combine([]).level, null);
});

test('listening height is a vertical offset above the ramp and furniture has no acoustic effect', () => {
  const state = createStudy(); state.audience.rake = 10;
  close(listenerZ(state, state.audience.y), 4);
  close(listenerZ(state, state.audience.y + 20), 4 + 20 * Math.tan(Math.PI / 18));
  const before = predict(state, 20, 45);
  state.tables.push({ type: 'round', w: 8, d: 8, x: 20, y: 45 });
  close(predict(state, 20, 45).level, before.level);
  state.listenerHeight = 5.5;
  close(listenerZ(state, state.audience.y), 5.5);
  state.speakers.forEach(s => { s.enabled = false; });
  assert.equal(sampleField(state).min, null);
});

test('arbitrary stage size stays exact and custom while standard panels allow rotation', () => {
  const custom = { w: 10, d: 14, panel: '4x8' };
  assert.equal(stageTiling(custom).custom, true);
  assert.equal(custom.w, 10); assert.equal(custom.d, 14);
  assert.deepEqual(stageTiling({ w: 24, d: 12, panel: '4x8' }), { custom: false, w: 8, d: 4, count: 9 });
  assert.equal(stageTiling({ w: 12, d: 12, panel: '4x8' }).count, 9);
});

test('side section intersects the room through the selected aiming direction', () => {
  const room = { x: 0, y: 0, w: 40, d: 100 };
  assert.deepEqual(lineInterval({ x: 20, y: 10, azimuth: 0 }, room), [-10, 90]);
  const range = lineInterval({ x: 20, y: 10, azimuth: 90 }, room);
  close(range[0], -20); close(range[1], 20);
  assert.equal(lineInterval({ x: 50, y: 10, azimuth: 0 }, room), null);
});
