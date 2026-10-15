import { matchPlugin } from '@scripts/test-helper';
import { createRsbuild } from '../src';

describe('plugin-define', () => {
  test('should register define plugin correctly', async () => {
    const rsbuild = await createRsbuild({
      config: {
        source: {
          define: {
            NAME: JSON.stringify('Jack'),
          },
        },
      },
    });

    const config = (await rsbuild.initConfigs())[0];
    expect(matchPlugin(config, 'DefinePlugin')).toMatchSnapshot();
  });

  test.each([
    { CUSTOM: JSON.stringify('whole-object') },
    '({ CUSTOM: "whole-expression" })',
    null,
  ])(
    'should preserve an explicit import.meta.env definition: %j',
    async (env) => {
      const rsbuild = await createRsbuild({
        config: {
          source: {
            define: {
              'import.meta.env': env,
              'import.meta.env.CUSTOM': JSON.stringify('individual'),
            },
          },
        },
      });

      const [config] = await rsbuild.initConfigs();
      expect(matchPlugin(config, 'DefinePlugin')).toMatchObject({
        _args: [
          {
            'import.meta.env': env,
            'import.meta.env.CUSTOM': JSON.stringify('individual'),
          },
        ],
      });
    },
  );

  test('should not add nested paths as literal environment keys', async () => {
    const rsbuild = await createRsbuild({
      config: {
        source: {
          define: { 'import.meta.env.CONFIG.name': JSON.stringify('nested') },
        },
      },
    });

    const [config] = await rsbuild.initConfigs();
    const plugin = matchPlugin(config, 'DefinePlugin');
    expect(plugin).toMatchObject({
      _args: [
        {
          'import.meta.env.CONFIG.name': JSON.stringify('nested'),
          'import.meta.env': expect.not.objectContaining({
            'CONFIG.name': JSON.stringify('nested'),
          }),
        },
      ],
    });
  });
});
