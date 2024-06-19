import { createStubRsbuild } from '@scripts/test-helper';
import { pluginEslint } from '../src';

describe('plugin-type-check', () => {
  it('should apply eslint-webpack-plugin correctly', async () => {
    const rsbuild = await createStubRsbuild({
      cwd: __dirname,
      rsbuildConfig: {},
      plugins: [pluginEslint()],
    });

    expect(
      await rsbuild.matchBundlerPlugin('ESLintWebpackPlugin'),
    ).toBeTruthy();

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

  it('should only apply one eslint plugin when there are multiple targets', async () => {
    const rsbuild = await createStubRsbuild({
      cwd: __dirname,
      plugins: [pluginEslint()],
      rsbuildConfig: {
        environments: {
          web: {
            output: {
              target: 'web',
            },
          },
          node: {
            output: {
              target: 'node',
            },
          },
        },
      },
    });

    expect(
      await rsbuild.matchBundlerPlugin('ESLintWebpackPlugin'),
    ).toBeTruthy();

    const configs = await rsbuild.initConfigs();
    expect(configs[1].plugins).toBeFalsy();
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

    expect(await rsbuild.matchBundlerPlugin('ESLintWebpackPlugin')).toBeFalsy();
  });
});
