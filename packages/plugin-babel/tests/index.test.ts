import { expect, describe, it } from 'vitest';
import { pluginBabel } from '../src';
import { createStubRsbuild } from '@rsbuild/test-helper';
import { SCRIPT_REGEX } from '@rsbuild/shared';

describe('plugins/babel', () => {
  it('babel-loader should works with builtin:swc-loader', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {},
    });

    rsbuild.addPlugins([
      pluginBabel((_config: any, { addExcludes, addIncludes }: any) => {
        addIncludes(/\/node_modules\/query-string\//);
        addExcludes('src/example');
      }),
    ]);

    const config = await rsbuild.unwrapConfig();

    expect(
      config.module.rules.find(
        (r) => r.test.toString() === SCRIPT_REGEX.toString(),
      ),
    ).toMatchSnapshot();
  });

  it('should set babel-loader', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginBabel()],
      rsbuildConfig: {},
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should set babel-loader when config is add', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [
        pluginBabel((config: any) => {
          config.plugins.push([
            'babel-plugin-import',
            {
              libraryName: 'xxx-components',
              libraryDirectory: 'es',
              style: true,
            },
          ]);
        }),
      ],
      rsbuildConfig: {},
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('babel-loader addIncludes & addExcludes should works', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [
        pluginBabel((_config: any, { addExcludes, addIncludes }: any) => {
          addIncludes(/\/node_modules\/query-string\//);
          addExcludes('src/example');
        }),
      ],
      rsbuildConfig: {},
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });
});
