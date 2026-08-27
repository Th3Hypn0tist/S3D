import test from 'node:test';
import assert from 'node:assert/strict';
import { SampledFieldPlane } from '../domains/acoustics/sampled-field-plane.js';
import { OrthogonalFieldSlices } from '../domains/acoustics/orthogonal-field-slices.js';

test('hidden sampled field plane stays dirty without sampling', () => {
  let calls = 0;
  const view = new SampledFieldPlane({
    id: 'hidden-plane',
    field: () => { calls += 1; return 1; },
    bounds: { min: [0, 0, 0], max: [1, 0, 1] },
    resolution: [2, 2],
  });
  view.visible = false;
  view.update();
  assert.equal(calls, 0);
  assert.equal(view.dirty, true);
  view.visible = true;
  view.update();
  assert.equal(calls, 4);
  assert.equal(view.dirty, false);
});

test('hidden orthogonal field stays dirty without sampling', () => {
  let calls = 0;
  const view = new OrthogonalFieldSlices({
    id: 'hidden-slices',
    field: () => { calls += 1; return 1; },
    bounds: { min: [0, 0, 0], max: [1, 1, 1] },
    counts: { x: 1, y: 0, z: 0 },
    resolution: { yz: [2, 2] },
  });
  view.visible = false;
  view.update();
  assert.equal(calls, 0);
  assert.equal(view.dirty, true);
  view.visible = true;
  view.update();
  assert.equal(calls, 4);
  assert.equal(view.dirty, false);
});
