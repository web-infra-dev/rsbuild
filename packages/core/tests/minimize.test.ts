import { createStubRsbuild } from '@scripts/test-helper';
import { pluginMinimize } from '../src/provider/plugins/minimize';
import { pluginHtml } from '../src/plugins/html';
import { pluginEntry } from '../src/plugins/entry';

describe('plugin-minimize', () => {
  it('should not apply minimizer in development', async () => {
    process.env.NODE_ENV = 'development';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginMinimize()],
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0].optimization?.minimizer).toBeUndefined();

    process.env.NODE_ENV = 'test';
  });

  it('should apply minimizer in production', async () => {
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginMinimize()],
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0].optimization?.minimizer).toMatchInlineSnapshot(
      `
      [
        SwcJsMinimizerRspackPlugin {
          "_options": {
            "compress": "{"passes":1,"pure_funcs":[],"drop_console":false}",
            "exclude": undefined,
            "extractComments": {
              "condition": "@preserve|@lic|@cc_on|^/**!",
            },
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

  it('should not minimizer for JS when output.minify.js is false', async () => {
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginMinimize()],
      rsbuildConfig: {
        output: {
          minify: {
            js: false,
          },
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0].optimization?.minimizer?.length).toBe(1);
    expect(bundlerConfigs[0].optimization?.minimizer?.[0]).toMatchObject({
      name: 'SwcCssMinimizerRspackPlugin',
    });

    process.env.NODE_ENV = 'test';
  });

  it('should not minimizer for CSS when output.minify.css is false', async () => {
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginMinimize()],
      rsbuildConfig: {
        output: {
          minify: {
            css: false,
          },
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0].optimization?.minimizer?.length).toBe(1);
    expect(bundlerConfigs[0].optimization?.minimizer?.[0]).toMatchObject({
      name: 'SwcJsMinimizerRspackPlugin',
    });

    process.env.NODE_ENV = 'test';
  });

  it('should not minimizer for HTML when output.minify.html is false', async () => {
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      rsbuildConfig: {
        output: {
          minify: {
            html: false,
          },
        },
      },
    });

    expect(await rsbuild.matchBundlerPlugin('HtmlWebpackPlugin')).toMatchObject(
      {
        options: {
          minify: false,
        },
      },
    );

    process.env.NODE_ENV = 'test';
  });

  it('should accept and merge options for JS minimizer', async () => {
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginMinimize()],
      rsbuildConfig: {
        output: {
          minify: {
            jsOptions: {
              exclude: 'no_js_minify',
            },
          },
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    // implicit assert the order of minimizers here,
    // could also be a guard for the order of minimizers
    expect(bundlerConfigs[0].optimization?.minimizer?.[0]).toMatchObject({
      _options: {
        exclude: 'no_js_minify',
      },
    });

    process.env.NODE_ENV = 'test';
  });

  it('should accept and merge options for HTML minimizer', async () => {
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      rsbuildConfig: {
        output: {
          minify: {
            htmlOptions: {
              minifyJS: false,
            },
          },
        },
      },
    });

    expect(await rsbuild.matchBundlerPlugin('HtmlWebpackPlugin')).toMatchObject(
      {
        options: {
          minify: {
            minifyJS: false,
          },
        },
      },
    );

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
            "extractComments": {
              "condition": "@preserve|@lic|@cc_on|^/**!",
            },
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
            "extractComments": {
              "condition": "@preserve|@lic|@cc_on|^/**!",
            },
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
            "extractComments": {
              "condition": "@preserve|@lic|@cc_on|^/**!",
            },
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
