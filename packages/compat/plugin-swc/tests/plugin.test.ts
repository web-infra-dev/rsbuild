import type { NormalizedConfig } from '@rsbuild/core';
import type { ModifyWebpackChainUtils } from '@rsbuild/shared';
import { webpackProvider } from '@rsbuild/webpack';
import { createStubRsbuild } from '@scripts/test-helper';
import { pluginSwc } from '../src';
import { applyPluginConfig } from '../src/utils';

const TEST_BUILDER_CONFIG = {
  output: {},
  tools: {},
  source: {
    decorators: {
      version: 'legacy',
    },
  },
} as unknown as NormalizedConfig;

const UTILS = { target: 'web', isProd: true } as ModifyWebpackChainUtils;

describe('plugin-swc', () => {
  it('should set swc-loader', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginSwc()],
      rsbuildConfig: {
        provider: webpackProvider,
      },
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should set swc minimizer in production', async () => {
    process.env.NODE_ENV = 'production';
    const rsbuild = await createStubRsbuild({
      plugins: [pluginSwc()],
      rsbuildConfig: {
        provider: webpackProvider,
      },
    });
    const config = await rsbuild.unwrapConfig();
    expect(config.optimization).toMatchSnapshot();

    process.env.NODE_ENV = 'test';
  });

  it('should remove all comments when output.legalComments is none', async () => {
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginSwc()],
      rsbuildConfig: {
        output: {
          legalComments: 'none',
        },
        provider: webpackProvider,
      },
    });

    const config = await rsbuild.unwrapConfig();

    expect(JSON.stringify(config.optimization)).toContain('"comments":false');

    process.env.NODE_ENV = 'test';
  });

  it('should not enable ascii_only when output.charset is utf8', async () => {
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginSwc()],
      rsbuildConfig: {
        output: {
          charset: 'utf8',
        },
        provider: webpackProvider,
      },
    });

    const config = await rsbuild.unwrapConfig();
    expect(JSON.stringify(config.optimization)).toContain('"asciiOnly":false');

    process.env.NODE_ENV = 'test';
  });

  it('should not extractComments when output.legalComments is inline', async () => {
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginSwc()],
      rsbuildConfig: {
        output: {
          legalComments: 'inline',
        },
        provider: webpackProvider,
      },
    });

    const config = await rsbuild.unwrapConfig();

    expect(JSON.stringify(config.optimization)).toContain('"comments":"some"');

    process.env.NODE_ENV = 'test';
  });

  it('should set correct swc minimizer options in production', async () => {
    process.env.NODE_ENV = 'production';
    const rsbuild = await createStubRsbuild({
      plugins: [
        pluginSwc({
          jsMinify: {
            compress: false,
            mangle: false,
          },
        }),
      ],
      rsbuildConfig: {
        provider: webpackProvider,
      },
    });
    const config = await rsbuild.unwrapConfig();
    expect(config.optimization).toMatchSnapshot();

    process.env.NODE_ENV = 'test';
  });

  it('should set correct swc minimizer options using raw swc config', async () => {
    process.env.NODE_ENV = 'production';
    const rsbuild = await createStubRsbuild({
      plugins: [
        pluginSwc({
          jsc: {
            minify: {
              compress: false,
              mangle: false,
            },
          },
        }),
      ],
      rsbuildConfig: {
        provider: webpackProvider,
      },
    });
    const config = await rsbuild.unwrapConfig();
    expect(config.optimization).toMatchSnapshot();

    process.env.NODE_ENV = 'test';
  });

  it('should disable swc minify', async () => {
    process.env.NODE_ENV = 'production';
    const rsbuild = await createStubRsbuild({
      plugins: [
        pluginSwc({
          jsMinify: false,
          cssMinify: false,
        }),
      ],
      rsbuildConfig: {
        provider: webpackProvider,
      },
    });
    const config = await rsbuild.unwrapConfig();
    expect(config.optimization).toBeFalsy();
    process.env.NODE_ENV = 'test';
  });

  it('should disable swc minify when raw swc config', async () => {
    process.env.NODE_ENV = 'production';
    const rsbuild = await createStubRsbuild({
      plugins: [
        pluginSwc({
          jsMinify: false,
          cssMinify: false,
          jsc: {
            minify: {},
          },
          minify: true,
        }),
      ],
      rsbuildConfig: {
        provider: webpackProvider,
      },
    });
    const config = await rsbuild.unwrapConfig();
    expect(config.optimization).toBeFalsy();
    process.env.NODE_ENV = 'test';
  });

  it('should apply source.include and source.exclude correctly', async () => {
    process.env.NODE_ENV = 'development';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginSwc()],
      rsbuildConfig: {
        provider: webpackProvider,
        source: {
          include: [/foo/],
          exclude: [/bar/],
        },
      },
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should disable react refresh when dev.hmr is false', async () => {
    process.env.NODE_ENV = 'development';
    const rsbuild = await createStubRsbuild({
      plugins: [pluginSwc()],
      rsbuildConfig: {
        provider: webpackProvider,
        dev: {
          hmr: false,
        },
      },
    });
    const config = await rsbuild.unwrapConfig();
    expect(config.module).toMatchSnapshot();

    process.env.NODE_ENV = 'test';
  });

  it('should disable react refresh when target is not web', async () => {
    process.env.NODE_ENV = 'development';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginSwc()],
      rsbuildConfig: {
        provider: webpackProvider,
        output: {
          targets: ['node', 'service-worker', 'web', 'web-worker'],
        },
      },
    });
    const configs = await rsbuild.initConfigs();

    for (const config of configs) {
      expect(config.module).toMatchSnapshot();
    }

    process.env.NODE_ENV = 'test';
  });

  it('should not using minify in transform', async () => {
    const config = (
      await applyPluginConfig(
        {
          jsMinify: true,
        },
        UTILS,
        TEST_BUILDER_CONFIG,
        process.cwd(),
      )
    )[0].swcConfig;

    expect(config.minify).toBeFalsy();
  });

  it('should generate correct options in function form', async () => {
    const config = (
      await applyPluginConfig(
        (config, { setConfig }) => {
          setConfig(config, 'jsc.transform.react.runtime', 'foo');
          return config;
        },
        UTILS,
        TEST_BUILDER_CONFIG,
        process.cwd(),
      )
    )[0].swcConfig;

    expect(config.jsc?.transform?.react?.runtime).toBe('foo');
  });

  it('should generate correct options in function form using return', async () => {
    const config = await applyPluginConfig(
      (_config) => {
        return {};
      },
      UTILS,
      TEST_BUILDER_CONFIG,
      process.cwd(),
    );

    expect(config[0].swcConfig).toStrictEqual({});
  });

  it('should pass throng SWC config', async () => {
    {
      const config = (
        await applyPluginConfig(
          {
            jsc: {
              transform: {
                useDefineForClassFields: false,
              },
            },
          },
          UTILS,
          TEST_BUILDER_CONFIG,
          process.cwd(),
        )
      )[0].swcConfig;

      expect(config.jsc?.transform?.useDefineForClassFields).toBeFalsy();
    }

    {
      const config = (
        await applyPluginConfig(
          {
            env: {
              coreJs: '2',
            },
          },
          UTILS,
          TEST_BUILDER_CONFIG,
          process.cwd(),
        )
      )[0].swcConfig;

      expect(config.env?.coreJs).toBe('2');
      expect(config.env?.targets).toBeDefined();
    }

    {
      const config = (
        await applyPluginConfig(
          (config) => {
            config.env!.coreJs = '2';
            return config;
          },
          UTILS,
          TEST_BUILDER_CONFIG,
          process.cwd(),
        )
      )[0].swcConfig;

      expect(config.env?.coreJs).toBe('2');
      expect(config.env?.targets).toBeDefined();
    }
  });

  it('should set multiple swc-loader', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [
        pluginSwc({
          overrides: [
            {
              test: /override.ts/,
              jsc: {
                transform: {
                  useDefineForClassFields: false,
                },
              },
            },
          ],
          jsc: {
            transform: {
              useDefineForClassFields: true,
            },
          },
        }),
      ],
      rsbuildConfig: {
        provider: webpackProvider,
      },
    });
    const config = await rsbuild.unwrapConfig();

    expect(config.module!.rules).toMatchSnapshot();
  });

  it('should allow to disable transformLodash', async () => {
    const config = (
      await applyPluginConfig(
        {
          transformLodash: false,
        },
        UTILS,
        TEST_BUILDER_CONFIG,
        process.cwd(),
      )
    )[0].swcConfig;

    expect(config.extensions?.lodash).toBeFalsy();
  });
});
