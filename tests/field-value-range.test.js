import test from 'node:test';
import assert from 'node:assert/strict';
import { SampledFieldPlane } from '../domains/acoustics/sampled-field-plane.js';
import { OrthogonalFieldSlices } from '../domains/acoustics/orthogonal-field-slices.js';

const field = { sample: (x, y, z) => x + y + z };

test('SampledFieldPlane can recolor existing samples with an explicit shared range', () => {
  const view = new SampledFieldPlane({ field, bounds: { min: [0, 0, 0], max: [2, 0, 2] }, resolution: [2, 2] });
  view.rebuild();
  assert.deepEqual(view.sampleRange, [1, 3]);
  const valuesBefore = view.samples.map(sample => sample.value);
  view.setRange([0, 10]);
  assert.deepEqual(view.range, [0, 10]);
  assert.deepEqual(view.samples.map(sample => sample.value), valuesBefore);
  assert.equal(view.dirty, false);
});

test('OrthogonalFieldSlices exposes sample range separately from the shared display range', () => {
  const view = new OrthogonalFieldSlices({
    field,
    bounds: { min: [0, 0, 0], max: [2, 2, 2] },
    counts: { x: 1, y: 1, z: 1 },
    resolution: { xz: [2, 2], xy: [2, 2], yz: [2, 2] },
  });
  view.rebuild();
  const sampled = [...view.sampleRange];
  view.setRange([0, 12]);
  assert.deepEqual(view.sampleRange, sampled);
  assert.deepEqual(view.range, [0, 12]);
  assert.equal(view.dirty, false);
});
