import type { RsbuildConfig } from '@rsbuild/shared';
import { pluginEntry } from '@src/plugins/entry';
import { createStubRsbuild } from '@rsbuild/test-helper';
import { pluginSwc } from '@/plugins/swc';

describe('plugin-swc', () => {
  it('should disable preset_env in target other than web', async () => {
    await matchConfigSnapshot({
      output: {
        polyfill: 'entry',
        targets: ['node'],
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

    await matchConfigSnapshot({
      output: {
        overrideBrowserslist: {
          web: ['chrome 98'],
        },
      },
    });
  });

  it("should'n override browserslist when target platform is not web", async () => {
    await matchConfigSnapshot({
      output: {
        overrideBrowserslist: {
          node: ['chrome 98'],
        },
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
        targets: ['node'],
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

    bundlerConfigs.forEach((bundlerConfig) => {
      expect(bundlerConfig).toMatchSnapshot();
    });
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

    bundlerConfigs.forEach((bundlerConfig) => {
      expect(bundlerConfig).toMatchSnapshot();
    });
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
