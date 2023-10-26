import { deflateSync, inflateSync } from 'zlib';
import { Buffer } from 'buffer';

export function mergeIntervals(intervals: [number, number][]) {
  // Sort from small to large
  intervals.sort((a, b) => a[0] - b[0]);
  // The previous interval, the next interval, store the result
  let previous;
  let current;
  const result = [];
  for (let i = 0; i < intervals.length; i++) {
    current = intervals[i];
    // If the first interval or the current interval does not overlap with the previous interval, add the current interval to the result
    if (!previous || current[0] > previous[1]) {
      // Assign the current interval to the previous interval
      previous = current;
      result.push(current);
    } else {
      // Otherwise, the two intervals overlap
      // Update the end time of the previous interval
      previous[1] = Math.max(previous[1], current[1]);
    }
  }
  return result;
}

export function compressText(input: string): string {
  return deflateSync(input).toString('base64');
}

export function decompressText(input: string): string {
  return inflateSync(Buffer.from(input, 'base64')).toString();
}

export function random(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
