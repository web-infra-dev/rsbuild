import type { RsbuildConfig } from '@rsbuild/shared';
import { createStubRsbuild } from '@scripts/test-helper';
import { pluginEntry } from '../src/plugins/entry';
import { pluginSwc } from '../src/plugins/swc';

describe('plugin-swc', () => {
  it('should disable preset_env in target other than web', async () => {
    await matchConfigSnapshot({
      output: {
        polyfill: 'entry',
        target: 'node',
      },
    });
  });

  it('should disable preset_env mode', async () => {
    await matchConfigSnapshot({
      output: {
        polyfill: 'off',
      },
    });
  });

  it('should enable usage mode preset_env', async () => {
    await matchConfigSnapshot({
      output: {
        polyfill: 'usage',
      },
    });
  });

  it('should enable entry mode preset_env', async () => {
    await matchConfigSnapshot({
      output: {
        polyfill: 'entry',
      },
    });
  });

  it('should add browserslist', async () => {
    await matchConfigSnapshot({
      output: {
        overrideBrowserslist: ['chrome 98'],
      },
    });
  });

  it('should has correct core-js', async () => {
    await matchConfigSnapshot({
      output: {
        polyfill: 'entry',
      },
    });

    await matchConfigSnapshot({
      output: {
        polyfill: 'entry',
        target: 'node',
      },
    });
  });

  it('should add pluginImport', async () => {
    await matchConfigSnapshot({
      source: {
        transformImport: [
          {
            libraryName: 'foo',
          },
        ],
      },
    });
  });

  it('should disable all pluginImport', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginSwc(), pluginEntry()],
      rsbuildConfig: {
        source: {
          entry: {
            main: './src/index.js',
          },
          transformImport: false,
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    for (const bundlerConfig of bundlerConfigs) {
      expect(bundlerConfig).toMatchSnapshot();
    }
  });

  it('should add antd pluginImport', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {
        source: {
          entry: {
            main: './src/index.js',
          },
        },
      },
      plugins: [pluginSwc(), pluginEntry()],
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    for (const bundlerConfig of bundlerConfigs) {
      expect(bundlerConfig).toMatchSnapshot();
    }
  });

  it('should allow to use `tools.swc` to configure swc-loader options', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {
        tools: {
          swc: {
            jsc: {
              externalHelpers: false,
            },
          },
        },
      },
      plugins: [pluginSwc()],
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    for (const bundlerConfig of bundlerConfigs) {
      expect(bundlerConfig.module?.rules).toMatchSnapshot();
    }
  });

  it('should allow to use `tools.swc` to be function type', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {
        tools: {
          swc() {
            return {
              jsc: {
                externalHelpers: false,
              },
            };
          },
        },
      },
      plugins: [pluginSwc()],
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    for (const bundlerConfig of bundlerConfigs) {
      expect(bundlerConfig.module?.rules).toMatchSnapshot();
    }
  });

  it('should apply environment config correctly', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {
        environments: {
          web: {
            source: {
              exclude: ['src/example'],
              transformImport: [
                {
                  libraryName: 'foo',
                },
              ],
            },
            output: {
              polyfill: 'usage',
              target: 'web',
            },
          },
          node: {
            source: {
              exclude: ['src/example1'],
              transformImport: [
                {
                  libraryName: 'bar',
                },
              ],
            },
            output: {
              polyfill: 'usage',
              target: 'node',
            },
          },
        },
      },
      plugins: [pluginSwc()],
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    for (const bundlerConfig of bundlerConfigs) {
      expect(bundlerConfig.module?.rules).toMatchSnapshot();
    }
  });
});

async function matchConfigSnapshot(rsbuildConfig: RsbuildConfig) {
  rsbuildConfig.source ||= {};
  rsbuildConfig.source.entry = {
    main: './src/index.js',
  };

  const rsbuild = await createStubRsbuild({
    plugins: [pluginSwc(), pluginEntry()],
    rsbuildConfig,
  });

  const {
    origin: { bundlerConfigs },
  } = await rsbuild.inspectConfig();

  expect(bundlerConfigs).toMatchSnapshot();
}
