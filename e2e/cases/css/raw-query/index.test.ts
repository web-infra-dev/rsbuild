import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from '@e2e/helper';

test('should allow to import raw CSS files in dev', async ({ page, dev }) => {
  await dev();
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
});

test('should allow to import raw CSS files in build', async ({
  page,
  build,
}) => {
  await build();

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
});
