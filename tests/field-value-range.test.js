import test from 'node:test';
import assert from 'node:assert/strict';
import { FieldViewRangeCoordinator } from '../domains/acoustics/field-view-range-coordinator.js';
import { SampledFieldPlane } from '../domains/acoustics/sampled-field-plane.js';
import { MAX_SLICES_PER_AXIS, OrthogonalFieldSlices } from '../domains/acoustics/orthogonal-field-slices.js';

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

test('increasing slice count preserves all previously visible slice positions', () => {
  const view = new OrthogonalFieldSlices({
    field,
    bounds: { min: [0, 0, 0], max: [8, 4, 6] },
    counts: { x: 2, y: 0, z: 0 },
    resolution: { yz: [2, 2] },
  });
  const two = view.slicePositions('x');
  view.setSliceCount('x', 3);
  const three = view.slicePositions('x');
  assert.deepEqual(three.slice(0, two.length), two);
  assert.equal(new Set(three).size, 3);
});

test('increasing slice count samples only newly added slices when field state is unchanged', () => {
  let sampleCount = 0;
  const countedField = { sample: (x, y, z) => { sampleCount += 1; return x + y + z; } };
  const view = new OrthogonalFieldSlices({
    field: countedField,
    bounds: { min: [0, 0, 0], max: [8, 4, 6] },
    counts: { x: 2, y: 0, z: 0 },
    resolution: { yz: [2, 2] },
  });
  view.rebuild();
  const firstPass = sampleCount;
  view.setSliceCount('x', 3);
  view.rebuild();
  assert.equal(sampleCount - firstPass, 4);
});

test('slice count is limited to ten per axis', () => {
  const view = new OrthogonalFieldSlices({ field, bounds: { min: [0, 0, 0], max: [2, 2, 2] } });
  assert.equal(MAX_SLICES_PER_AXIS, 10);
  assert.doesNotThrow(() => view.setSliceCount('x', 10));
  assert.throws(() => view.setSliceCount('x', 11), /0 to 10/);
});

test('shared range stays stable when only slice topology changes', () => {
  const heatmap = new SampledFieldPlane({ field, id: '2d', bounds: { min: [0, 0, 0], max: [2, 0, 2] }, resolution: [2, 2] });
  const slices = new OrthogonalFieldSlices({
    field: { sample: (x, y, z) => x + y + z + (x > 1 ? 100 : 0) },
    id: '3d',
    bounds: { min: [0, 0, 0], max: [2, 2, 2] },
    counts: { x: 1, y: 0, z: 0 },
    resolution: { yz: [2, 2] },
  });
  const coordinator = new FieldViewRangeCoordinator({ views: [heatmap, slices] });
  heatmap.visible = true;
  slices.visible = true;
  coordinator.update();
  const initial = [...coordinator.range];
  const heatmapColors = heatmap.samples.map(sample => [...sample.color]);

  slices.setSliceCount('x', 2);
  coordinator.invalidate();
  coordinator.update();

  assert.deepEqual(coordinator.range, initial);
  assert.deepEqual(heatmap.samples.map(sample => sample.color), heatmapColors);
});
