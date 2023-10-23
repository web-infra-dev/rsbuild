import { createStubRsbuild } from '@rsbuild/test-helper';
import { pluginTypeCheck } from '../src';

describe('plugin-type-check', () => {
  it('should apply fork-ts-checker-webpack-plugin correctly', async () => {
    const rsbuild = await createStubRsbuild({
      cwd: __dirname,
      rsbuildConfig: {},
      plugins: [pluginTypeCheck()],
    });
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

  it('should only apply one ts-checker plugin when there is multiple targets', async () => {
    const builder = await createStubRsbuild({
      cwd: __dirname,
      plugins: [pluginTypeCheck()],
      target: ['web', 'node'],
    });

    const configs = await builder.unwrapConfig();
    expect(configs).toMatchSnapshot();
  });

  it('should disable type checker when enable is false', async () => {
    const builder = await createStubRsbuild({
      cwd: __dirname,
      plugins: [
        pluginTypeCheck({
          enable: false,
        }),
      ],
    });

    const configs = await builder.unwrapConfig();
    expect(configs).toMatchSnapshot();
  });
});
