import { createStubRsbuild } from '@rsbuild/test-helper';
import { pluginMinimize } from '@/plugins/minimize';

describe('plugin-minimize', () => {
  it('should not apply minimizer in development', async () => {
    process.env.NODE_ENV = 'development';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginMinimize()],
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0].optimization?.minimize).toEqual(false);
    expect(bundlerConfigs[0].optimization?.minimizer).toBeUndefined();

    process.env.NODE_ENV = 'test';
  });

  it('should apply minimizer in production', async () => {
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginMinimize()],
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0].optimization?.minimize).toEqual(true);

    expect(bundlerConfigs[0].optimization?.minimizer).toMatchInlineSnapshot(
      `
      [
        SwcJsMinimizerRspackPlugin {
          "_options": {
            "compress": "{"passes":1,"pure_funcs":[],"drop_console":false}",
            "exclude": undefined,
            "extractComments": "true",
            "format": "{"comments":false,"asciiOnly":true}",
            "include": undefined,
            "mangle": "{"keep_classnames":false,"keep_fnames":false}",
            "module": undefined,
            "test": undefined,
          },
          "affectedHooks": "compilation",
          "name": "SwcJsMinimizerRspackPlugin",
        },
        SwcCssMinimizerRspackPlugin {
          "_options": undefined,
          "affectedHooks": undefined,
          "name": "SwcCssMinimizerRspackPlugin",
        },
      ]
    `,
    );

    process.env.NODE_ENV = 'test';
  });

  it('should not apply minimizer when output.disableMinimize is true', async () => {
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginMinimize()],
      rsbuildConfig: {
        output: {
          disableMinimize: true,
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0].optimization?.minimize).toEqual(false);

    process.env.NODE_ENV = 'test';
  });

  it('should dropConsole when performance.removeConsole is true', async () => {
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginMinimize()],
      rsbuildConfig: {
        performance: {
          removeConsole: true,
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0].optimization?.minimizer).toMatchInlineSnapshot(
      `
      [
        SwcJsMinimizerRspackPlugin {
          "_options": {
            "compress": "{"passes":1,"pure_funcs":[],"drop_console":true}",
            "exclude": undefined,
            "extractComments": "true",
            "format": "{"comments":false,"asciiOnly":true}",
            "include": undefined,
            "mangle": "{"keep_classnames":false,"keep_fnames":false}",
            "module": undefined,
            "test": undefined,
          },
          "affectedHooks": "compilation",
          "name": "SwcJsMinimizerRspackPlugin",
        },
        SwcCssMinimizerRspackPlugin {
          "_options": undefined,
          "affectedHooks": undefined,
          "name": "SwcCssMinimizerRspackPlugin",
        },
      ]
    `,
    );

    process.env.NODE_ENV = 'test';
  });

  it('should remove specific console when performance.removeConsole is array', async () => {
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginMinimize()],
      rsbuildConfig: {
        performance: {
          removeConsole: ['log', 'warn'],
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0].optimization?.minimizer).toMatchInlineSnapshot(
      `
      [
        SwcJsMinimizerRspackPlugin {
          "_options": {
            "compress": "{"passes":1,"pure_funcs":["console.log","console.warn"],"drop_console":false}",
            "exclude": undefined,
            "extractComments": "true",
            "format": "{"comments":false,"asciiOnly":true}",
            "include": undefined,
            "mangle": "{"keep_classnames":false,"keep_fnames":false}",
            "module": undefined,
            "test": undefined,
          },
          "affectedHooks": "compilation",
          "name": "SwcJsMinimizerRspackPlugin",
        },
        SwcCssMinimizerRspackPlugin {
          "_options": undefined,
          "affectedHooks": undefined,
          "name": "SwcCssMinimizerRspackPlugin",
        },
      ]
    `,
    );

    process.env.NODE_ENV = 'test';
  });

  it('should set asciiOnly false when output.charset is utf8', async () => {
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginMinimize()],
      rsbuildConfig: {
        output: {
          charset: 'utf8',
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0].optimization?.minimizer).toMatchInlineSnapshot(
      `
      [
        SwcJsMinimizerRspackPlugin {
          "_options": {
            "compress": "{"passes":1,"pure_funcs":[],"drop_console":false}",
            "exclude": undefined,
            "extractComments": "true",
            "format": "{"comments":false,"asciiOnly":false}",
            "include": undefined,
            "mangle": "{"keep_classnames":false,"keep_fnames":false}",
            "module": undefined,
            "test": undefined,
          },
          "affectedHooks": "compilation",
          "name": "SwcJsMinimizerRspackPlugin",
        },
        SwcCssMinimizerRspackPlugin {
          "_options": undefined,
          "affectedHooks": undefined,
          "name": "SwcCssMinimizerRspackPlugin",
        },
      ]
    `,
    );

    process.env.NODE_ENV = 'test';
  });
});
