import { expect, describe, it } from 'vitest';
import { createStubRsbuild } from '@rsbuild/test-helper';
import { pluginDefine } from '@src/plugins/define';

describe('plugins/define', () => {
  const cases = [
    {
      name: 'globalVars & define',
      rsbuildConfig: {
        source: {
          globalVars: {
            'process.env.foo': 'foo',
            'import.meta.bar': {
              a: 'bar',
              b: false,
              c: { d: 42 },
            },
            'window.baz': [null, 'baz'],
          },
          define: {
            NAME: JSON.stringify('Jack'),
          },
        },
      },
    },
    {
      name: 'globalVars function',
      rsbuildConfig: {
        source: {
          globalVars: (obj: any, { env, target }: any) => {
            obj.ENV = env;
            obj.TARGET = target;
          },
        },
      },
    },
  ];

  it.each(cases)('$name', async (item) => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginDefine()],
      rsbuildConfig: item.rsbuildConfig,
    });

    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });
});
