import { expect, test } from '@e2e/helper';

test('should return the asset URL with `?url`', async ({ page, build }) => {
  await build();

  await expect(
    page.evaluate(
      `document.getElementById('test-img').src.includes('static/image/icon')`,
    ),
  ).resolves.toBeTruthy();
});
