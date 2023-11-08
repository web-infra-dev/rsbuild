import { createStubRsbuild } from '@rsbuild/test-helper';
import { pluginGlobalVars } from '../src/shared/plugins/globalVars';

describe('plugin-global-vars', () => {
  const cases = [
    {
      name: 'globalVars',
      options: {
        'process.env.foo': 'foo',
        'import.meta.bar': {
          a: 'bar',
          b: false,
          c: { d: 42 },
        },
        'window.baz': [null, 'baz'],
      },
    },
    {
      name: 'globalVars function',
      options: (obj: any, { env, target }: any) => {
        obj.ENV = env;
        obj.TARGET = target;
      },
    },
  ];

  it.each(cases)('$name', async (item) => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginGlobalVars(item.options)],
    });

    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });
});
