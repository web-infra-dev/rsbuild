import { join } from 'node:path';
import { build, dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import fse from 'fs-extra';

test('should allow to set relative root path', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      root: './test',
    },
  });

  const index = await rsbuild.getIndexBundle();
  expect(index).toBeTruthy();
  expect(rsbuild.distPath).toContain('test');
});

test('should allow to set absolute root path', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      root: join(__dirname, './test'),
    },
  });

  const index = await rsbuild.getIndexBundle();
  expect(index).toBeTruthy();
  expect(rsbuild.distPath).toContain('test');
});

test('should serve publicDir correctly when setting root', async ({ page }) => {
  await fse.outputFile(
    join(__dirname, 'test/public', 'test-temp-file.txt'),
    'a',
  );

  const rsbuild = await dev({
    cwd: __dirname,
    rsbuildConfig: {
      root: './test',
    },
  });

  const res = await page.goto(
    `http://localhost:${rsbuild.port}/test-temp-file.txt`,
  );

  expect((await res?.body())?.toString().trim()).toBe('a');

  await rsbuild.close();
});
