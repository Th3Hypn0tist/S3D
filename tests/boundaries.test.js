import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { FrequencyRangeController } from '../domains/acoustics/index.js';

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
