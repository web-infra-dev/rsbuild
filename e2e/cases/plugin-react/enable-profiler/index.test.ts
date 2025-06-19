import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

const fixtures = __dirname;

// TODO: broken by React 19
test.skip('should render element with enabled profiler correctly', async ({
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
