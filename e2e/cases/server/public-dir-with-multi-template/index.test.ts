import { expect, test } from '@e2e/helper';

const cwd = __dirname;

test('should serve publicDir with templates for dev server correctly', async ({
  page,
  devOnly,
}) => {
  const rsbuild = await devOnly();

  const res = await page.goto(`http://localhost:${rsbuild.port}/aa.txt`);
  expect((await res?.body())?.toString().trim()).toBe('aaaa');

  await page.goto(`http://localhost:${rsbuild.port}/foo`);
  const title = await page.$('#test');
  expect(await title?.innerText()).toBe('Hello Foo!');

  await page.goto(`http://localhost:${rsbuild.port}/bar`);
  const title2 = await page.$('#test');
  expect(await title2?.innerText()).toBe('Hello Bar!');
});

test('should serve publicDir with templates for preview server correctly', async ({
  page,
  build,
}) => {
  const rsbuild = await build({
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
});
