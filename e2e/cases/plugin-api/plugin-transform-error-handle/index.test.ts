import { dev, expectPoll, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest('should handle transform error in dev mode', async () => {
  const rsbuild = await dev({
    cwd: __dirname,
  });

  await expectPoll(() =>
    rsbuild.logs.some(
      (log) => log.includes('transform error') && log.includes('Build error'),
    ),
  ).toBeTruthy();

  await rsbuild.close();
});
