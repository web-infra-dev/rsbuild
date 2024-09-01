import { build, dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';

const cwd = __dirname;

test('should serve publicDir with template for dev server correctly', async ({
  page,
}) => {
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

test('should serve publicDir with template for preview server correctly', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd,
    page,
  });

  const res = await page.goto(`http://localhost:${rsbuild.port}/aa.txt`);
  expect((await res?.body())?.toString().trim()).toBe('aaaa');

  await page.goto(`http://localhost:${rsbuild.port}`);
  const title = await page.$('title');
  expect(await title?.innerText()).toBe('Hello');

  await rsbuild.close();
});
