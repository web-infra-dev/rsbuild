import { join } from 'node:path';
import { expect, test } from '@e2e/helper';

test('should disable HMR by default in none mode', async ({ dev, page }) => {
  await dev();
  await expect(page.locator('body')).toHaveText('HMR disabled');
});

test('should apply hot updates in none mode with dev.hmr enabled', async ({
  dev,
  page,
  copySrcDir,
  editFile,
}) => {
  const entry = join(await copySrcDir(), 'index.js');
  await dev({
    config: {
      dev: { hmr: true },
      source: { entry: { index: entry } },
    },
  });
  const body = page.locator('body');
  await expect(body).toHaveText('HMR enabled');
  await body.evaluate((el) => el.setAttribute('data-state', 'preserved'));

  await editFile(entry, (code) => code.replace('HMR enabled', 'Updated'));
  await expect(body).toHaveText('Updated');
  await expect(body).toHaveAttribute('data-state', 'preserved');
});

test('should skip HMR in a none mode build with dev.hmr enabled', async ({
  buildPreview,
  page,
}) => {
  await buildPreview({ config: { dev: { hmr: true } } });
  await expect(page.locator('body')).toHaveText('HMR disabled');
});
