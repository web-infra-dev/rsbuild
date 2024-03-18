import { pluginHtml } from '../../../core/src/plugins/html';
import { pluginMinimize } from '../src/plugins/minimize';
import { createStubRsbuild } from './helper';
import { pluginEntry } from '../../../core/src/plugins/entry';
import { pluginSwc } from '../../plugin-swc/src';

describe('plugin-minimize', () => {
  it('should not apply minimizer in development', async () => {
    process.env.NODE_ENV = 'development';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginMinimize()],
    });

    const config = await rsbuild.unwrapConfig();
    expect(config.optimization?.minimize).toEqual(false);

    process.env.NODE_ENV = 'test';
  });

  it('should apply minimizer in production', async () => {
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginMinimize()],
    });

    const config = await rsbuild.unwrapConfig();
    expect(config.optimization).toMatchSnapshot();

    process.env.NODE_ENV = 'test';
  });

  it('should not apply minimizer when output.minify is false', async () => {
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginMinimize()],
      rsbuildConfig: {
        output: {
          minify: false,
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0].optimization?.minimize).toEqual(false);

    process.env.NODE_ENV = 'test';
  });

  it('should not minimizer for JS when output.minify.js is false', async () => {
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginMinimize(), pluginSwc()],
      rsbuildConfig: {
        output: {
          minify: {
            js: false,
          },
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0].optimization?.minimizer?.length).toBe(1);
    expect(bundlerConfigs[0].optimization?.minimizer?.[0]).toMatchObject({
      minifyOptions: {
        jsMinify: undefined,
      },
    });

    process.env.NODE_ENV = 'test';
  });

  it('should not minimizer for CSS when output.minify.css is false', async () => {
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginMinimize(), pluginSwc()],
      rsbuildConfig: {
        output: {
          minify: {
            css: false,
          },
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0].optimization?.minimizer?.length).toEqual(1);
    expect(bundlerConfigs[0].optimization?.minimizer?.[0]).toMatchObject({
      minifyOptions: {
        cssMinify: undefined,
      },
    });

    process.env.NODE_ENV = 'test';
  });

  it('should not minimizer for HTML when output.minify.html is false', async () => {
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      rsbuildConfig: {
        output: {
          minify: {
            html: false,
          },
        },
      },
    });

    expect(await rsbuild.matchBundlerPlugin('HtmlWebpackPlugin')).toMatchObject(
      {
        options: {
          minify: false,
        },
      },
    );

    process.env.NODE_ENV = 'test';
  });

  it('should accept and merge options for HTML minimizer', async () => {
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml()],
      rsbuildConfig: {
        output: {
          minify: {
            htmlOptions: {
              minifyJS: false,
            },
          },
        },
      },
    });

    expect(await rsbuild.matchBundlerPlugin('HtmlWebpackPlugin')).toMatchObject(
      {
        options: {
          minify: {
            minifyJS: false,
          },
        },
      },
    );

    process.env.NODE_ENV = 'test';
  });
});
