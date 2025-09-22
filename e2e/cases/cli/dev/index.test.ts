import { expect, getRandomPort, gotoPage, rspackTest } from '@e2e/helper';

rspackTest(
  'should run dev server via `dev` command',
  async ({ page, execCli, logHelper }) => {
    const port = await getRandomPort();
    execCli(`dev --port ${port}`);
    await logHelper.expectBuildEnd();
    await gotoPage(page, { port });
    await expect(page.locator('#test')).toHaveText('hel22o');
  },
);

rspackTest(
  'should run dev server via no command',
  async ({ page, execCli, logHelper }) => {
    const port = await getRandomPort();
    execCli(`--port ${port}`);
    await logHelper.expectBuildEnd();
    await gotoPage(page, { port });
    await expect(page.locator('#test')).toHaveText('hel22lo');
  },
);
