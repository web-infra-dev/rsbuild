import { expect, test } from '@playwright/test';
import { dev, build } from '@e2e/helper';

const cwd = __dirname;

test('should serve publicDir for dev server correctly', async ({ page }) => {
  const rsbuild = await dev({
    cwd,
  });

  const res = await page.goto(`http://localhost:${rsbuild.port}/aa.txt`);
  expect((await res?.body())?.toString().trim()).toBe('aaaa');

  await page.goto(`http://localhost:${rsbuild.port}`);
  const title = await page.$('title');
  expect(await title?.innerText()).toBe('Hello');

  await rsbuild.close();
});

test('should serve publicDir for preview server correctly', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd,
    runServer: true,
  });

  const res = await page.goto(`http://localhost:${rsbuild.port}/aa.txt`);
  expect((await res?.body())?.toString().trim()).toBe('aaaa');

  await page.goto(`http://localhost:${rsbuild.port}`);
  const title = await page.$('title');
  expect(await title?.innerText()).toBe('Hello');

  await rsbuild.close();
});
