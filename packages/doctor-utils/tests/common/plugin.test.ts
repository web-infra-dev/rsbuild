import { describe, it, expect } from 'vitest';
import { Plugin } from '../../src/common';

describe('test src/common/plugin.ts', () => {
  it('getPluginHooks', () => {
    expect(Plugin.getPluginHooks({})).toStrictEqual([]);
    expect(
      Plugin.getPluginHooks({
        done: [],
        processAssets: [],
      }),
    ).toStrictEqual(['done', 'processAssets']);
  });

  it('getPluginTapNames', () => {
    expect(Plugin.getPluginTapNames({})).toStrictEqual([]);
    expect(
      Plugin.getPluginTapNames({
        done: [
          // @ts-expect-error
          { tapName: 'a:done' },
          // @ts-expect-error
          { tapName: 'b:done' },
        ],
        processAssets: [
          // @ts-expect-error
          { tapName: 'a:processAssets' },
          // @ts-expect-error
          { tapName: 'b:processAssets' },
        ],
      }),
    ).toStrictEqual(['a:done', 'b:done', 'a:processAssets', 'b:processAssets']);
  });

  it('getPluginSummary', () => {
    expect(Plugin.getPluginSummary({})).toStrictEqual({
      hooks: [],
      tapNames: [],
    });
    expect(
      Plugin.getPluginSummary({
        done: [
          // @ts-expect-error
          { tapName: 'a:done' },
          // @ts-expect-error
          { tapName: 'b:done' },
        ],
        processAssets: [
          // @ts-expect-error
          { tapName: 'a:processAssets' },
          // @ts-expect-error
          { tapName: 'b:processAssets' },
        ],
      }),
    ).toStrictEqual({
      hooks: ['done', 'processAssets'],
      tapNames: ['a:done', 'b:done', 'a:processAssets', 'b:processAssets'],
    });
  });
});
