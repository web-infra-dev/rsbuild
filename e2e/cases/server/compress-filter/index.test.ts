import { build, expect, test } from '@e2e/helper';

test('should support configuring the compression filter in dev', async ({
  request,
  dev,
}) => {
  const rsbuild = await dev();

  const indexJsResponse = await request.get(
    `http://127.0.0.1:${rsbuild.port}/static/js/index.js`,
  );
  expect(indexJsResponse.headers()['content-encoding']).toEqual(undefined);

  const asyncJsResponse = await request.get(
    `http://127.0.0.1:${rsbuild.port}/static/js/async/vue.js`,
  );
  expect(asyncJsResponse.headers()['content-encoding']).toEqual('gzip');
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
