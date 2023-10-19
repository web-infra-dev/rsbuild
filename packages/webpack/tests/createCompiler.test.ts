import { join } from 'path';
import { pluginEntry } from '@rsbuild/core/plugins/entry';
import { pluginBasic } from '@/plugins/basic';
import { describe, expect, test, vi } from 'vitest';
import { applyDefaultBuilderOptions } from '@rsbuild/shared';
import { createStubBuilder, fixturesDir } from './helper';
import { createCompiler } from '@/core/createCompiler';
import { createPrimaryContext } from '@/core/createContext';

describe('build hooks', () => {
  test('should call onBeforeBuild hook before build', async () => {
    const fn = vi.fn();
    const builder = await createStubBuilder({
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

    await builder.build();

    expect(fn).toHaveBeenCalledTimes(1);
  });
  test('should call onBeforeBuild hook before build in watch mode', async () => {
    const fn = vi.fn();
    const builder = await createStubBuilder({
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
    await builder.build({
      watch: true,
    });
    expect(fn).toHaveBeenCalledTimes(1);
  });
  const createDefaultContext = () =>
    createPrimaryContext(applyDefaultBuilderOptions({}), {});
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
