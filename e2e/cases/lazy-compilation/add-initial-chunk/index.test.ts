import { dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';

// https://github.com/web-infra-dev/rspack/issues/6633
// TODO: failed to run this case after updating playwright
// https://github.com/web-infra-dev/rsbuild/pull/4331
test.skip('should render pages correctly when using lazy compilation and add new initial chunk', async ({
  page,
}) => {
  // TODO fix this case on Windows
  if (process.platform === 'win32') {
    test.skip();
  }

  const rsbuild = await dev({
    cwd: __dirname,
    page,
  });

  await expect(page.locator('#test')).toHaveText('Hello World!');
  await rsbuild.close();
});
