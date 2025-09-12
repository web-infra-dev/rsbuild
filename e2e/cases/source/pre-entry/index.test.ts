import { dev, expect, test } from '@e2e/helper';

test('should allow to configure pre-entry in development', async ({ page }) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
  });

  await expect(page.innerHTML('#test-el')).resolves.toBe('aaaaa');
  await expect(page.evaluate('window.aa')).resolves.toBe(2);
});

test('should allow to configure pre-entry in production build', async ({
  page,
  build,
}) => {
  const rsbuild = await build();

  await expect(page.innerHTML('#test-el')).resolves.toBe('aaaaa');
  await expect(page.evaluate('window.aa')).resolves.toBe(2);
});
