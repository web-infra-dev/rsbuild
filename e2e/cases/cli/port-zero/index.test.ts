import { expect, gotoPage, test } from '@e2e/helper';

const getPortFromLogs = (logs: string[]): number => {
  const match = logs.join('\n').match(/http:\/\/localhost:(\d+)/);
  if (!match) {
    throw new Error('Failed to find server port in logs.');
  }
  return Number(match[1]);
};

test('should support --port 0 for dev server', async ({
  page,
  execCli,
  logHelper,
}) => {
  execCli('dev --port 0');
  await logHelper.expectBuildEnd();

  const port = getPortFromLogs(logHelper.logs);
  expect(port).toBeGreaterThan(0);

  await gotoPage(page, { port });
  await expect(page.locator('#test')).toHaveText('Hello Rsbuild!');
});

test('should support --port 0 for preview server', async ({
  page,
  build,
  execCli,
  logHelper,
}) => {
  await build();
  logHelper.clearLogs();

  execCli('preview --port 0');
  await logHelper.expectLog('➜  Local:');

  const port = getPortFromLogs(logHelper.logs);
  expect(port).toBeGreaterThan(0);

  await gotoPage(page, { port });
  await expect(page.locator('#test')).toHaveText('Hello Rsbuild!');
});
