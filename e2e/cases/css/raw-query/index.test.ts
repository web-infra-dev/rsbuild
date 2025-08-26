import { readFileSync } from 'node:fs';
import path from 'node:path';
import { build, dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow to import raw CSS files in development mode', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
  });
  const aContent = readFileSync(path.join(__dirname, 'src/a.css'), 'utf-8');
  const bStyles: Record<string, string> = await page.evaluate('window.bStyles');

  expect(await page.evaluate('window.aRaw1')).toBe(aContent);
  expect(await page.evaluate('window.aRaw2')).toBe(aContent);
  expect(await page.evaluate('window.aRaw3')).toBe(aContent);
  expect(await page.evaluate('window.aRaw4')).toBe(aContent);
  expect(await page.evaluate('window.bRaw')).toBe(
    readFileSync(path.join(__dirname, 'src/b.module.css'), 'utf-8'),
  );
  expect(bStyles['title-class']).toBeTruthy();

  await rsbuild.close();
});

test('should allow to import raw CSS files in production mode', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
  });

  const aContent = readFileSync(path.join(__dirname, 'src/a.css'), 'utf-8');
  const bStyles: Record<string, string> = await page.evaluate('window.bStyles');

  expect(await page.evaluate('window.aRaw1')).toBe(aContent);
  expect(await page.evaluate('window.aRaw2')).toBe(aContent);
  expect(await page.evaluate('window.aRaw3')).toBe(aContent);
  expect(await page.evaluate('window.aRaw4')).toBe(aContent);
  expect(await page.evaluate('window.bRaw')).toBe(
    readFileSync(path.join(__dirname, 'src/b.module.css'), 'utf-8'),
  );
  expect(bStyles['title-class']).toBeTruthy();

  await rsbuild.close();
});
