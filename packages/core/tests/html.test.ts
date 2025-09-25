import { createStubRsbuild } from '@scripts/test-helper';
import type { HtmlConfig, InternalContext } from '../src';
import { pluginEntry } from '../src/plugins/entry';
import { pluginHtml } from '../src/plugins/html';

describe('plugin-html', () => {
  const stubContext = {} as InternalContext;

  it('should register html plugin correctly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml(stubContext)],
    });
    const config = await rsbuild.unwrapConfig();

    expect(await rsbuild.matchBundlerPlugin('HtmlRspackPlugin')).toBeTruthy();
    expect(config).toMatchSnapshot();
  });

  it('should not register html plugin when target is node', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml(stubContext)],
      config: {
        output: {
          target: 'node',
        },
      },
    });
    expect(await rsbuild.matchBundlerPlugin('HtmlRspackPlugin')).toBeFalsy();
  });

  it('should not register html plugin when target is web-worker', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml(stubContext)],
      config: {
        output: {
          target: 'web-worker',
        },
      },
    });
    expect(await rsbuild.matchBundlerPlugin('HtmlRspackPlugin')).toBeFalsy();
  });

  it('should allow to set favicon by html.favicon option', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml(stubContext)],
      config: {
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
      plugins: [pluginEntry(), pluginHtml(stubContext)],
      config: {
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
      plugins: [pluginEntry(), pluginHtml(stubContext)],
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should allow to modify plugin options by tools.htmlPlugin', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml(stubContext)],
      config: {
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
      plugins: [pluginEntry(), pluginHtml(stubContext)],
      config: {
        tools: {
          htmlPlugin: false,
        },
      },
    });

    expect(await rsbuild.matchBundlerPlugin('HtmlRspackPlugin')).toBeFalsy();
  });

  it('should support multi entry', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml(stubContext)],
      config: {
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
      plugins: [pluginEntry(), pluginHtml(stubContext)],
      config: {
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

  it('should support environment html config', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml(stubContext)],
      config: {
        environments: {
          web: {
            source: {
              entry: {
                main: './src/main.ts',
              },
            },
            html: {
              mountId: 'app',
              title: 'web',
            },
            output: {
              distPath: {
                html: 'web',
              },
            },
          },
          web1: {
            source: {
              entry: {
                index: './src/main1.ts',
              },
            },
            html: {
              mountId: 'app1',
              title: 'web1',
            },
          },
        },
      },
    });
    const configs = await rsbuild.initConfigs();

    expect(configs).toMatchSnapshot();
  });

  it.each<{ value: HtmlConfig['inject']; message: string }>([
    { value: false, message: 'false' },
    { value: () => false, message: '() => false' },
  ])(
    'should stop injecting <script> if inject is $message',
    async ({ value }) => {
      const rsbuild = await createStubRsbuild({
        plugins: [pluginEntry(), pluginHtml(stubContext)],
        config: { html: { inject: value } },
      });
      const config = await rsbuild.unwrapConfig();
      expect(config).toMatchSnapshot();
    },
  );
});
