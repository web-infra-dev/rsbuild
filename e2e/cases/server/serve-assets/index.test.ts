import { expect, test } from '@e2e/helper';

test('should serve static files and return 403 for path traversal', async ({
  request,
  dev,
}) => {
  const rsbuild = await dev();
  const baseUrl = `http://127.0.0.1:${rsbuild.port}`;
  const reqText = await request.get(`${baseUrl}/foo.txt`);
  expect(await reqText.text()).toContain('bar');
  const reqIndexJs = await request.get(`${baseUrl}/static/js/index.js`);
  expect(await reqIndexJs.text()).toContain('Hello Rsbuild!');
});

test('should return 403 for path traversal', async ({ request, dev }) => {
  const rsbuild = await dev();
  const baseUrl = `http://127.0.0.1:${rsbuild.port}`;
  const res = await request.get(`${baseUrl}/..%2f../foo.txt`);
  expect(res.status()).toEqual(403);
  expect(await res.text()).toContain('Forbidden');
});
