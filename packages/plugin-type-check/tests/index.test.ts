import { createStubRsbuild } from '@scripts/test-helper';
import { pluginTypeCheck } from '../src';

describe('plugin-type-check', () => {
  it('should apply fork-ts-checker-webpack-plugin correctly', async () => {
    const rsbuild = await createStubRsbuild({
      cwd: __dirname,
      rsbuildConfig: {},
      plugins: [pluginTypeCheck()],
    });

    expect(
      await rsbuild.matchBundlerPlugin('ForkTsCheckerWebpackPlugin'),
    ).toBeTruthy();

    const config = await rsbuild.unwrapConfig();
    expect(config).toMatchSnapshot();
  });

  it('should allow to configure fork-ts-checker-webpack-plugin options', async () => {
    const rsbuild = await createStubRsbuild({
      cwd: __dirname,
      rsbuildConfig: {},
      plugins: [
        pluginTypeCheck({
          forkTsCheckerOptions: {
            issue: {
              exclude: [{ file: './src/**/*.ts' }],
            },
          },
        }),
      ],
    });

    const config = await rsbuild.unwrapConfig();
    expect(config).toMatchSnapshot();
  });

  it('should allow to configure fork-ts-checker-webpack-plugin options via function', async () => {
    const rsbuild = await createStubRsbuild({
      cwd: __dirname,
      rsbuildConfig: {},
      plugins: [
        pluginTypeCheck({
          forkTsCheckerOptions(options) {
            options.async = false;
            return options;
          },
        }),
      ],
    });

    const config = await rsbuild.unwrapConfig();
    expect(config).toMatchSnapshot();
  });

  it('should only apply one ts-checker plugin when there is multiple targets', async () => {
    const rsbuild = await createStubRsbuild({
      cwd: __dirname,
      plugins: [pluginTypeCheck()],
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
      await rsbuild.matchBundlerPlugin('ForkTsCheckerWebpackPlugin'),
    ).toBeTruthy();

    const configs = await rsbuild.initConfigs();
    expect(configs[1].plugins).toBeFalsy();
  });

  it('should disable type checker when enable is false', async () => {
    const rsbuild = await createStubRsbuild({
      cwd: __dirname,
      plugins: [
        pluginTypeCheck({
          enable: false,
        }),
      ],
    });

    expect(
      await rsbuild.matchBundlerPlugin('ForkTsCheckerWebpackPlugin'),
    ).toBeFalsy();
  });
});
