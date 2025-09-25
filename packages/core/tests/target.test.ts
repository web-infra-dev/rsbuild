import { createStubRsbuild } from '@scripts/test-helper';
import { pluginTarget } from '../src/plugins/target';

describe('plugin-target', () => {
  const cases = [
    {
      target: 'node' as const,
      browserslist: ['Chrome 100'],
      expected: 'node',
    },
    {
      browserslist: ['Chrome 100'],
      expected: ['web', 'browserslist:Chrome 100'],
    },
    {
      browserslist: null,
      expected: ['web', 'es2017'],
    },
    {
      target: 'web-worker' as const,
      browserslist: null,
      expected: ['webworker', 'es2017'],
    },
  ];

  test.each(cases)('%j', async (item) => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginTarget()],
      config: {
        output: {
          target: item.target,
          overrideBrowserslist: item.browserslist || undefined,
        },
      },
    });

    const config = await rsbuild.unwrapConfig();

    expect(config.target).toEqual(item.expected);
  });
});
