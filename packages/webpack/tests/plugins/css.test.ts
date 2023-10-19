import { expect, describe, it } from 'vitest';
import { pluginCss } from '@/plugins/css';
import { pluginSass } from '@/plugins/sass';
import { pluginLess } from '@/plugins/less';
import { createStubRsbuild } from '../helper';

describe('plugins/css', () => {
  // need check（skipped before because this case time out in CI env)
  it('should set css config with style-loader', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss()],
      builderConfig: {
        output: {
          disableCssExtract: true,
        },
      },
    });
    const includeStyleLoader = await rsbuild.matchWebpackLoader(
      'style-loader',
      'index.css',
    );

    expect(includeStyleLoader).toBe(true);
  });

  // need check（skipped before because this case time out in CI env)
  it('should set css config with mini-css-extract-plugin', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss()],
      builderConfig: {},
    });

    const includeMiniCssExtractLoader = await rsbuild.matchWebpackLoader(
      'mini-css-extract-plugin',
      'index.css',
    );

    expect(includeMiniCssExtractLoader).toBe(true);
  });

  it('should add sass-loader', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginSass()],
      builderConfig: {
        tools: {
          sass: {},
        },
      },
    });

    const includeSassLoader = await rsbuild.matchWebpackLoader(
      'sass-loader',
      'index.scss',
    );

    expect(includeSassLoader).toBe(true);
  });

  it('should add less-loader', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginLess()],
      builderConfig: {
        tools: {
          less: {},
        },
      },
    });

    const includeLessLoader = await rsbuild.matchWebpackLoader(
      'less-loader',
      'index.less',
    );

    expect(includeLessLoader).toBe(true);
  });

  it('should override browserslist of autoprefixer when using output.overrideBrowserslist config', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss()],
      builderConfig: {
        output: {
          overrideBrowserslist: ['Chrome 80'],
        },
      },
    });
    const config = await rsbuild.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should not apply mini-css-extract-plugin when target is node', async () => {
    const rsbuild = await createStubRsbuild({
      target: ['node'],
      plugins: [pluginCss()],
      builderConfig: {},
    });

    const includeMiniCssExtractLoader = await rsbuild.matchWebpackLoader(
      'mini-css-extract-plugin',
      'index.css',
    );

    expect(includeMiniCssExtractLoader).toBe(false);
  });

  it('should not apply mini-css-extract-plugin when target is web-worker', async () => {
    const rsbuild = await createStubRsbuild({
      target: ['web-worker'],
      plugins: [pluginCss()],
      builderConfig: {},
    });

    const includeMiniCssExtractLoader = await rsbuild.matchWebpackLoader(
      'mini-css-extract-plugin',
      'index.css',
    );

    expect(includeMiniCssExtractLoader).toBe(false);
  });

  it('should not apply style-loader when target is node', async () => {
    const rsbuild = await createStubRsbuild({
      target: ['node'],
      plugins: [pluginCss()],
      builderConfig: {
        output: {
          disableCssExtract: true,
        },
        tools: {
          styleLoader: {},
        },
      },
    });

    const includeStyleLoader = await rsbuild.matchWebpackLoader(
      'style-loader',
      'index.css',
    );

    expect(includeStyleLoader).toBe(false);
  });

  it('should not apply style-loader when target is web-worker', async () => {
    const rsbuild = await createStubRsbuild({
      target: ['web-worker'],
      plugins: [pluginCss()],
      builderConfig: {
        output: {
          disableCssExtract: true,
        },
        tools: {
          styleLoader: {},
        },
      },
    });

    const includeStyleLoader = await rsbuild.matchWebpackLoader(
      'style-loader',
      'index.css',
    );

    expect(includeStyleLoader).toBe(false);
  });

  it('should allow to disable extract css plugin', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss()],
      builderConfig: {
        output: {
          disableCssExtract: true,
        },
      },
    });

    const includeMiniCssExtractLoader = await rsbuild.matchWebpackLoader(
      'mini-css-extract-plugin',
      'index.css',
    );

    expect(includeMiniCssExtractLoader).toBe(false);
  });

  it('should not apply postcss-loader when target is node', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss()],
      target: 'node',
    });

    const config = await rsbuild.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should disable source map when output.disableSourceMap is true', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss()],
      builderConfig: {
        output: {
          disableSourceMap: true,
        },
      },
    });

    const config = await rsbuild.unwrapWebpackConfig();

    expect(JSON.stringify(config)).toContain('"sourceMap":false');
  });

  it('should disable source map when output.disableSourceMap is css: true', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss()],
      builderConfig: {
        output: {
          disableSourceMap: {
            css: true,
          },
        },
      },
    });

    const config = await rsbuild.unwrapWebpackConfig();

    expect(JSON.stringify(config)).toContain('"sourceMap":false');
  });

  it('should disable source map in production by default', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss()],
    });

    const config = await rsbuild.unwrapWebpackConfig();

    expect(JSON.stringify(config)).toContain('"sourceMap":false');

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should allow to custom cssModuleLocalIdentName', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss()],
      builderConfig: {
        output: {
          cssModuleLocalIdentName: '[hash:base64]',
        },
      },
    });

    const config = await rsbuild.unwrapWebpackConfig();

    expect(JSON.stringify(config)).toContain(
      '"localIdentName":"[hash:base64]"',
    );
  });

  it('should remove some postcss plugins based on browserslist', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss()],
      builderConfig: {
        output: {
          overrideBrowserslist: ['Chrome 100'],
        },
      },
    });
    const config = await rsbuild.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });
});
