import { rspackTest } from '@e2e/helper';

rspackTest('should handle transform error in dev', async ({ devOnly }) => {
  const rsbuild = await devOnly();

  await rsbuild.expectLog(
    (log) => log.includes('transform error') && log.includes('Build error'),
  );
});
