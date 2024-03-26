import type { RsbuildPlugin } from '@rsbuild/shared';
import { pluginDagSort } from '../src/pluginManager';

describe('sort plugins', () => {
  it('should verify each plugin', () => {
    const cases = [
      { name: '1' },
      { name: '2', pre: [], post: [] },
      { name: '3', pre: ['1'], post: ['2'] },
      { name: '4', pre: [], post: [] },
      { name: '5', pre: ['6'], post: ['3'] },
      { name: '6', pre: [], post: [] },
    ] as RsbuildPlugin[];

    const result = pluginDagSort(cases);
    const p1Index = result.findIndex((item) => item.name === '1');
    const p2Index = result.findIndex((item) => item.name === '2');
    const p3Index = result.findIndex((item) => item.name === '3');
    const p5Index = result.findIndex((item) => item.name === '5');
    const p6Index = result.findIndex((item) => item.name === '6');

    // is plugin 3 verified
    expect(p2Index > p3Index).toBeTruthy();
    expect(p1Index < p3Index).toBeTruthy();
    // is plugin 5 verified
    expect(p5Index < p3Index).toBeTruthy();
    expect(p5Index > p6Index).toBeTruthy();
  });

  it('should allow some invalid plugins', () => {
    const cases = [
      { name: '1' },
      { name: '2', pre: [undefined], post: [] },
      { name: '3', pre: ['1'], post: ['2', undefined] },
      { name: undefined },
    ] as RsbuildPlugin[];

    const result = pluginDagSort(cases);
    const p1Index = result.findIndex((item) => item.name === '1');
    const p2Index = result.findIndex((item) => item.name === '2');
    const p3Index = result.findIndex((item) => item.name === '3');

    expect(p2Index > p3Index).toBeTruthy();
    expect(p1Index < p3Index).toBeTruthy();
  });

  it('should throw error when plugin has ring', () => {
    const cases = [
      { name: '1', pre: [], post: [] },
      { name: '2', pre: [], post: ['5'] },
      { name: '3', pre: ['1'], post: ['2'] },
      { name: '4', pre: [], post: [] },
      { name: '5', pre: ['6'], post: ['3'] },
      { name: '6', pre: [], post: [] },
    ] as RsbuildPlugin[];

    expect(() => {
      pluginDagSort(cases);
    }).toThrow(/plugins dependencies has loop: 2,3,5/);
  });
});
