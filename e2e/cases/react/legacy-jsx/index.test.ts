import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

const fixtures = __dirname;

test('should render element with legacy JSX runtime correctly', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: fixtures,
    page,
  });

  const testEl = page.locator('#test');
  await expect(testEl).toHaveText('Hello Rsbuild!');

  await rsbuild.close();
});
