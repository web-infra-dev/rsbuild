import type { SpyInstance } from 'vitest';
import { createStubRsbuild } from '@rsbuild/test-helper';
import { getBrowserslist } from '@rsbuild/shared';
import { pluginTarget } from '@src/plugins/target';

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
      target: 'node',
      browserslist: ['foo'],
      expected: { target: 'node' },
    },
    {
      target: 'web',
      browserslist: ['foo'],
      expected: { target: ['web', 'browserslist'] },
    },
    {
      target: 'web',
      browserslist: null,
      expected: { target: ['web', 'es5'] },
    },
    {
      target: 'web-worker',
      browserslist: null,
      expected: { target: ['webworker', 'es5'] },
    },
  ];

  test.each(cases)('%j', async (item) => {
    (getBrowserslist as unknown as SpyInstance).mockResolvedValueOnce(
      item.browserslist,
    );

    const rsbuild = await createStubRsbuild({
      plugins: [pluginTarget()],
      target: item.target as any,
    });

    const config = await rsbuild.unwrapConfig();

    expect(config).toEqual(item.expected);
  });
});
