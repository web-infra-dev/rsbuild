import { dev, expectPoll, proxyConsole, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest('should handle transform error in dev mode', async () => {
  const { logs, restore } = proxyConsole();
  const rsbuild = await dev({
    cwd: __dirname,
  });

  await expectPoll(() =>
    logs.some(
      (log) => log.includes('transform error') && log.includes('Build error:'),
    ),
  ).toBeTruthy();

  restore();
  await rsbuild.close();
});
