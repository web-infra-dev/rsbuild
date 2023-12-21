import { test, expect } from '@playwright/test';
import { build, getHrefByEntryName } from '@scripts/shared';

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

  await page.goto(getHrefByEntryName('index', rsbuild.port));
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
