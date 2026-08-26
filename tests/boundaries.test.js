import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PerspectiveCamera } from '../core/index.js';
import { intersectPlane } from '../core/interaction/plane-drag-controller.js';
import { FrequencyRangeController, SpeakerNode, SampledFieldPlane } from '../domains/acoustics/index.js';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

test('core never imports domains', async () => {
  const pending = [join(root, 'core')];
  while (pending.length) {
    const directory = pending.pop();
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) pending.push(path);
      else if (entry.name.endsWith('.js')) assert.doesNotMatch(await readFile(path, 'utf8'), /domains\//);
    }
  }
});

test('acoustics modules are independently instantiable', () => {
  const controller = new FrequencyRangeController({ minHz: 20, maxHz: 120, selectedHz: 60, mode: 'single' });
  assert.deepEqual(controller.snapshot(), { minHz: 20, maxHz: 120, selectedHz: 60, mode: 'single' });
  controller.destroy();
});

test('camera center ray points at its target and intersects the floor', () => {
  const camera = new PerspectiveCamera({ position: [0, 4, 4], target: [0, 0, 0] });
  const ray = camera.ray(50, 50, { left: 0, top: 0, width: 100, height: 100 });
  const point = intersectPlane(ray, 0);
  assert.ok(Math.abs(point[0]) < 1e-9);
  assert.ok(Math.abs(point[2]) < 1e-9);
});

test('speaker movement invalidates dependent field data without waiting for drag end', () => {
  const speaker = new SpeakerNode({ id: 'speaker-1', position: [0, .2, 0] });
  let changes = 0;
  speaker.on('positionChanged', () => changes++);
  const field = new SampledFieldPlane({
    id: 'field',
    field: (x, _y, z) => Math.hypot(x - speaker.position[0], z - speaker.position[2]),
    bounds: { min: [-1, 0, -1], max: [1, 0, 1] },
    resolution: [4, 3],
  });
  field.update();
  assert.equal(field.samples.length, 12);
  speaker.setPosition([.5, .2, .25]);
  field.invalidate();
  field.update();
  assert.equal(changes, 1);
  assert.equal(field.dirty, false);
});
