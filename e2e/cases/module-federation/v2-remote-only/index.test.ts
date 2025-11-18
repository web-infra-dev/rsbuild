import { expect, rspackTest } from '@e2e/helper';

rspackTest('should start MF app in dev without entry', async ({ devOnly }) => {
  await expect(devOnly()).resolves.toBeTruthy();
});

rspackTest('should build MF app without entry', async ({ build }) => {
  await expect(build()).resolves.toBeTruthy();
});
