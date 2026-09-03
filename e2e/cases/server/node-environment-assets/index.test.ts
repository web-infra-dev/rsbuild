import { expect, test } from '@e2e/helper';

test('should not serve assets when only a node environment exists', async ({
  devOnly,
  request,
}) => {
  const rsbuild = await devOnly();
  const baseUrl = `http://localhost:${rsbuild.port}`;

  const nodeAsset = await request.get(`${baseUrl}/static/js/server.js`);
  expect(nodeAsset.status()).toBe(404);

  const prefixedNodeAsset = await request.get(
    `${baseUrl}/server-assets/static/js/server.js`,
  );
  expect(prefixedNodeAsset.status()).toBe(404);

  const bundle = await rsbuild.server!.environments.node.loadBundle<{
    marker: string;
  }>('server');
  expect(bundle.marker).toBe('node-environment');
});
