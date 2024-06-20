import { createStubRsbuild } from '@scripts/test-helper';
import { pluginOutput } from '../src/plugins/output';

describe('plugin-output', () => {
  it('should set output correctly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginOutput()],
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should allow to custom server directory with distPath.server', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginOutput()],
      rsbuildConfig: {
        output: {
          target: 'node',
          distPath: {
            server: 'server',
          },
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should allow to set distPath.js and distPath.css to empty string', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginOutput()],
      rsbuildConfig: {
        output: {
          distPath: {
            js: '',
            css: '',
          },
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should allow to custom async js path via distPath.jsAsync', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginOutput()],
      rsbuildConfig: {
        output: {
          distPath: {
            jsAsync: 'custom/js',
          },
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(bundlerConfigs[0].output?.chunkFilename).toEqual(
      'custom/js/[name].js',
    );
  });

  it('should allow to use filename.js to modify filename', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginOutput()],
      rsbuildConfig: {
        output: {
          filename: {
            js: 'foo.js',
            css: '[name].css',
          },
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should allow to use copy plugin', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginOutput()],
      rsbuildConfig: {
        output: {
          copy: {
            patterns: [
              {
                from: 'test',
              },
            ],
          },
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should allow to use copy plugin with multiply config', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginOutput()],
      rsbuildConfig: {
        output: {
          copy: [
            {
              from: 'test',
            },
            'src/assets/',
          ],
        },
        tools: {
          bundlerChain: (chain, { CHAIN_ID }) => {
            chain.plugin(CHAIN_ID.PLUGIN.COPY).tap((args) => [
              {
                patterns: [...(args[0]?.patterns || []), 'tests/'],
              },
            ]);
          },
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should allow dev.assetPrefix to be `auto`', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginOutput()],
      rsbuildConfig: {
        dev: {
          assetPrefix: 'auto',
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(bundlerConfigs[0]?.output?.publicPath).toEqual('auto');
  });
});
