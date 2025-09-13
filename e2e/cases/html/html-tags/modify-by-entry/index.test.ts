import { expect, test } from '@e2e/helper';

test('should allow to inject tags by entry name', async ({ build }) => {
  const rsbuild = await build();
  const files = rsbuild.getDistFiles();

  const fooHTML =
    files[Object.keys(files).find((file) => file.endsWith('foo.html'))!];
  expect(fooHTML.match(/src="https:\/\/www\.cdn\.com\/foo\.js/)).toBeTruthy();

  const barHTML =
    files[Object.keys(files).find((file) => file.endsWith('bar.html'))!];
  expect(barHTML.match(/src="https:\/\/www\.cdn\.com\/bar\.js/)).toBeTruthy();
});
