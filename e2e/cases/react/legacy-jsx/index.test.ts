import { test, expect } from '@playwright/test';
import { build, gotoPage } from '@scripts/shared';

const fixtures = __dirname;

test('should render element with legacy JSX runtime correctly', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: fixtures,
    runServer: true,
  });

  await gotoPage(page, rsbuild);

  const testEl = page.locator('#test');
  await expect(testEl).toHaveText('Hello Rsbuild!');

  await rsbuild.close();
});
