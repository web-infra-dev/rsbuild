import { build, dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should support configuring the compression filter in dev', async ({
  page,
  request,
}) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
  });

  const indexJsResponse = await request.get(
    `http://127.0.0.1:${rsbuild.port}/static/js/index.js`,
  );
  expect(indexJsResponse.headers()['content-encoding']).toEqual(undefined);

  const asyncJsResponse = await request.get(
    `http://127.0.0.1:${rsbuild.port}/static/js/async/vue.js`,
  );
  expect(asyncJsResponse.headers()['content-encoding']).toEqual('gzip');

  await rsbuild.close();
});

test('should support configuring the compression filter in preview mode', async ({
  page,
  request,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
  });

  const indexJsResponse = await request.get(
    `http://127.0.0.1:${rsbuild.port}/static/js/index.js`,
  );
  expect(indexJsResponse.headers()['content-encoding']).toEqual(undefined);

  const asyncJsResponse = await request.get(
    `http://127.0.0.1:${rsbuild.port}/static/js/async/vue.js`,
  );
  expect(asyncJsResponse.headers()['content-encoding']).toEqual('gzip');

  await rsbuild.close();
});
