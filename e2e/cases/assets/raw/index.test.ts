import { promises } from 'node:fs';
import { join } from 'node:path';
import { build, dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow to get raw asset content with `?raw` in development mode', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
  });

  expect(await page.evaluate('window.rawImg')).toEqual(
    await promises.readFile(
      join(__dirname, '../../../assets/circle.svg'),
      'utf-8',
    ),
  );

  await rsbuild.close();
});

test('should allow to get raw asset content with `?raw` in production mode', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
  });

  expect(await page.evaluate('window.rawImg')).toEqual(
    await promises.readFile(
      join(__dirname, '../../../assets/circle.svg'),
      'utf-8',
    ),
  );

  await rsbuild.close();
});
