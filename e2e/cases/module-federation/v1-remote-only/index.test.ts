import { expect, rspackTest } from '@e2e/helper';

rspackTest(
  'should start remove-only MF app in dev',
  async ({ devOnly, logHelper }) => {
    await expect(devOnly()).resolves.toBeTruthy();
  },
);

rspackTest('should build remove-only MF app', async ({ build }) => {
  await expect(build()).resolves.toBeTruthy();
});
