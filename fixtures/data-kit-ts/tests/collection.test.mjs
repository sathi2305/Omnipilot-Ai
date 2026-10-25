import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { chunk, groupBy, compact } from '../src/collection.mjs';

describe('DataKit Collection Suite', () => {
  it('groupBy correctly categorizes objects by string key', () => {
    const users = [
      { id: 1, role: 'admin' },
      { id: 2, role: 'maintainer' },
      { id: 3, role: 'admin' },
    ];
    const grouped = groupBy(users, 'role');
    assert.deepEqual(Object.keys(grouped).sort(), ['admin', 'maintainer']);
    assert.equal(grouped.admin.length, 2);
    assert.equal(grouped.maintainer.length, 1);
  });

  it('compact strips all falsy values accurately', () => {
    const input = [0, 1, false, 2, '', 3, 'hello', null, undefined, NaN];
    const result = compact(input);
    assert.deepEqual(result, [1, 2, 3, 'hello']);
  });

  it('chunk divides array evenly into balanced partitions', () => {
    const input = [1, 2, 3, 4, 5, 6];
    const result = chunk(input, 2);
    assert.deepEqual(result, [[1, 2], [3, 4], [5, 6]]);
  });

  it('chunk handles uneven lengths and retains trailing remainder elements', () => {
    const input = [1, 2, 3, 4, 5];
    const result = chunk(input, 2);
    // Expect 3 chunks: [1, 2], [3, 4], and remainder [5]
    assert.deepEqual(result, [[1, 2], [3, 4], [5]]);
  });

  it('chunk throws RangeError when size is <= 0', () => {
    assert.throws(() => {
      chunk([1, 2, 3], 0);
    }, {
      name: 'RangeError',
      message: /Chunk size must be greater than 0/,
    });
  });
});
