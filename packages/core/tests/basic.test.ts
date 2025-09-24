import { createStubRsbuild } from '@scripts/test-helper';
import { pluginBasic } from '../src/plugins/basic';

describe('plugin-basic', () => {
  it('should apply basic config correctly in development', async () => {
    process.env.NODE_ENV = 'development';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginBasic()],
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0]).toMatchSnapshot();

    process.env.NODE_ENV = 'test';
  });

  it('should apply basic config correctly in production', async () => {
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginBasic()],
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0]).toMatchSnapshot();

    process.env.NODE_ENV = 'test';
  });

  it('should not minimizer when output.minify is false', async () => {
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginBasic()],
      config: {
        output: {
          minify: false,
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0].optimization?.minimize).toBeFalsy();

    process.env.NODE_ENV = 'test';
  });
});
