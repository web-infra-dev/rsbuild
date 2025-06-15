import { readFileSync } from 'node:fs';
import path from 'node:path';
import { build, dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow to import raw Less files in development mode', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
  });

  expect(await page.evaluate('window.aRaw')).toBe(
    readFileSync(path.join(__dirname, 'src/a.less'), 'utf-8'),
  );
  expect(await page.evaluate('window.bRaw')).toBe(
    readFileSync(path.join(__dirname, 'src/b.module.less'), 'utf-8'),
  );

  await rsbuild.close();
});

test('should allow to import raw Less files in production mode', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
  });

  expect(await page.evaluate('window.aRaw')).toBe(
    readFileSync(path.join(__dirname, 'src/a.less'), 'utf-8'),
  );
  expect(await page.evaluate('window.bRaw')).toBe(
    readFileSync(path.join(__dirname, 'src/b.module.less'), 'utf-8'),
  );

  await rsbuild.close();
});
