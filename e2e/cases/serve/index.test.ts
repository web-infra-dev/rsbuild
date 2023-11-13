import { join } from 'path';
import { fse } from '@rsbuild/shared';
import { expect, test } from '@playwright/test';
import { build, getHrefByEntryName } from '@scripts/shared';

test('should preview dist files correctly', async ({ page }) => {
  const cwd = join(__dirname, 'basic');

  const { instance } = await build({
    cwd,
    entry: {
      main: join(cwd, 'src/index.js'),
    },
  });

  const { port, server } = await instance.preview();

  await page.goto(getHrefByEntryName('main', port));

  const rootEl = page.locator('#root');
  await expect(rootEl).toHaveText('Hello Rsbuild!');

  await server.close();

  await fse.remove(join(cwd, 'dist-1'));
});
