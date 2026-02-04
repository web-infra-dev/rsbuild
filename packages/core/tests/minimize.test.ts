import { createStubRsbuild } from '@scripts/test-helper';
import { pluginMinimize } from '../src/plugins/minimize';

describe('plugin-minimize', () => {
  afterEach(() => {
    rs.unstubAllEnvs();
  });

  it('should not apply minimizer in development', async () => {
    rs.stubEnv('NODE_ENV', 'development');

    const rsbuild = await createStubRsbuild({
      plugins: [pluginMinimize()],
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0].optimization?.minimizer).toBeUndefined();
  });

  it('should apply minimizer in production', async () => {
    rs.stubEnv('NODE_ENV', 'production');

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
                  "chrome >= 107",
                  "edge >= 107",
                  "firefox >= 104",
                  "safari >= 16",
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
  });

  it('should not apply minimizer for JS when output.minify.js is false', async () => {
    rs.stubEnv('NODE_ENV', 'production');

    const rsbuild = await createStubRsbuild({
      plugins: [pluginMinimize()],
      config: {
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
  });

  it('should not minimize when both output.minify.js and output.minify.css are false', async () => {
    rs.stubEnv('NODE_ENV', 'production');

    const rsbuild = await createStubRsbuild({
      plugins: [pluginMinimize()],
      config: {
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
  });

  it('should not apply minimizer for CSS when output.minify.css is false', async () => {
    rs.stubEnv('NODE_ENV', 'production');

    const rsbuild = await createStubRsbuild({
      plugins: [pluginMinimize()],
      config: {
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
  });

  it('should accept and merge options for JS minimizer', async () => {
    rs.stubEnv('NODE_ENV', 'production');

    const rsbuild = await createStubRsbuild({
      plugins: [pluginMinimize()],
      config: {
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
  });

  it('should dropConsole when performance.removeConsole is true', async () => {
    rs.stubEnv('NODE_ENV', 'production');

    const rsbuild = await createStubRsbuild({
      plugins: [pluginMinimize()],
      config: {
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
                  "chrome >= 107",
                  "edge >= 107",
                  "firefox >= 104",
                  "safari >= 16",
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
  });

  it('should remove specific console when performance.removeConsole is array', async () => {
    rs.stubEnv('NODE_ENV', 'production');

    const rsbuild = await createStubRsbuild({
      plugins: [pluginMinimize()],
      config: {
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
                  "chrome >= 107",
                  "edge >= 107",
                  "firefox >= 104",
                  "safari >= 16",
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
  });

  it('should set asciiOnly false when output.charset is utf8', async () => {
    rs.stubEnv('NODE_ENV', 'production');

    const rsbuild = await createStubRsbuild({
      plugins: [pluginMinimize()],
      config: {
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
                  "chrome >= 107",
                  "edge >= 107",
                  "firefox >= 104",
                  "safari >= 16",
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
  });
});
