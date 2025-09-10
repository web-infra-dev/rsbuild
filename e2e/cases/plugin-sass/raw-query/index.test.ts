import { readFileSync } from 'node:fs';
import path from 'node:path';
import { build, dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow to import raw Sass files in dev', async ({ page }) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
  });

  const aRaw: string = await page.evaluate('window.aRaw');
  const bRaw: string = await page.evaluate('window.bRaw');
  const bStyles: Record<string, string> = await page.evaluate('window.bStyles');

  expect(aRaw).toBe(readFileSync(path.join(__dirname, 'src/a.scss'), 'utf-8'));
  expect(bRaw).toBe(
    readFileSync(path.join(__dirname, 'src/b.module.scss'), 'utf-8'),
  );
  expect(bStyles['title-class']).toBeTruthy();

  await rsbuild.close();
});

test('should allow to import raw Sass files in build', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
  });

  const aRaw: string = await page.evaluate('window.aRaw');
  const bRaw: string = await page.evaluate('window.bRaw');
  const bStyles: Record<string, string> = await page.evaluate('window.bStyles');

  expect(aRaw).toBe(readFileSync(path.join(__dirname, 'src/a.scss'), 'utf-8'));
  expect(bRaw).toBe(
    readFileSync(path.join(__dirname, 'src/b.module.scss'), 'utf-8'),
  );
  expect(bStyles['title-class']).toBeTruthy();

  await rsbuild.close();
});
