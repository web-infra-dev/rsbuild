import { createStubRsbuild } from '@scripts/test-helper';
import { pluginTarget } from '../src/plugins/target';

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
    const rsbuild = await createStubRsbuild({
      plugins: [pluginTarget()],
      rsbuildConfig: {
        output: {
          target: item.target,
          overrideBrowserslist: item.browserslist || undefined,
        },
      },
    });

    const config = await rsbuild.unwrapConfig();

    expect(config).toEqual(item.expected);
  });
});
