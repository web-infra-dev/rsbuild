import { expect, test } from '@e2e/helper';

// Decodes to `../`.
const encodedUpPath = '%2e%2e%2f';

test('should only serve assets from web environments', async ({
  devOnly,
  request,
}) => {
  const rsbuild = await devOnly();
  const baseUrl = `http://localhost:${rsbuild.port}`;

  const webAsset = await request.get(
    `${baseUrl}/browser-assets/static/js/shared.js`,
  );
  expect(webAsset.status()).toBe(200);
  expect(await webAsset.text()).toContain('web-environment');

  const sharedAsset = await request.get(`${baseUrl}/static/js/shared.js`);
  expect(sharedAsset.status()).toBe(200);
  expect(await sharedAsset.text()).toContain('web-environment');

  const nodeAsset = await request.get(`${baseUrl}/server.js`);
  expect(nodeAsset.status()).toBe(404);

  const prefixedNodeAsset = await request.get(
    `${baseUrl}/server-assets/server.js`,
  );
  expect(prefixedNodeAsset.status()).toBe(404);

  const bundle = await rsbuild.server!.environments.node.loadBundle<{
    marker: string;
  }>('server');
  expect(bundle.marker).toBe('node-environment');
});

test('should reject path traversal after stripping the asset prefix', async ({
  request,
  runBothServe,
}) => {
  await runBothServe(async ({ result }) => {
    const response = await request.get(
      `http://localhost:${result.port}/browser-assets/${encodedUpPath}server/server.js?probe=1`,
    );

    expect(response.status()).toBe(403);
    expect(await response.text()).toContain('Forbidden');
  });
});
