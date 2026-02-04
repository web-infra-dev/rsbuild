import { createStubRsbuild } from '@scripts/test-helper';
import { pluginBasic } from '../src/plugins/basic';

describe('plugin-basic', () => {
  afterEach(() => {
    rs.unstubAllEnvs();
  });

  it('should apply basic config correctly in development', async () => {
    rs.stubEnv('NODE_ENV', 'development');

    const rsbuild = await createStubRsbuild({
      plugins: [pluginBasic()],
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should apply basic config correctly in production', async () => {
    rs.stubEnv('NODE_ENV', 'production');

    const rsbuild = await createStubRsbuild({
      plugins: [pluginBasic()],
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should not minimizer when output.minify is false', async () => {
    rs.stubEnv('NODE_ENV', 'production');

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
  });
});
