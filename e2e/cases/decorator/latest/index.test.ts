import { test, expect } from '@playwright/test';
import { build, gotoPage } from '@e2e/helper';

test.skip('decorator latest', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
    rsbuildConfig: {
      output: {
        enableLatestDecorators: true,
      },
    },
  });

  await gotoPage(page, rsbuild);
  expect(await page.evaluate('window.aaa')).toBe('hello world');

  // swc...
  if (rsbuild.providerType !== 'rspack') {
    expect(await page.evaluate('window.bbb')).toContain(
      "Cannot assign to read only property 'message' of object",
    );

    expect(await page.evaluate('window.ccc')).toContain(
      "Cannot assign to read only property 'message' of object",
    );
  }

  await rsbuild.close();
});
