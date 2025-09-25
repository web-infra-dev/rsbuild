import { createStubRsbuild } from '@scripts/test-helper';
import type { RsbuildConfig } from '../src';
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

  it('should disable pluginImport when return undefined', async () => {
    await matchConfigSnapshot({
      source: {
        transformImport: () => {},
      },
    });
  });

  it('should apply pluginImport correctly when ConfigChain', async () => {
    await matchConfigSnapshot({
      source: {
        transformImport: [
          {
            libraryName: 'foo1',
          },
          // ignore foo1
          () => [],
          {
            libraryName: 'foo',
          },
          {
            libraryName: 'baz',
          },
          {
            libraryName: 'bar',
          },
          // ignore baz
          (value) => value.filter((v) => v.libraryName !== 'baz'),
        ],
      },
    });
  });

  it('should allow to use `tools.swc` to configure swc-loader options', async () => {
    const rsbuild = await createStubRsbuild({
      config: {
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
      config: {
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
      config: {
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

async function matchConfigSnapshot(config: RsbuildConfig) {
  config.source ||= {};
  config.source.entry = {
    main: './src/index.js',
  };

  const rsbuild = await createStubRsbuild({
    plugins: [pluginSwc(), pluginEntry()],
    config,
  });

  const {
    origin: { bundlerConfigs },
  } = await rsbuild.inspectConfig();

  expect(bundlerConfigs).toMatchSnapshot();
}
