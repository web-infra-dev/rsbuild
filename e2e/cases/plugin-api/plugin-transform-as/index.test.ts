import { basename } from 'node:path';
import { expect, test } from '@e2e/helper';
import type { RsbuildPlugin, TransformDescriptor } from '@rsbuild/core';

const cases: {
  name: string;
  descriptor: TransformDescriptor;
  compiled: boolean;
}[] = [
  {
    name: 'as and pre',
    descriptor: { as: '[resource-path].js', order: 'pre' },
    compiled: true,
  },
  {
    name: 'as without order',
    descriptor: { as: '[resource-path].js' },
    compiled: false,
  },
  {
    name: 'as and default',
    descriptor: { as: '[resource-path].js', order: 'default' },
    compiled: false,
  },
  {
    name: 'as and post',
    descriptor: { as: '[resource-path].js', order: 'post' },
    compiled: false,
  },
  {
    name: 'as and legacy enforce',
    descriptor: { as: '[resource-path].js', enforce: 'pre' },
    compiled: false,
  },
  {
    name: 'pre without as',
    descriptor: { order: 'pre' },
    compiled: false,
  },
];

for (const { name, descriptor, compiled } of cases) {
  test(`should preserve transform and rule ordering with ${name}`, async ({
    runBoth,
  }) => {
    const observed: boolean[] = [];
    const rewritten: string[] = [];
    await runBoth(
      () => {
        expect(observed).toEqual([compiled]);
        expect(rewritten).toEqual(descriptor.as ? ['value.custom'] : []);
        observed.length = 0;
        rewritten.length = 0;
      },
      {
        config: {
          plugins: [
            {
              name: 'transform-custom-format',
              setup(api) {
                api.transform(
                  { test: /\.custom(?:\.js)?$/, order: 'post' },
                  ({ code }) => {
                    observed.push(!code.includes('?.'));
                    return code;
                  },
                );
                api.transform(
                  { test: /\.custom$/, ...descriptor },
                  ({ code, resourcePath, resourceQuery }) => {
                    expect(code.trim()).toBe('CUSTOM_SOURCE');
                    expect(basename(resourcePath)).toBe('value.custom');
                    expect(resourceQuery).toBe('?example');
                    return 'export default (input) => input?.value ?? "transformed";';
                  },
                );
                api.transform(
                  { test: /\.custom\.js$/, order: 'pre' },
                  ({ code, resourcePath }) => {
                    rewritten.push(basename(resourcePath));
                    return code;
                  },
                );
              },
            } satisfies RsbuildPlugin,
          ],
        },
      },
    );
  });
}

test('should match pre transforms in registration order before SWC', async ({
  runBoth,
}) => {
  const compiled: boolean[] = [];
  await runBoth(
    () => {
      expect(compiled).toEqual([true]);
      compiled.length = 0;
    },
    {
      config: {
        plugins: [
          {
            name: 'rewrite-matching-path-twice',
            setup(api) {
              api.transform(
                {
                  test: /\.custom$/,
                  as: '[resource-path].intermediate',
                  order: 'pre',
                },
                () =>
                  'export default (input) => input?.value ?? "transformed";',
              );
              api.transform(
                {
                  test: /\.custom\.intermediate$/,
                  as: '[resource-path].js',
                  order: 'pre',
                },
                ({ code }) => code,
              );
              api.transform(
                { test: /\.custom\.intermediate\.js$/, order: 'post' },
                ({ code }) => {
                  compiled.push(!code.includes('?.'));
                  return code;
                },
              );
            },
          } satisfies RsbuildPlugin,
        ],
      },
    },
  );
});
