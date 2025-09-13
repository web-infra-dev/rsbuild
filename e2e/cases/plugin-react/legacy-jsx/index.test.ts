import { expect, test } from '@e2e/helper';

test('should render element with legacy JSX runtime correctly', async ({
  page,
  buildPreview,
}) => {
  await buildPreview();
  const testEl = page.locator('#test');
  await expect(testEl).toHaveText('Hello Rsbuild!');
});
