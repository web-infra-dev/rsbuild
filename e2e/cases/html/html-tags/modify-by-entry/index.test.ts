import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow to inject tags by entry name', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = await rsbuild.unwrapOutputJSON();

  const fooHTML =
    files[Object.keys(files).find((file) => file.endsWith('foo.html'))!];
  expect(fooHTML.match(/src="https:\/\/www\.cdn\.com\/foo\.js/)).toBeTruthy();

  const barHTML =
    files[Object.keys(files).find((file) => file.endsWith('bar.html'))!];
  expect(barHTML.match(/src="https:\/\/www\.cdn\.com\/bar\.js/)).toBeTruthy();
});
