import { createStubRsbuild } from '@scripts/test-helper';
import { pluginEslint } from '../src';

describe('plugin-type-check', () => {
  it('should apply eslint-webpack-plugin correctly', async () => {
    const rsbuild = await createStubRsbuild({
      cwd: __dirname,
      rsbuildConfig: {},
      plugins: [pluginEslint()],
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to configure eslint-webpack-plugin options', async () => {
    const rsbuild = await createStubRsbuild({
      cwd: __dirname,
      rsbuildConfig: {},
      plugins: [
        pluginEslint({
          eslintPluginOptions: {
            exclude: ['node_modules', './src/index.js'],
          },
        }),
      ],
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should disable eslint plugin when enable is false', async () => {
    const rsbuild = await createStubRsbuild({
      cwd: __dirname,
      plugins: [
        pluginEslint({
          enable: false,
        }),
      ],
    });

    const configs = await rsbuild.unwrapConfig();
    expect(configs).toMatchSnapshot();
  });
});
