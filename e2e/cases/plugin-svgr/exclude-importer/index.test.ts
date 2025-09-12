import { expect, test } from '@e2e/helper';

test('should exclude matched SVG files from SVGR processing (importer)', async ({
  page,
  build,
}) => {
  const rsbuild = await build();

  await expect(
    page.evaluate(`document.getElementById('foo').tagName === 'svg'`),
  ).resolves.toBeTruthy();

  await expect(
    page.evaluate(
      `document.getElementById('bar').src.startsWith('data:image/svg')`,
    ),
  ).resolves.toBeTruthy();
});
