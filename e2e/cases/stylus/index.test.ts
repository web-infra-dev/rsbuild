import { join, resolve } from 'node:path';
import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { pluginStylus } from '@rsbuild/plugin-stylus';
import { pluginTypedCSSModules } from '@rsbuild/plugin-typed-css-modules';
import { fse } from '@rsbuild/shared';

const fixtures = __dirname;

const generatorTempDir = async (testDir: string) => {
  await fse.emptyDir(testDir);
  await fse.copy(join(fixtures, 'src'), testDir);

  return () => fse.remove(testDir);
};

test('should compile stylus correctly with ts declaration', async () => {
  const testDir = join(fixtures, 'test-temp-src-1');
  const clear = await generatorTempDir(testDir);

  const rsbuild = await build({
    cwd: __dirname,
    plugins: [pluginStylus(), pluginTypedCSSModules()],
    rsbuildConfig: {
      source: {
        entry: { index: resolve(testDir, 'index.js') },
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find((file) => file.endsWith('.css'))!];

  expect(content).toMatch(
    /body{color:#f00;font:14px Arial,sans-serif}\.title-class-\w{6}{font-size:14px}/,
  );

  expect(fse.existsSync(join(testDir, './b.module.styl.d.ts'))).toBeTruthy();

  await clear();
});
