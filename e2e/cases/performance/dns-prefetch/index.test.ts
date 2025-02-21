import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should generate dnsPrefetch link when dnsPrefetch is defined', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = await rsbuild.unwrapOutputJSON();

  const [, content] = Object.entries(files).find(([name]) =>
    name.endsWith('.html'),
  )!;

  expect(
    content.includes('<link rel="dns-prefetch" href="http://aaaa.com">'),
  ).toBeTruthy();
});
