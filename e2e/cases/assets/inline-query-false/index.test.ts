import { expect, test } from '@e2e/helper';

test('should disable asset inlining with `?__inline=false`', async ({
  page,
  buildPreview,
}) => {
  await buildPreview();
  await expect(
    page.evaluate(
      `document.getElementById('test-img').src.includes('static/image/icon')`,
    ),
  ).resolves.toBeTruthy();
});
