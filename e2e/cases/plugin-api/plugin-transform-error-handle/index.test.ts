import { dev, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest('should handle transform error in dev', async () => {
  const rsbuild = await dev({
    cwd: __dirname,
  });

  await rsbuild.expectLog(
    (log) => log.includes('transform error') && log.includes('Build error'),
  );

  await rsbuild.close();
});
