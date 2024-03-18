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

  it('Terser and SWC minimizer should not coexist', async () => {
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginMinimize(), pluginSwc()],
    });

    const config = await rsbuild.unwrapConfig();
    expect(config.optimization?.minimizer.length).toBe(1);

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

  it('should accept and merge options for JS minimizer', async () => {
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginMinimize()],
      rsbuildConfig: {
        // `tools.terser` is not documented, but it's a valid option though
        tools: {
          terser: {
            exclude: 'no_js_minify',
          },
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    // implicit assert the order of minimizers here,
    // could also be a guard for the order of minimizers
    expect(bundlerConfigs[0].optimization?.minimizer?.[0]).toMatchObject({
      options: {
        exclude: 'no_js_minify',
      },
    });

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

  it('should not extractComments when output.legalComments is inline', async () => {
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginMinimize()],
      rsbuildConfig: {
        output: {
          legalComments: 'inline',
        },
      },
    });

    const config = await rsbuild.unwrapConfig();
    expect(JSON.stringify(config.optimization)).toContain(
      '"extractComments":false',
    );
    expect(JSON.stringify(config.optimization)).not.toContain(
      '"comments":false',
    );

    process.env.NODE_ENV = 'test';
  });

  it('should remove all comments when output.legalComments is none', async () => {
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginMinimize()],
      rsbuildConfig: {
        output: {
          legalComments: 'none',
        },
      },
    });

    const config = await rsbuild.unwrapConfig();
    expect(JSON.stringify(config.optimization)).toContain(
      '"extractComments":false',
    );
    expect(JSON.stringify(config.optimization)).toContain('"comments":false');

    process.env.NODE_ENV = 'test';
  });

  it('should not enable ascii_only when output.charset is utf8', async () => {
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginMinimize()],
      rsbuildConfig: {
        output: {
          charset: 'utf8',
        },
      },
    });

    const config = await rsbuild.unwrapConfig();
    expect(JSON.stringify(config.optimization)).toContain('"ascii_only":false');

    process.env.NODE_ENV = 'test';
  });
});
