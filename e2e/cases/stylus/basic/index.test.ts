import fs from 'node:fs';
import { join, resolve } from 'node:path';
import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';
import { pluginStylus } from '@rsbuild/plugin-stylus';

const fixtures = __dirname;

const generatorTempDir = async (testDir: string) => {
  fs.rmSync(testDir, { recursive: true, force: true });
  await fs.promises.cp(join(fixtures, 'src'), testDir, { recursive: true });

  return () => fs.promises.rm(testDir, { force: true, recursive: true });
};

rspackOnlyTest('should compile stylus correctly', async () => {
  const testDir = join(fixtures, 'test-temp-src-1');
  const clear = await generatorTempDir(testDir);

  const rsbuild = await build({
    cwd: __dirname,
    plugins: [pluginStylus()],
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
    /body{color:red;font:14px Arial,sans-serif}\.title-class-\w{6}{font-size:14px}/,
  );

  await clear();
});
