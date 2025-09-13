import { expect, test } from '@e2e/helper';

test('should import default from SVG with custom query correctly', async ({
  page,
  build,
}) => {
  await build();

  await expect(
    page.evaluate(`document.getElementById('component').tagName === 'svg'`),
  ).resolves.toBeTruthy();

  // test SVG asset
  await expect(
    page.evaluate(`document.getElementById('url').src`),
  ).resolves.toMatch(/http:/);
});
