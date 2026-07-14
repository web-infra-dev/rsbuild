import { expect, gotoPage, test } from '@e2e/helper';

// https://github.com/web-infra-dev/rspack/issues/6633
test('should render pages correctly when using lazy compilation and add new initial chunk', async ({
  page,
  dev,
}) => {
  await dev();

  await expect(page.locator('#test')).toHaveText('Hello World!');
});

test('should not reload after activating the lazy entry', async ({ page, devOnly }) => {
  // TODO(rspack#14753): Run by default after Rsbuild's minimum Rspack version
  // includes lazy-compilation invalidation provenance.
  test.skip(
    process.env.RSBUILD_E2E_RSPACK_LAZY_COMPILATION_HMR !== '1',
    'requires the Rspack lazy-compilation HMR canary',
  );

  await page.addInitScript(() => {
    const key = 'lazy-entry-document-loads';
    sessionStorage.setItem(key, String(Number(sessionStorage.getItem(key) ?? 0) + 1));
  });

  const rsbuild = await devOnly();
  await rsbuild.expectBuildEnd();
  await gotoPage(page, rsbuild);
  await rsbuild.expectBuildEnd();

  await expect(page.locator('#test')).toHaveText('Hello World!');
  expect(
    await page.evaluate(() => Number(sessionStorage.getItem('lazy-entry-document-loads'))),
  ).toBe(1);
});
