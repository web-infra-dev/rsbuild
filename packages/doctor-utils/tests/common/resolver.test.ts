import { describe, it, expect } from 'vitest';
import { SDK } from '@rsbuild/doctor-types';
import { Resolver } from '../../src/common';

describe('test src/common/resolver.ts', () => {
  it('isResolveSuccessData', () => {
    // @ts-expect-error
    expect(Resolver.isResolveSuccessData({})).toBeFalsy();
    // @ts-expect-error
    expect(Resolver.isResolveSuccessData({ result: '' })).toBeFalsy();
    // @ts-expect-error
    expect(Resolver.isResolveSuccessData({ result: '1' })).toBeTruthy();
  });

  it('isResolveFailData', () => {
    // @ts-expect-error
    expect(Resolver.isResolveFailData({})).toBeFalsy();
    // @ts-expect-error
    expect(Resolver.isResolveFailData({ error: '' })).toBeFalsy();
    // @ts-expect-error
    expect(Resolver.isResolveFailData({ error: '1' })).toBeTruthy();
    // @ts-expect-error
    expect(Resolver.isResolveFailData({ error: new Error('1') })).toBeTruthy();
  });

  it('getResolverFileTree', () => {
    expect(
      Resolver.getResolverFileTree([
        {
          issuerPath: 'a.ts',
          stacks: [],
          startAt: Date.now(),
          endAt: Date.now(),
          isEntry: false,
          request: 'lodash',
          result: 'lodash/dist/index.js',
          pid: 1,
          ppid: null,
        } as SDK.PathResolverSuccessData,
        {
          issuerPath: 'b.ts',
          stacks: [],
          startAt: Date.now(),
          endAt: Date.now(),
          isEntry: false,
          request: 'lodash',
          pid: 1,
          ppid: null,
          error: new Error('error'),
        } as SDK.PathResolverFailData,
      ]),
    ).toStrictEqual([{ issuerPath: 'a.ts' }, { issuerPath: 'b.ts' }]);
  });
});
