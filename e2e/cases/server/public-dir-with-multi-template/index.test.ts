import { build, dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';

const cwd = __dirname;

test('should serve publicDir with templates for dev server correctly', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd,
  });

  const res = await page.goto(`http://localhost:${rsbuild.port}/aa.txt`);
  expect((await res?.body())?.toString().trim()).toBe('aaaa');

  await page.goto(`http://localhost:${rsbuild.port}/foo`);
  const title = await page.$('#test');
  expect(await title?.innerText()).toBe('Hello Foo!');

  await page.goto(`http://localhost:${rsbuild.port}/bar`);
  const title2 = await page.$('#test');
  expect(await title2?.innerText()).toBe('Hello Bar!');

  await rsbuild.close();
});

test('should serve publicDir with templates for preview server correctly', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd,
    page,
  });

  const res = await page.goto(`http://localhost:${rsbuild.port}/aa.txt`);
  expect((await res?.body())?.toString().trim()).toBe('aaaa');

  await page.goto(`http://localhost:${rsbuild.port}/foo`);
  const title = await page.$('#test');
  expect(await title?.innerText()).toBe('Hello Foo!');

  await page.goto(`http://localhost:${rsbuild.port}/bar`);
  const title2 = await page.$('#test');
  expect(await title2?.innerText()).toBe('Hello Bar!');

  await rsbuild.close();
});
