import { join } from 'path';
import { pluginEntry } from '@rsbuild/core/plugins/entry';
import { pluginBasic } from '@rsbuild/core/plugins/basic';
import { createStubRsbuild, fixturesDir } from './helper';

describe('build hooks', () => {
  test('should call onBeforeBuild hook before build', async () => {
    const fn = vi.fn();
    const rsbuild = await createStubRsbuild({
      cwd: fixturesDir,
      rsbuildConfig: {
        source: {
          entry: {
            main: join(fixturesDir, 'src/index.js'),
          },
        },
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
});
