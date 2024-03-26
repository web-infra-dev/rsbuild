import { expect, test } from '@playwright/test';
import { build } from '@e2e/helper';

test('should inject tags correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = await rsbuild.unwrapOutputJSON();

  const indexHtml =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];

  expect(indexHtml.match(/foo\.js/)).toBeTruthy();
  expect(indexHtml.match(/src="https:\/\/www\.cdn\.com\/foo\.js/)).toBeTruthy();
  expect(indexHtml.match(/content="origin"/)).toBeTruthy();
});
