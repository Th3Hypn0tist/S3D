import test from 'node:test';
import assert from 'node:assert/strict';
import { SpeakerNode } from '../domains/acoustics/speaker-node.js';

test('SpeakerNode renders billboard label and forward direction', () => {
  const calls = { line: [], box: [], billboardText: [] };
  const renderer = {
    line: (...args) => calls.line.push(args),
    box: (...args) => calls.box.push(args),
    billboardText: (...args) => calls.billboardText.push(args),
  };
  const node = new SpeakerNode({ id: 'speaker', label: '7', position: [1, 2, 3], direction: [1, 0, 0] });
  node.draw(renderer);
  assert.equal(calls.billboardText.length, 1);
  assert.equal(calls.billboardText[0][0], '7');
  assert.equal(calls.line.length, 1);
  assert.deepEqual(calls.line[0][0], [1.2, 2, 3]);
  assert.deepEqual(calls.line[0][1], [1.72, 2, 3]);
});

test('SpeakerNode normalizes direction vectors', () => {
  const node = new SpeakerNode({ id: 'speaker', direction: [0, 0, 4] });
  assert.deepEqual(node.direction, [0, 0, 1]);
  node.setDirection([0, 3, 0]);
  assert.deepEqual(node.direction, [0, 1, 0]);
});
