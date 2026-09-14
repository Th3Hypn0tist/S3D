import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BOX_EDGE_INDICES,
  BOX_FACE_INDICES,
  BOX_FACE_ORDER,
  BOX_FACES,
  BOX_VERTICES,
  boxFaceIndex,
} from '../core/index.js';

test('box face order is canonical and axis-addressable', () => {
  assert.deepEqual(BOX_FACE_ORDER, ['z-', 'z+', 'x-', 'x+', 'y-', 'y+']);
  assert.deepEqual(
    BOX_FACES.map(({ id, axis, sign }) => ({ id, axis, sign })),
    [
      { id: 'z-', axis: 'z', sign: -1 },
      { id: 'z+', axis: 'z', sign: 1 },
      { id: 'x-', axis: 'x', sign: -1 },
      { id: 'x+', axis: 'x', sign: 1 },
      { id: 'y-', axis: 'y', sign: -1 },
      { id: 'y+', axis: 'y', sign: 1 },
    ],
  );
});

test('each canonical box face owns exactly two triangles', () => {
  assert.equal(BOX_FACES.length, 6);
  assert.equal(BOX_FACE_INDICES.length, 36);
  for (const face of BOX_FACES) assert.equal(face.indices.length, 6);
  assert.deepEqual(BOX_FACE_INDICES, BOX_FACES.flatMap(face => face.indices));
});

test('box geometry exposes one eight-vertex cube and twelve edges', () => {
  assert.equal(BOX_VERTICES.length, 24);
  assert.equal(BOX_EDGE_INDICES.length, 24);
});

test('boxFaceIndex resolves canonical face ids and rejects unknown faces', () => {
  for (let index = 0; index < BOX_FACE_ORDER.length; index += 1) {
    assert.equal(boxFaceIndex(BOX_FACE_ORDER[index]), index);
  }
  assert.throws(() => boxFaceIndex('front'), /unknown box face: front/);
});
