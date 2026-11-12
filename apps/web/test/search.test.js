import assert from 'node:assert/strict';
import { test } from 'node:test';
import { scoreSearchMatch } from '../src/search.js';

test('global search accepts partial, accent-insensitive and approximate matches', () => {
  assert.ok(scoreSearchMatch('parais', ['Finca El Paraíso']) > 0);
  assert.ok(scoreSearchMatch('paraiso', ['Finca El Paraíso']) > 0);
  assert.ok(scoreSearchMatch('paraisoo', ['Finca El Paraíso']) > 0);
  assert.equal(scoreSearchMatch('sensores', ['Finca El Paraíso']), 0);
});
