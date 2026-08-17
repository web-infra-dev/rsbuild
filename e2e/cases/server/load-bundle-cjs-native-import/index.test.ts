import { expect, test } from '@e2e/helper';
import { getRandomPort } from '@rstackjs/test-utils';

test('should load a CJS bundle containing native import()', async ({
  execCli,
  logHelper,
  request,
}) => {
  const port = await getRandomPort();
  execCli(`dev --port ${port}`, {
    env: {
      NODE_OPTIONS: '--experimental-vm-modules',
    },
  });
  await logHelper.expectBuildEnd();

  const response = await request.get(`http://localhost:${port}/check`);
  expect(response.status()).toBe(200);
  expect(await response.text()).toBe('index.js');
});
