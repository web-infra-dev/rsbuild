import { build, dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow to configure pre-entry in development', async ({ page }) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
  });

  await expect(page.innerHTML('#test-el')).resolves.toBe('aaaaa');
  await expect(page.evaluate('window.aa')).resolves.toBe(2);

  await rsbuild.close();
});

test('should allow to configure pre-entry in production build', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
  });

  await expect(page.innerHTML('#test-el')).resolves.toBe('aaaaa');
  await expect(page.evaluate('window.aa')).resolves.toBe(2);

  await rsbuild.close();
});
