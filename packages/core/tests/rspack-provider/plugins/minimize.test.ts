import { expect, describe, it } from 'vitest';
import { createStubRsbuild } from '@rsbuild/vitest-helper';
import { pluginMinimize } from '@/plugins/minimize';

describe('plugins/minimize', () => {
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
        Plugin {
          "_options": {
            "asciiOnly": true,
            "comments": "false",
            "dropConsole": false,
            "exclude": undefined,
            "extractComments": "true",
            "include": undefined,
            "keepClassNames": false,
            "keepFnNames": false,
            "passes": 1,
            "pureFuncs": [],
            "test": undefined,
          },
          "name": "SwcJsMinimizerRspackPlugin",
        },
        CssMinimizerPlugin {
          "options": {
            "exclude": undefined,
            "include": undefined,
            "minimizer": {
              "implementation": [Function],
              "options": {
                "preset": [
                  "default",
                  {
                    "mergeLonghand": false,
                  },
                ],
              },
            },
            "parallel": true,
            "test": /\\\\\\.css\\(\\\\\\?\\.\\*\\)\\?\\$/i,
            "warningsFilter": [Function],
          },
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
        Plugin {
          "_options": {
            "asciiOnly": true,
            "comments": "false",
            "dropConsole": true,
            "exclude": undefined,
            "extractComments": "true",
            "include": undefined,
            "keepClassNames": false,
            "keepFnNames": false,
            "passes": 1,
            "pureFuncs": [],
            "test": undefined,
          },
          "name": "SwcJsMinimizerRspackPlugin",
        },
        CssMinimizerPlugin {
          "options": {
            "exclude": undefined,
            "include": undefined,
            "minimizer": {
              "implementation": [Function],
              "options": {
                "preset": [
                  "default",
                  {
                    "mergeLonghand": false,
                  },
                ],
              },
            },
            "parallel": true,
            "test": /\\\\\\.css\\(\\\\\\?\\.\\*\\)\\?\\$/i,
            "warningsFilter": [Function],
          },
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
        Plugin {
          "_options": {
            "asciiOnly": true,
            "comments": "false",
            "dropConsole": false,
            "exclude": undefined,
            "extractComments": "true",
            "include": undefined,
            "keepClassNames": false,
            "keepFnNames": false,
            "passes": 1,
            "pureFuncs": [
              "console.log",
              "console.warn",
            ],
            "test": undefined,
          },
          "name": "SwcJsMinimizerRspackPlugin",
        },
        CssMinimizerPlugin {
          "options": {
            "exclude": undefined,
            "include": undefined,
            "minimizer": {
              "implementation": [Function],
              "options": {
                "preset": [
                  "default",
                  {
                    "mergeLonghand": false,
                  },
                ],
              },
            },
            "parallel": true,
            "test": /\\\\\\.css\\(\\\\\\?\\.\\*\\)\\?\\$/i,
            "warningsFilter": [Function],
          },
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
        Plugin {
          "_options": {
            "asciiOnly": false,
            "comments": "false",
            "dropConsole": false,
            "exclude": undefined,
            "extractComments": "true",
            "include": undefined,
            "keepClassNames": false,
            "keepFnNames": false,
            "passes": 1,
            "pureFuncs": [],
            "test": undefined,
          },
          "name": "SwcJsMinimizerRspackPlugin",
        },
        CssMinimizerPlugin {
          "options": {
            "exclude": undefined,
            "include": undefined,
            "minimizer": {
              "implementation": [Function],
              "options": {
                "preset": [
                  "default",
                  {
                    "mergeLonghand": false,
                  },
                ],
              },
            },
            "parallel": true,
            "test": /\\\\\\.css\\(\\\\\\?\\.\\*\\)\\?\\$/i,
            "warningsFilter": [Function],
          },
        },
      ]
    `,
    );

    process.env.NODE_ENV = 'test';
  });
});
