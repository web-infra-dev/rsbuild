import { pluginEntry } from '@rsbuild/core/plugins/entry';
import { pluginBabel } from '../src/webpack/plugins/babel';
import { createStubRsbuild } from '../../webpack/tests/helper';

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
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should set include/exclude', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [
        pluginBabel({
          babelLoaderOptions: (options, { addIncludes, addExcludes }) => {
            addIncludes(['src/**/*.ts']);
            addExcludes(['src/**/*.js']);
            return options;
          },
        }),
      ],
    });
    const config = await rsbuild.unwrapConfig();

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
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should add core-js-entry when output.polyfill is entry', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginBabel()],
      rsbuildConfig: {
        source: {
          entry: {
            main: './index.js',
          },
        },
        output: {
          polyfill: 'entry',
        },
      },
    });
    const config = await rsbuild.unwrapConfig();
    expect(config.entry).toMatchSnapshot();
  });

  it('should not add core-js-entry when output.polyfill is usage', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginBabel()],
      rsbuildConfig: {
        source: {
          entry: {
            main: './index.js',
          },
        },
        output: {
          polyfill: 'usage',
        },
      },
    });
    const config = await rsbuild.unwrapConfig();
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
    const config = await rsbuild.unwrapConfig();

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
    const config = await rsbuild.unwrapConfig();

    expect(JSON.stringify(config)).toContain(
      '"generatorOpts":{"jsescOption":{"minimal":true}}',
    );
  });

  it('should adjust browserslist when target is node', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginBabel()],
      rsbuildConfig: {
        output: {
          targets: ['node'],
        },
      },
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should set proper pluginImport option in Babel', async () => {
    // camelToDashComponentName
    const rsbuild = await createStubRsbuild({
      plugins: [pluginBabel()],
      rsbuildConfig: {
        source: {
          transformImport: [
            {
              libraryName: 'foo',
              camelToDashComponentName: true,
            },
          ],
        },
      },
    });
    const config = await rsbuild.unwrapConfig();

    const babelRules = config.module!.rules?.filter((item: any) => {
      return item?.use?.[0].loader.includes('babel-loader');
    });

    expect(babelRules).toMatchSnapshot();
  });

  it('should not set default pluginImport for Babel', async () => {
    // camelToDashComponentName
    const rsbuild = await createStubRsbuild({
      plugins: [pluginBabel()],
    });
    const config = await rsbuild.unwrapConfig();

    const babelRules = config.module!.rules?.filter((item: any) => {
      return item?.use?.[0].loader.includes('babel-loader');
    });

    expect(babelRules).toMatchSnapshot();
  });

  it('should not have any pluginImport in Babel', async () => {
    // camelToDashComponentName
    const rsbuild = await createStubRsbuild({
      plugins: [pluginBabel()],
      rsbuildConfig: {
        source: {
          transformImport: false,
        },
      },
    });
    const config = await rsbuild.unwrapConfig();

    const babelRules = config.module!.rules?.filter((item: any) => {
      return item?.use?.[0].loader.includes('babel-loader');
    });

    expect(babelRules).toMatchSnapshot();
  });
});
