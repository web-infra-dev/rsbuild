import { expect, test } from '@e2e/helper';

test('should serve static files', async ({ request, dev }) => {
  const rsbuild = await dev();
  const baseUrl = `http://127.0.0.1:${rsbuild.port}`;
  const resText = await request.get(`${baseUrl}/foo.txt`);
  expect(await resText.text()).toContain('bar');
  const resIndexJs = await request.get(`${baseUrl}/static/js/index.js`);
  expect(await resIndexJs.text()).toContain('Hello Rsbuild!');
});

test('should return 403 for path traversal', async ({ request, dev }) => {
  const rsbuild = await dev();
  const baseUrl = `http://127.0.0.1:${rsbuild.port}`;
  const res = await request.get(`${baseUrl}/..%2f../foo.txt`);
  expect(res.status()).toEqual(403);
  expect(await res.text()).toContain('Forbidden');
});
