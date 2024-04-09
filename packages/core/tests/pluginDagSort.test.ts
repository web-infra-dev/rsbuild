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
    expect(result).toEqual([
      {
        name: '1',
      },
      {
        name: '4',
        post: [],
        pre: [],
      },
      {
        name: '6',
        post: [],
        pre: [],
      },
      {
        name: '5',
        post: ['3'],
        pre: ['6'],
      },
      {
        name: '3',
        post: ['2'],
        pre: ['1'],
      },
      {
        name: '2',
        post: [],
        pre: [],
      },
    ]);
  });

  it('should keep the order consistent', () => {
    const cases = [
      { name: '1' },
      { name: '2', pre: ['3'] },
      { name: '3' },
      { name: '4' },
    ] as RsbuildPlugin[];

    const result = pluginDagSort(cases);
    expect(result).toEqual([
      { name: '1' },
      { name: '3' },
      { name: '2', pre: ['3'] },
      { name: '4' },
    ]);
  });

  it('should allow some invalid plugins', () => {
    const cases = [
      { name: '1' },
      { name: '2', pre: [undefined], post: [] },
      { name: '3', pre: ['1'], post: ['2', undefined] },
      { name: undefined },
    ] as RsbuildPlugin[];

    const result = pluginDagSort(cases);
    expect(result).toEqual([
      {
        name: '1',
      },
      {
        name: '3',
        post: ['2', undefined],
        pre: ['1'],
      },
      {
        name: '2',
        post: [],
        pre: [undefined],
      },
      {
        name: undefined,
      },
    ]);
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
