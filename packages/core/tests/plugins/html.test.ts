import { pluginHtml, getMetaTags } from '@src/plugins/html';
import { pluginEntry } from '@src/plugins/entry';
import { createStubRsbuild } from '@rsbuild/test-helper';

vi.mock('@rsbuild/shared', async (importOriginal) => {
  const mod = await importOriginal<any>();
  return {
    ...mod,
    isFileExists: async () => true,
  };
});

describe('plugin-html', () => {
  it('should register html plugin correctly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
    });
    const config = await rsbuild.unwrapConfig();

    expect(await rsbuild.matchBundlerPlugin('HtmlWebpackPlugin')).toBeTruthy();
    expect(config).toMatchSnapshot();
  });

  it('should not register html plugin when target is node', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      target: 'node',
    });
    expect(await rsbuild.matchBundlerPlugin('HtmlWebpackPlugin')).toBeFalsy();
  });

  it('should not register html plugin when target is web-worker', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      target: 'web-worker',
    });
    expect(await rsbuild.matchBundlerPlugin('HtmlWebpackPlugin')).toBeFalsy();
  });

  it('should not register html plugin when target is service-worker', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      target: 'service-worker',
    });
    expect(await rsbuild.matchBundlerPlugin('HtmlWebpackPlugin')).toBeFalsy();
  });

  it('should register nonce plugin when using security.nonce', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      rsbuildConfig: {
        security: {
          nonce: 'test-nonce',
        },
      },
    });

    expect(await rsbuild.matchBundlerPlugin('HtmlNoncePlugin')).toBeTruthy();
  });

  it('should register crossorigin plugin when using html.crossorigin', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      rsbuildConfig: {
        html: {
          crossorigin: true,
        },
      },
    });

    const config = await rsbuild.unwrapConfig();
    expect(
      await rsbuild.matchBundlerPlugin('HtmlCrossOriginPlugin'),
    ).toBeTruthy();
    expect(config.output?.crossOriginLoading).toEqual('anonymous');
  });

  it('should register appIcon plugin when using html.appIcon', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      rsbuildConfig: {
        html: {
          appIcon: './src/assets/icon.png',
        },
      },
    });

    expect(await rsbuild.matchBundlerPlugin('HtmlAppIconPlugin')).toBeTruthy();
  });

  it('should allow to set favicon by html.favicon option', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      rsbuildConfig: {
        html: {
          favicon: './src/favicon.ico',
        },
      },
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to set inject by html.inject option', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      rsbuildConfig: {
        html: {
          inject: 'body',
        },
      },
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should enable minify in production', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should allow to modify plugin options by tools.htmlPlugin', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      rsbuildConfig: {
        tools: {
          htmlPlugin(_config, utils) {
            expect(utils.entryName).toEqual('index');
            return {
              inject: true,
            };
          },
        },
      },
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to disable html plugin', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      rsbuildConfig: {
        tools: {
          htmlPlugin: false,
        },
      },
    });

    expect(await rsbuild.matchBundlerPlugin('HtmlWebpackPlugin')).toBeFalsy();
  });

  it('should disable html plugin when htmlPlugin is an array and contains false', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      rsbuildConfig: {
        tools: {
          htmlPlugin: [{}, false],
        },
      },
    });

    expect(await rsbuild.matchBundlerPlugin('HtmlWebpackPlugin')).toBeFalsy();
  });

  it('should support multi entry', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      rsbuildConfig: {
        source: {
          entry: {
            main: './src/main.ts',
            foo: './src/foo.ts',
          },
        },
        html: {
          template({ entryName }) {
            expect(['main', 'foo'].includes(entryName)).toBeTruthy();
          },
        },
      },
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should add one tags plugin instance', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      rsbuildConfig: {
        source: {
          entry: {
            main: './src/main.ts',
            foo: './src/foo.ts',
          },
        },
        html: {
          tags: { tag: 'script', attrs: { src: 'jq.js' } },
          tagsByEntries: {},
        },
      },
    });
    const config = await rsbuild.unwrapConfig();
    const plugins = config.plugins?.filter(
      (p: { name: string }) => p.name === 'HtmlTagsPlugin',
    );
    expect(plugins?.length).toBe(1);
    expect(config).toMatchSnapshot();
  });

  it('should add tags plugin instances for each entries', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      rsbuildConfig: {
        source: {
          entry: {
            main: './src/main.ts',
            foo: './src/foo.ts',
          },
        },
        html: {
          tags: [{ tag: 'script', attrs: { src: 'jq.js' } }],
          tagsByEntries: {
            foo: [{ tag: 'script', attrs: { src: 'foo.js' } }],
          },
        },
      },
    });
    const config = await rsbuild.unwrapConfig();
    const plugins = config.plugins?.filter(
      (p: { name: string }) => p.name === 'HtmlTagsPlugin',
    );
    expect(plugins?.length).toBe(2);
    expect(config).toMatchSnapshot();
  });
});

it('should generate meta tags correctly', async () => {
  const rsbuildConfig = {
    html: {
      meta: { description: 'This is basic meta', bar: 'bar', foo: 'foo' },
    },
    output: {} as any,
  };

  const defaultEntry = await getMetaTags('', rsbuildConfig);
  expect(defaultEntry).toMatchSnapshot();

  const entry1 = await getMetaTags('entry1', rsbuildConfig);
  expect(entry1).toMatchSnapshot();
});
