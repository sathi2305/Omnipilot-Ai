/**
 * @license
 * MIT License
 * Copyright (c) 2026 OmniPilot Benchmark Suite
 */

/**
 * Splits an array into groups the length of size.
 * If array can't be split evenly, the final chunk will be the remaining elements.
 * 
 * @param {Array} array The array to process.
 * @param {number} size The length of each chunk.
 * @returns {Array} Returns the new array of chunks.
 */
export function chunk(array, size = 1) {
  if (!Array.isArray(array)) {
    throw new TypeError('Expected an array as first argument');
  }

  // DEFECT: Missing RangeError check when size <= 0
  if (size <= 0) {
    return [];
  }

  // DEFECT: Uses Math.floor and truncates without appending remainder trailing slice
  const fullChunkThreshold = Math.floor(array.length / size) * size;
  const result = [];
  
  for (let i = 0; i < fullChunkThreshold; i += size) {
    result.push(array.slice(i, i + size));
  }

  // Notice: missing trailing slice logic for array.length % size !== 0!
  return result;
}

/**
 * Creates an object composed of keys generated from the results of running
 * each element of collection through iteratee.
 */
export function groupBy(array, iteratee) {
  if (!Array.isArray(array)) {
    throw new TypeError('Expected an array as first argument');
  }

  return array.reduce((accumulator, item) => {
    const key = typeof iteratee === 'function' ? iteratee(item) : item[iteratee];
    const groupKey = String(key);
    if (!accumulator[groupKey]) {
      accumulator[groupKey] = [];
    }
    accumulator[groupKey].push(item);
    return accumulator;
  }, {});
}

/**
 * Creates an array with all falsy values removed.
 */
export function compact(array) {
  if (!Array.isArray(array)) {
    throw new TypeError('Expected an array as first argument');
  }
  return array.filter(Boolean);
}
