import { RsbuildTarget } from '@rsbuild/shared';
import { pluginEntry } from '@src/plugins/entry';
import { createStubRsbuild } from '@rsbuild/test-helper';
import { pluginSwc } from '@/plugins/swc';
import { RsbuildConfig } from '@/types';

describe('plugin-swc', () => {
  it('should disable preset_env in target other than web', async () => {
    await matchConfigSnapshot('node', {
      output: {
        polyfill: 'entry',
      },
    });
  });

  it('should disable preset_env mode', async () => {
    await matchConfigSnapshot('web', {
      output: {
        polyfill: 'off',
      },
    });
  });

  it('should enable usage mode preset_env', async () => {
    await matchConfigSnapshot('web', {
      output: {
        polyfill: 'usage',
      },
    });
  });

  it('should enable entry mode preset_env', async () => {
    await matchConfigSnapshot('web', {
      output: {
        polyfill: 'entry',
      },
    });
  });

  it('should add browserslist', async () => {
    await matchConfigSnapshot('web', {
      output: {
        overrideBrowserslist: ['chrome 98'],
      },
    });

    await matchConfigSnapshot('web', {
      output: {
        overrideBrowserslist: {
          web: ['chrome 98'],
        },
      },
    });
  });

  it("should'n override browserslist when target platform is not web", async () => {
    await matchConfigSnapshot('web', {
      output: {
        overrideBrowserslist: {
          node: ['chrome 98'],
        },
      },
    });
  });

  it('should has correct core-js', async () => {
    await matchConfigSnapshot('web', {
      output: {
        polyfill: 'entry',
      },
    });

    await matchConfigSnapshot(['web', 'node'], {
      output: {
        polyfill: 'entry',
      },
    });
  });

  it('should add pluginImport', async () => {
    await matchConfigSnapshot('web', {
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
      target: 'web',
      plugins: [pluginSwc(), pluginEntry()],
      rsbuildConfig: {
        source: {
          entries: {
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
      target: 'web',
      rsbuildConfig: {
        source: {
          entries: {
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

async function matchConfigSnapshot(
  target: RsbuildTarget | RsbuildTarget[],
  rsbuildConfig: RsbuildConfig,
) {
  rsbuildConfig.source ||= {};
  rsbuildConfig.source.entries = {
    main: './src/index.js',
  };

  const rsbuild = await createStubRsbuild({
    target,
    plugins: [pluginSwc(), pluginEntry()],
    rsbuildConfig,
  });

  const {
    origin: { bundlerConfigs },
  } = await rsbuild.inspectConfig();

  bundlerConfigs.forEach((bundlerConfig) => {
    expect(bundlerConfig).toMatchSnapshot();
  });
}
