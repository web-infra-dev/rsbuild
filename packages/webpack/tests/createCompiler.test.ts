import { join } from 'path';
import { pluginEntry } from '@rsbuild/core/plugins/entry';
import { pluginBasic } from '@/plugins/basic';
import { describe, expect, test, vi } from 'vitest';
import { applyDefaultRsbuildOptions } from '@rsbuild/shared';
import { createStubRsbuild, fixturesDir } from './helper';
import { createCompiler } from '@/core/createCompiler';
import { createPrimaryContext } from '@/core/createContext';

describe('build hooks', () => {
  test('should call onBeforeBuild hook before build', async () => {
    const fn = vi.fn();
    const rsbuild = await createStubRsbuild({
      cwd: fixturesDir,
      entry: {
        main: join(fixturesDir, 'src/index.js'),
      },
      plugins: [
        pluginEntry(),
        pluginBasic(),
        {
          name: 'foo',
          setup(api) {
            api.onBeforeBuild(fn);
          },
        },
      ],
    });

    await rsbuild.build();

    expect(fn).toHaveBeenCalledTimes(1);
  });
  test('should call onBeforeBuild hook before build in watch mode', async () => {
    const fn = vi.fn();
    const rsbuild = await createStubRsbuild({
      plugins: [
        pluginEntry(),
        pluginBasic(),
        {
          name: 'foo',
          setup(api) {
            api.onBeforeBuild(fn);
          },
        },
      ],
    });
    await rsbuild.build({
      watch: true,
    });
    expect(fn).toHaveBeenCalledTimes(1);
  });
  const createDefaultContext = () =>
    createPrimaryContext(applyDefaultRsbuildOptions({}), {});
  test('should return Compiler when passing single webpack config', async () => {
    const compiler = await createCompiler({
      context: createDefaultContext(),
      webpackConfigs: [{}],
    });
    expect(compiler.constructor.name).toEqual('Compiler');
  });
  test('should return MultiCompiler when passing multiple webpack configs', async () => {
    const compiler = await createCompiler({
      context: createDefaultContext(),
      webpackConfigs: [{}, {}],
    });
    expect(compiler.constructor.name).toEqual('MultiCompiler');
  });
});
