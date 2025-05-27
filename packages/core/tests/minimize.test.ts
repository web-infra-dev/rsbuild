import { createStubRsbuild } from '@scripts/test-helper';
import { pluginMinimize } from '../src/plugins/minimize';

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
          "_args": [
            {
              "extractComments": true,
              "minimizerOptions": {
                "format": {
                  "asciiOnly": false,
                },
              },
            },
          ],
          "affectedHooks": "compilation",
          "name": "SwcJsMinimizerRspackPlugin",
        },
        LightningCssMinimizerRspackPlugin {
          "_args": [
            {
              "minimizerOptions": {
                "errorRecovery": true,
                "targets": [
                  "chrome >= 87",
                  "edge >= 88",
                  "firefox >= 78",
                  "safari >= 14",
                ],
              },
            },
          ],
          "affectedHooks": undefined,
          "name": "LightningCssMinimizerRspackPlugin",
        },
      ]
    `,
    );

    process.env.NODE_ENV = 'test';
  });

  it('should not apply minimizer for JS when output.minify.js is false', async () => {
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
      name: 'LightningCssMinimizerRspackPlugin',
    });

    process.env.NODE_ENV = 'test';
  });

  it('should not minimize when both output.minify.js and output.minify.css are false', async () => {
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginMinimize()],
      rsbuildConfig: {
        output: {
          minify: {
            css: false,
            js: false,
          },
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0].optimization?.minimize).toBe(false);

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
      _args: [
        {
          exclude: 'no_js_minify',
        },
      ],
    });

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
          "_args": [
            {
              "extractComments": true,
              "minimizerOptions": {
                "compress": {
                  "drop_console": true,
                },
                "format": {
                  "asciiOnly": false,
                },
              },
            },
          ],
          "affectedHooks": "compilation",
          "name": "SwcJsMinimizerRspackPlugin",
        },
        LightningCssMinimizerRspackPlugin {
          "_args": [
            {
              "minimizerOptions": {
                "errorRecovery": true,
                "targets": [
                  "chrome >= 87",
                  "edge >= 88",
                  "firefox >= 78",
                  "safari >= 14",
                ],
              },
            },
          ],
          "affectedHooks": undefined,
          "name": "LightningCssMinimizerRspackPlugin",
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
          "_args": [
            {
              "extractComments": true,
              "minimizerOptions": {
                "compress": {
                  "pure_funcs": [
                    "console.log",
                    "console.warn",
                  ],
                },
                "format": {
                  "asciiOnly": false,
                },
              },
            },
          ],
          "affectedHooks": "compilation",
          "name": "SwcJsMinimizerRspackPlugin",
        },
        LightningCssMinimizerRspackPlugin {
          "_args": [
            {
              "minimizerOptions": {
                "errorRecovery": true,
                "targets": [
                  "chrome >= 87",
                  "edge >= 88",
                  "firefox >= 78",
                  "safari >= 14",
                ],
              },
            },
          ],
          "affectedHooks": undefined,
          "name": "LightningCssMinimizerRspackPlugin",
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
          "_args": [
            {
              "extractComments": true,
              "minimizerOptions": {
                "format": {
                  "asciiOnly": false,
                },
              },
            },
          ],
          "affectedHooks": "compilation",
          "name": "SwcJsMinimizerRspackPlugin",
        },
        LightningCssMinimizerRspackPlugin {
          "_args": [
            {
              "minimizerOptions": {
                "errorRecovery": true,
                "targets": [
                  "chrome >= 87",
                  "edge >= 88",
                  "firefox >= 78",
                  "safari >= 14",
                ],
              },
            },
          ],
          "affectedHooks": undefined,
          "name": "LightningCssMinimizerRspackPlugin",
        },
      ]
    `,
    );

    process.env.NODE_ENV = 'test';
  });
});
