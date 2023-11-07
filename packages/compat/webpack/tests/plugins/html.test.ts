import { pluginEntry } from '@rsbuild/core/plugins/entry';
import { pluginHtml } from '@rsbuild/core/plugins/html';
import { createStubRsbuild } from '../helper';

describe('plugin-html', () => {
  it('should register html plugin correctly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      entry: {
        main: './src/main.ts',
      },
    });
    const config = await rsbuild.unwrapWebpackConfig();

    expect(await rsbuild.matchWebpackPlugin('HtmlWebpackPlugin')).toBeTruthy();
    expect(config).toMatchSnapshot();
  });

  it('should not register html plugin when target is node', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      target: 'node',
      entry: {
        main: './src/main.ts',
      },
    });
    expect(await rsbuild.matchWebpackPlugin('HtmlWebpackPlugin')).toBeFalsy();
  });

  it('should not register html plugin when target is web-worker', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      target: 'web-worker',
      entry: {
        main: './src/main.ts',
      },
    });
    expect(await rsbuild.matchWebpackPlugin('HtmlWebpackPlugin')).toBeFalsy();
  });

  it('should not register html plugin when target is service-worker', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      target: 'service-worker',
      entry: {
        main: './src/main.ts',
      },
    });
    expect(await rsbuild.matchWebpackPlugin('HtmlWebpackPlugin')).toBeFalsy();
  });

  it('should register nonce plugin when using security.nonce', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      entry: {
        main: './src/main.ts',
      },
      rsbuildConfig: {
        security: {
          nonce: 'test-nonce',
        },
      },
    });

    expect(await rsbuild.matchWebpackPlugin('HtmlNoncePlugin')).toBeTruthy();
  });

  it('should register crossorigin plugin when using html.crossorigin', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      entry: {
        main: './src/main.ts',
      },
      rsbuildConfig: {
        html: {
          crossorigin: true,
        },
      },
    });

    const config = await rsbuild.unwrapWebpackConfig();
    expect(
      await rsbuild.matchWebpackPlugin('HtmlCrossOriginPlugin'),
    ).toBeTruthy();
    expect(config.output?.crossOriginLoading).toEqual('anonymous');
  });

  it('should register appIcon plugin when using html.appIcon', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      entry: {
        main: './src/main.ts',
      },
      rsbuildConfig: {
        html: {
          appIcon: './src/assets/icon.png',
        },
      },
    });

    expect(await rsbuild.matchWebpackPlugin('HtmlAppIconPlugin')).toBeTruthy();
  });

  it('should allow to set favicon by html.favicon option', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      entry: {
        main: './src/main.ts',
      },
      rsbuildConfig: {
        html: {
          favicon: './src/favicon.ico',
        },
      },
    });
    const config = await rsbuild.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to set inject by html.inject option', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      entry: {
        main: './src/main.ts',
      },
      rsbuildConfig: {
        html: {
          inject: 'body',
        },
      },
    });
    const config = await rsbuild.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should enable minify in production', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      entry: {
        main: './src/main.ts',
      },
    });
    const config = await rsbuild.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should allow to modify plugin options by tools.htmlPlugin', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      entry: {
        main: './src/main.ts',
      },
      rsbuildConfig: {
        tools: {
          htmlPlugin(_config, utils) {
            expect(utils.entryName).toEqual('main');
            return {
              inject: true,
            };
          },
        },
      },
    });
    const config = await rsbuild.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to disable html plugin', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      entry: {
        main: './src/main.ts',
      },
      rsbuildConfig: {
        tools: {
          htmlPlugin: false,
        },
      },
    });

    expect(await rsbuild.matchWebpackPlugin('HtmlWebpackPlugin')).toBeFalsy();
  });

  it('should disable html plugin when htmlPlugin is an array and contains false', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      entry: {
        main: './src/main.ts',
      },
      rsbuildConfig: {
        tools: {
          htmlPlugin: [{}, false],
        },
      },
    });

    expect(await rsbuild.matchWebpackPlugin('HtmlWebpackPlugin')).toBeFalsy();
  });

  it('should support multi entry', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      entry: {
        main: './src/main.ts',
        foo: './src/foo.ts',
      },
      rsbuildConfig: {
        html: {
          template({ entryName }) {
            return entryName === 'main' ? 'foo' : 'bar';
          },
        },
      },
    });
    const config = await rsbuild.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should add one tags plugin instance', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      entry: {
        main: './src/main.ts',
        foo: './src/foo.ts',
      },
      rsbuildConfig: {
        html: {
          tags: { tag: 'script', attrs: { src: 'jq.js' } },
          tagsByEntries: {},
        },
      },
    });
    const config = await rsbuild.unwrapWebpackConfig();
    const plugins = config.plugins?.filter((p) => p.name === 'HtmlTagsPlugin');
    expect(plugins?.length).toBe(1);
    expect(config).toMatchSnapshot();
  });

  it('should add tags plugin instances for each entries', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      entry: {
        main: './src/main.ts',
        foo: './src/foo.ts',
      },
      rsbuildConfig: {
        html: {
          tags: [{ tag: 'script', attrs: { src: 'jq.js' } }],
          tagsByEntries: {
            foo: [{ tag: 'script', attrs: { src: 'foo.js' } }],
          },
        },
      },
    });
    const config = await rsbuild.unwrapWebpackConfig();
    const plugins = config.plugins?.filter((p) => p.name === 'HtmlTagsPlugin');
    expect(plugins?.length).toBe(2);
    expect(config).toMatchSnapshot();
  });
});
