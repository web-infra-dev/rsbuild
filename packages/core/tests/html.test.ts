import type { HtmlConfig } from '@rsbuild/shared';
import { createStubRsbuild } from '@scripts/test-helper';
import { pluginEntry } from '../src/plugins/entry';
import { pluginHtml } from '../src/plugins/html';

vi.mock('../src/helpers.js', async (importOriginal) => {
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
      rsbuildConfig: {
        output: {
          targets: ['node'],
        },
      },
    });
    expect(await rsbuild.matchBundlerPlugin('HtmlWebpackPlugin')).toBeFalsy();
  });

  it('should not register html plugin when target is web-worker', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      rsbuildConfig: {
        output: {
          targets: ['web-worker'],
        },
      },
    });
    expect(await rsbuild.matchBundlerPlugin('HtmlWebpackPlugin')).toBeFalsy();
  });

  it('should not register html plugin when target is service-worker', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      rsbuildConfig: {
        output: {
          targets: ['service-worker'],
        },
      },
    });
    expect(await rsbuild.matchBundlerPlugin('HtmlWebpackPlugin')).toBeFalsy();
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

  it('should allow to configure html.tags', async () => {
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
        },
      },
    });
    const config = await rsbuild.unwrapConfig();
    expect(config).toMatchSnapshot();
  });

  it.each<{ value: HtmlConfig['inject']; message: string }>([
    { value: false, message: 'false' },
    { value: () => false, message: '() => false' },
  ])(
    'should stop injecting <script> if inject is $message',
    async ({ value }) => {
      const rsbuild = await createStubRsbuild({
        plugins: [pluginEntry(), pluginHtml()],
        rsbuildConfig: { html: { inject: value } },
      });
      const config = await rsbuild.unwrapConfig();
      expect(config).toMatchSnapshot();
    },
  );
});
