import { pluginCss } from '@/plugins/css';
import { pluginSass } from '@/plugins/sass';
import { pluginLess } from '@/plugins/less';
import { createStubRsbuild } from '../helper';

describe('plugin-css', () => {
  // need check（skipped before because this case time out in CI env)
  it('should set css config with style-loader', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss()],
      rsbuildConfig: {
        output: {
          injectStyles: true,
        },
      },
    });
    const includeStyleLoader = await rsbuild.matchLoader(
      'style-loader',
      'index.css',
    );

    expect(includeStyleLoader).toBe(true);
  });

  // need check（skipped before because this case time out in CI env)
  it('should set css config with mini-css-extract-plugin', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss()],
      rsbuildConfig: {},
    });

    const includeMiniCssExtractLoader = await rsbuild.matchLoader(
      'mini-css-extract-plugin',
      'index.css',
    );

    expect(includeMiniCssExtractLoader).toBe(true);
  });

  it('should add sass-loader', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginSass()],
      rsbuildConfig: {
        tools: {
          sass: {},
        },
      },
    });

    const includeSassLoader = await rsbuild.matchLoader(
      'sass-loader',
      'index.scss',
    );

    expect(includeSassLoader).toBe(true);
  });

  it('should add less-loader', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginLess()],
      rsbuildConfig: {
        tools: {
          less: {},
        },
      },
    });

    const includeLessLoader = await rsbuild.matchLoader(
      'less-loader',
      'index.less',
    );

    expect(includeLessLoader).toBe(true);
  });

  it('should override browserslist of autoprefixer when using output.overrideBrowserslist config', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss()],
      rsbuildConfig: {
        output: {
          overrideBrowserslist: ['Chrome 80'],
        },
      },
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should not apply mini-css-extract-plugin when target is node', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss()],
      rsbuildConfig: {
        output: {
          targets: ['node'],
        },
      },
    });

    const includeMiniCssExtractLoader = await rsbuild.matchLoader(
      'mini-css-extract-plugin',
      'index.css',
    );

    expect(includeMiniCssExtractLoader).toBe(false);
  });

  it('should not apply mini-css-extract-plugin when target is web-worker', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss()],
      rsbuildConfig: {
        output: {
          targets: ['web-worker'],
        },
      },
    });

    const includeMiniCssExtractLoader = await rsbuild.matchLoader(
      'mini-css-extract-plugin',
      'index.css',
    );

    expect(includeMiniCssExtractLoader).toBe(false);
  });

  it('should not apply style-loader when target is node', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss()],
      rsbuildConfig: {
        output: {
          targets: ['node'],
          injectStyles: true,
        },
        tools: {
          styleLoader: {},
        },
      },
    });

    const includeStyleLoader = await rsbuild.matchLoader(
      'style-loader',
      'index.css',
    );

    expect(includeStyleLoader).toBe(false);
  });

  it('should not apply style-loader when target is web-worker', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss()],
      rsbuildConfig: {
        output: {
          targets: ['web-worker'],
          injectStyles: true,
        },
        tools: {
          styleLoader: {},
        },
      },
    });

    const includeStyleLoader = await rsbuild.matchLoader(
      'style-loader',
      'index.css',
    );

    expect(includeStyleLoader).toBe(false);
  });

  it('should allow to disable extract css plugin', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss()],
      rsbuildConfig: {
        output: {
          injectStyles: true,
        },
      },
    });

    const includeMiniCssExtractLoader = await rsbuild.matchLoader(
      'mini-css-extract-plugin',
      'index.css',
    );

    expect(includeMiniCssExtractLoader).toBe(false);
  });

  it('should not apply postcss-loader when target is node', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss()],
      rsbuildConfig: {
        output: {
          targets: ['node'],
        },
      },
    });

    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should enable source map when output.sourceMap.css is true', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss()],
      rsbuildConfig: {
        output: {
          sourceMap: {
            css: true,
          },
        },
      },
    });

    const config = await rsbuild.unwrapConfig();

    expect(JSON.stringify(config)).toContain('"sourceMap":true');
  });

  it('should disable source map when output.sourceMap.css is false', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss()],
      rsbuildConfig: {
        output: {
          sourceMap: {
            css: false,
          },
        },
      },
    });

    const config = await rsbuild.unwrapConfig();

    expect(JSON.stringify(config)).toContain('"sourceMap":false');
  });

  it('should disable source map in production by default', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss()],
    });

    const config = await rsbuild.unwrapConfig();

    expect(JSON.stringify(config)).toContain('"sourceMap":false');

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should allow to custom cssModules.localIdentName', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss()],
      rsbuildConfig: {
        output: {
          cssModules: {
            localIdentName: '[hash:base64]',
          },
        },
      },
    });

    const config = await rsbuild.unwrapConfig();

    expect(JSON.stringify(config)).toContain(
      '"localIdentName":"[hash:base64]"',
    );
  });

  it('should remove some postcss plugins based on browserslist', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss()],
      rsbuildConfig: {
        output: {
          overrideBrowserslist: ['Chrome 100'],
        },
      },
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });
});
