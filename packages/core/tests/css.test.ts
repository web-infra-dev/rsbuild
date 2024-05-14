import type { NormalizedConfig } from '@rsbuild/shared';
import autoprefixer from '@rsbuild/shared/autoprefixer';
import { createStubRsbuild } from '@scripts/test-helper';
import {
  applyAutoprefixer,
  normalizeCssLoaderOptions,
  pluginCss,
} from '../src/plugins/css';
import { pluginLess } from '../src/plugins/less';
import { pluginSass } from '../src/plugins/sass';

describe('normalizeCssLoaderOptions', () => {
  it('should enable exportOnlyLocals correctly', () => {
    expect(normalizeCssLoaderOptions({ modules: false }, true)).toEqual({
      modules: false,
    });

    expect(normalizeCssLoaderOptions({ modules: true }, true)).toEqual({
      modules: {
        exportOnlyLocals: true,
      },
    });

    expect(normalizeCssLoaderOptions({ modules: true }, false)).toEqual({
      modules: true,
    });

    expect(normalizeCssLoaderOptions({ modules: 'local' }, true)).toEqual({
      modules: {
        mode: 'local',
        exportOnlyLocals: true,
      },
    });

    expect(
      normalizeCssLoaderOptions({ modules: { auto: true } }, true),
    ).toEqual({
      modules: {
        auto: true,
        exportOnlyLocals: true,
      },
    });
  });
});

describe('plugin-css', () => {
  it('should override browserslist of autoprefixer when using output.overrideBrowserslist config', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss()],
      rsbuildConfig: {
        output: {
          overrideBrowserslist: ['Chrome 80'],
        },
      },
    });
    const bundlerConfigs = await rsbuild.initConfigs();
    expect(bundlerConfigs[0]).toMatchSnapshot();
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

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(JSON.stringify(bundlerConfigs[0])).toContain('"sourceMap":true');
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

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(JSON.stringify(bundlerConfigs[0])).toContain('"sourceMap":false');
  });

  it('should disable source map in production by default', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss()],
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(JSON.stringify(bundlerConfigs[0])).toContain('"sourceMap":false');

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should allow to custom cssModules.localIdentName', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss()],
      rsbuildConfig: {
        output: {
          cssModules: {
            localIdentName: '[hash]',
          },
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(JSON.stringify(bundlerConfigs[0])).toContain(
      '"localIdentName":"[hash]"',
    );
  });

  it('should use custom cssModules rule when using output.cssModules config', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss()],
      rsbuildConfig: {
        output: {
          cssModules: {
            auto: (resourcePath) => resourcePath.includes('.module.'),
          },
        },
      },
    });
    const bundlerConfigs = await rsbuild.initConfigs();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });
});

describe('plugin-css injectStyles', () => {
  it('should use css-loader + style-loader when injectStyles is true', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss()],
      rsbuildConfig: {
        output: {
          injectStyles: true,
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should apply ignoreCssLoader when injectStyles is true and target is node', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss()],
      rsbuildConfig: {
        output: {
          targets: ['node'],
          injectStyles: true,
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });
});

describe('plugin-less', () => {
  it('should add less-loader', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginLess()],
      rsbuildConfig: {
        tools: {
          less: {},
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should add less-loader and css-loader when injectStyles', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginLess()],
      rsbuildConfig: {
        output: {
          injectStyles: true,
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should add less-loader with tools.less', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginLess()],
      rsbuildConfig: {
        tools: {
          less: {
            lessOptions: {
              javascriptEnabled: false,
            },
          },
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should add less-loader with excludes', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginLess()],
      rsbuildConfig: {
        tools: {
          less(_config, { addExcludes }) {
            addExcludes(/node_modules/);
          },
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });
});

describe('plugin-sass', () => {
  it('should add sass-loader', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginSass()],
      rsbuildConfig: {
        tools: {},
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should add sass-loader and css-loader when injectStyles', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginSass()],
      rsbuildConfig: {
        output: {
          injectStyles: true,
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should add sass-loader with excludes', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginSass()],
      rsbuildConfig: {
        tools: {
          sass(_config, { addExcludes }) {
            addExcludes(/node_modules/);
          },
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });
});

it('should not apply autoprefixer if user config contains autoprefixer', async () => {
  const config = {
    tools: {},
  } as NormalizedConfig;

  expect(
    (await applyAutoprefixer([autoprefixer()], ['Chrome >= 100'], config))
      .length,
  ).toEqual(1);

  expect(
    (await applyAutoprefixer([autoprefixer], ['Chrome >= 100'], config)).length,
  ).toEqual(1);

  expect(
    (await applyAutoprefixer([], ['Chrome >= 100'], config)).length,
  ).toEqual(1);
});
