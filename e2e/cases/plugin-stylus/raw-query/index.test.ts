import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from '@e2e/helper';

test('should allow to import raw Stylus files in dev', async ({
  page,
  dev,
}) => {
  await dev();

  const aRaw: string = await page.evaluate('window.aRaw');
  const bRaw: string = await page.evaluate('window.bRaw');
  const bStyles: Record<string, string> = await page.evaluate('window.bStyles');

  expect(aRaw).toBe(
    readFileSync(path.join(import.meta.dirname, 'src/a.styl'), 'utf-8'),
  );
  expect(bRaw).toBe(
    readFileSync(path.join(import.meta.dirname, 'src/b.module.styl'), 'utf-8'),
  );
  expect(bStyles['title-class']).toBeTruthy();
});

test('should allow to import raw Stylus files in build', async ({
  page,
  buildPreview,
}) => {
  await buildPreview();

  const aRaw: string = await page.evaluate('window.aRaw');
  const bRaw: string = await page.evaluate('window.bRaw');
  const bStyles: Record<string, string> = await page.evaluate('window.bStyles');

  expect(aRaw).toBe(
    readFileSync(path.join(import.meta.dirname, 'src/a.styl'), 'utf-8'),
  );
  expect(bRaw).toBe(
    readFileSync(path.join(import.meta.dirname, 'src/b.module.styl'), 'utf-8'),
  );
  expect(bStyles['title-class']).toBeTruthy();
});
