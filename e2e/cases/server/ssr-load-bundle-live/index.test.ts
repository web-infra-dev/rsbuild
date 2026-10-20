import { expect, test } from '@e2e/helper';
import { getRandomPort } from '@rstackjs/test-utils';

test('loads ESM bundles with live external bindings and dynamic chunks without VM modules', async ({
  copyNodeModules,
  execCli,
  logHelper,
  request,
}) => {
  await copyNodeModules();
  const port = await getRandomPort();
  execCli(`dev --port ${port}`, { env: { NODE_OPTIONS: '' } });
  await logHelper.expectBuildEnd();
  const response = await request.get(`http://localhost:${port}/check`);
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({
    nativeVm: false,
    result: {
      before: 0,
      after: 1,
      reexported: 1,
      unbound: true,
      lazy: 'loaded',
    },
  });
});
