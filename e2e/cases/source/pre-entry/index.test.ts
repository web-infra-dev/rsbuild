import { build, dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';

// TODO: lazy compilation can't ensure pre-entry order
test.skip('TODO: FIXME - should allow to configure pre-entry in development', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
  });

  await Promise.all([
    page.waitForFunction('window.aa', undefined, { timeout: 1000 }),
    page.waitForSelector('#test-el', { timeout: 1000 }),
  ]);

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
