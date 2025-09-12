import { expect, test } from '@e2e/helper';

const fixtures = __dirname;

test('should render element with legacy JSX runtime correctly', async ({
  page,
  build,
}) => {
  const rsbuild = await build();

  const testEl = page.locator('#test');
  await expect(testEl).toHaveText('Hello Rsbuild!');
});
