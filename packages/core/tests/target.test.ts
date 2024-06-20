import { getBrowserslist } from '@rsbuild/shared';
import { createStubRsbuild } from '@scripts/test-helper';
import type { MockInstance } from 'vitest';
import { pluginTarget } from '../src/plugins/target';

vi.mock('@rsbuild/shared', async (importOriginal) => {
  const mod = await importOriginal<any>();
  return {
    ...mod,
    getBrowserslist: vi.fn(),
  };
});

describe('plugin-target', () => {
  const cases = [
    {
      target: 'node' as const,
      browserslist: ['Chrome 100'],
      expected: { target: 'node' },
    },
    {
      browserslist: ['Chrome 100'],
      expected: { target: ['web', 'es2018'] },
    },
    {
      browserslist: null,
      expected: { target: ['web', 'es2017'] },
    },
    {
      target: 'web-worker' as const,
      browserslist: null,
      expected: { target: ['webworker', 'es2017'] },
    },
  ];

  test.each(cases)('%j', async (item) => {
    (getBrowserslist as unknown as MockInstance).mockResolvedValueOnce(
      item.browserslist,
    );

    const rsbuild = await createStubRsbuild({
      plugins: [pluginTarget()],
      rsbuildConfig: {
        output: {
          target: item.target,
        },
      },
    });

    const config = await rsbuild.unwrapConfig();

    expect(config).toEqual(item.expected);
  });
});
