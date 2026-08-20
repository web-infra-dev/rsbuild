import path from 'node:path';
import { matchRules } from '@scripts/test-helper';
import { createRsbuild, type RsbuildConfig } from '../src';

const defaultCwd = path.join(import.meta.dirname, '..');

describe('plugin-swc', () => {
  it('should disable preset-env for non-web targets', async () => {
    await expect(
      getMatchedRules({
        output: {
          polyfill: 'entry',
          target: 'node',
        },
      }),
    ).resolves.toMatchSnapshot();
  });

  it('should disable preset-env mode', async () => {
    await expect(
      getMatchedRules({
        output: {
          polyfill: 'off',
        },
      }),
    ).resolves.toMatchSnapshot();
  });

  it('should enable preset-env in usage mode', async () => {
    await expect(
      getMatchedRules({
        output: {
          polyfill: 'usage',
        },
      }),
    ).resolves.toMatchSnapshot();
  });

  it('should enable preset-env in entry mode', async () => {
    await expect(
      getMatchedRules({
        output: {
          polyfill: 'entry',
        },
      }),
    ).resolves.toMatchSnapshot();
  });

  it('should apply overrideBrowserslist', async () => {
    await expect(
      getMatchedRules({
        output: {
          overrideBrowserslist: ['chrome 98'],
        },
      }),
    ).resolves.toMatchSnapshot();
  });

  it('should use the correct core-js version', async () => {
    await expect(
      getMatchedRules({
        output: {
          polyfill: 'entry',
        },
      }),
    ).resolves.toMatchSnapshot();

    await expect(
      getMatchedRules({
        output: {
          polyfill: 'entry',
          target: 'node',
        },
      }),
    ).resolves.toMatchSnapshot();
  });

  it('should apply pluginImport', async () => {
    await expect(
      getMatchedRules({
        source: {
          transformImport: [
            {
              libraryName: 'foo',
            },
          ],
        },
      }),
    ).resolves.toMatchSnapshot();
  });

  it('should disable pluginImport when it returns undefined', async () => {
    await expect(
      getMatchedRules({
        source: {
          transformImport: () => {},
        },
      }),
    ).resolves.toMatchSnapshot();
  });

  it('should apply pluginImport correctly with ConfigChain', async () => {
    await expect(
      getMatchedRules({
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
      }),
    ).resolves.toMatchSnapshot();
  });

  it('should apply decorators version 2023-11', async () => {
    await expect(
      getMatchedRules({
        source: {
          decorators: {
            version: '2023-11',
          },
        },
      }),
    ).resolves.toMatchSnapshot();
  });

  it('should allow using `tools.swc` to configure swc-loader options', async () => {
    const rsbuild = await createRsbuild({
      cwd: defaultCwd,
      config: {
        tools: {
          swc: {
            jsc: {
              externalHelpers: false,
            },
          },
        },
      },
    });

    const rspackConfigs = await rsbuild.initConfigs();

    for (const rspackConfig of rspackConfigs) {
      expect(matchRules(rspackConfig, 'a.js')).toMatchSnapshot();
    }
  });

  it('should allow `tools.swc` to be a function', async () => {
    const rsbuild = await createRsbuild({
      cwd: defaultCwd,
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
    });

    const rspackConfigs = await rsbuild.initConfigs();

    for (const rspackConfig of rspackConfigs) {
      expect(matchRules(rspackConfig, 'a.js')).toMatchSnapshot();
    }
  });

  it('should apply environment config correctly', async () => {
    const rsbuild = await createRsbuild({
      cwd: defaultCwd,
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
    });

    const rspackConfigs = await rsbuild.initConfigs();

    for (const rspackConfig of rspackConfigs) {
      expect(matchRules(rspackConfig, 'a.js')).toMatchSnapshot();
    }
  });
});

async function getMatchedRules(config: RsbuildConfig) {
  config.source ||= {};
  config.source.entry = {
    main: './src/index.js',
  };

  const rsbuild = await createRsbuild({
    config,
    cwd: defaultCwd,
  });
  const rspackConfigs = await rsbuild.initConfigs();
  return rspackConfigs.map((rspackConfig) => matchRules(rspackConfig, 'a.js'));
}
