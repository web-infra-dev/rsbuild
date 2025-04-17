import { createStubRsbuild } from '@scripts/test-helper';
import { createRsbuild } from '../src';
import { pluginOutput } from '../src/plugins/output';

describe('plugin-output', () => {
  it('should set output correctly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginOutput()],
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should allow to custom server directory with distPath.root', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginOutput()],
      rsbuildConfig: {
        output: {
          target: 'node',
          distPath: {
            root: 'dist/server',
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

  it('output config should works when target is node', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginOutput()],
      rsbuildConfig: {
        output: {
          target: 'node',
          distPath: {
            js: 'bundle',
          },
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

  it('should allow to use copy plugin with multiple config', async () => {
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

  it('should replace `<port>` placeholder with default port', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const rsbuild = await createStubRsbuild({
      plugins: [pluginOutput()],
      rsbuildConfig: {
        dev: {
          assetPrefix: 'http://example-<port>.com:<port>/',
        },
      },
    });

    const [config] = await rsbuild.initConfigs();
    expect(config?.output?.publicPath).toEqual('http://example-3000.com:3000/');
  });

  it('should replace `<port>` placeholder with server.port', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        server: { port: 4000 },
        dev: {
          assetPrefix: 'http://example-<port>.com:<port>/',
        },
      },
    });
    const [config] = await rsbuild.initConfigs();
    expect(config?.output?.publicPath).toEqual('http://example-4000.com:4000/');
    vi.unstubAllEnvs();
  });

  it('should replace `<port>` placeholder of `output.assetPrefix` with default port', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        output: {
          assetPrefix: 'http://example.com:<port>/',
        },
      },
    });

    const [config] = await rsbuild.initConfigs();
    expect(config?.output?.publicPath).toEqual('http://example.com:3000/');
    vi.unstubAllEnvs();
  });
});
