import test from 'node:test';
import assert from 'node:assert/strict';
import { SceneObject } from '../core/objects/object.js';
import { RenderStore } from '../core/render_store.js';
import { TransformGizmoController, candidatePosition, candidateRotation, setCandidatePosition, setCandidateRotation } from '../core/interaction/transform-gizmo-controller.js';

const identity = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];

test('SceneObject exposes reactive rotation state', () => {
  const object = new SceneObject({ id: 'object' });
  let event = null;
  object.on('rotationChanged', value => { event = value; });
  object.setRotation([.1, .2, .3]);
  assert.deepEqual(object.rotation, [.1, .2, .3]);
  assert.deepEqual(event.previous, [0, 0, 0]);
  assert.deepEqual(event.rotation, [.1, .2, .3]);
});

test('RenderStore box instances carry Euler rotation', () => {
  const store = new RenderStore();
  store.begin(identity);
  store.box([1,2,3], [4,5,6], [1,0,.5,.5], false, [.5,.25,.125]);
  const snapshot = store.snapshot();
  assert.equal(snapshot.counts.transparentBoxes, 1);
  assert.equal(snapshot.transparentBoxes.length, 13);
  assert.deepEqual([...snapshot.transparentBoxes.slice(0, 13)], [1,2,3,4,5,6,.5,.25,.125,1,0,.5,.5]);
});

test('transform gizmo helpers prefer candidate adapters', () => {
  const candidate = {
    position: [0,0,0], rotation: [0,0,0],
    gizmoGetPosition: () => [1,2,3],
    gizmoGetRotation: () => [.1,.2,.3],
    gizmoSetPosition(value) { this.position = value.map(item => item * 2); return this; },
    gizmoSetRotation(value) { this.rotation = value.map(item => item * 3); return this; },
  };
  assert.deepEqual(candidatePosition(candidate), [1,2,3]);
  assert.deepEqual(candidateRotation(candidate), [.1,.2,.3]);
  setCandidatePosition(candidate, [2,3,4]);
  setCandidateRotation(candidate, [.2,.3,.4]);
  assert.deepEqual(candidate.position, [4,6,8]);
  assert.deepEqual(candidate.rotation, [.6,.9,1.2]);
});

test('disabling transform gizmos releases active pointer capture immediately', () => {
  let captured = 7;
  const listeners = new Map();
  const canvas = {
    addEventListener(type, listener) { listeners.set(type, listener); },
    removeEventListener(type) { listeners.delete(type); },
    hasPointerCapture(id) { return captured === id; },
    releasePointerCapture(id) { if (captured === id) captured = null; },
  };
  const scene = { addLayer() { return () => {}; } };
  const controller = new TransformGizmoController(canvas, {}, scene, { enabled: true });
  controller.pointer = { id: 7 };
  controller.selected = { id: 'selected' };

  controller.setEnabled(false);

  assert.equal(controller.pointer, null);
  assert.equal(controller.selected, null);
  assert.equal(captured, null);
  controller.destroy();
});
