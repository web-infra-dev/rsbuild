import { pluginEntry } from '@rsbuild/core/plugins/entry';
import { pluginBabel } from '@/plugins/babel';
import { createStubRsbuild } from '../helper';

describe('plugin-babel', () => {
  it('should set babel-loader', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginBabel()],
      rsbuildConfig: {
        output: {
          polyfill: 'entry',
        },
        tools: {
          babel: {},
        },
      },
    });
    const config = await rsbuild.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should set include/exclude', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginBabel()],
      rsbuildConfig: {
        tools: {
          babel(options, { addIncludes, addExcludes }) {
            addIncludes(['src/**/*.ts']);
            addExcludes(['src/**/*.js']);
            return options;
          },
        },
      },
    });
    const config = await rsbuild.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should apply exclude condition when using source.exclude', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginBabel()],
      rsbuildConfig: {
        source: {
          exclude: ['src/foo/**/*.js'],
        },
      },
    });
    const config = await rsbuild.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should add core-js-entry when output.polyfill is entry', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginBabel()],
      rsbuildConfig: {
        output: {
          polyfill: 'entry',
        },
      },
      entry: {
        main: './index.js',
      },
    });
    const config = await rsbuild.unwrapWebpackConfig();
    expect(config.entry).toMatchSnapshot();
  });

  it('should not add core-js-entry when output.polyfill is usage', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginBabel()],
      rsbuildConfig: {
        output: {
          polyfill: 'usage',
        },
      },
      entry: {
        main: './index.js',
      },
    });
    const config = await rsbuild.unwrapWebpackConfig();
    expect(config.entry).toMatchSnapshot();
  });

  it('should override targets of babel-preset-env when using output.overrideBrowserslist config', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginBabel()],
      rsbuildConfig: {
        output: {
          overrideBrowserslist: ['Chrome 80'],
        },
      },
    });
    const config = await rsbuild.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should adjust jsescOption config when charset is utf8', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginBabel()],
      rsbuildConfig: {
        output: {
          charset: 'utf8',
        },
      },
    });
    const config = await rsbuild.unwrapWebpackConfig();

    expect(JSON.stringify(config)).toContain(
      '"generatorOpts":{"jsescOption":{"minimal":true}}',
    );
  });

  it('should adjust browserslist when target is node', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginBabel()],
      target: 'node',
    });
    const config = await rsbuild.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });
});
