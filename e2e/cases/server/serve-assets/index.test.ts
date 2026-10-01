import fs from 'node:fs';
import { expect, test } from '@e2e/helper';
import { rs } from 'rstack/test';

test('should serve static files', async ({ request, dev }) => {
  const rsbuild = await dev();
  const baseUrl = `http://localhost:${rsbuild.port}`;
  const resText = await request.get(`${baseUrl}/foo.txt`);
  expect(await resText.text()).toContain('bar');
  const resIndexJs = await request.get(`${baseUrl}/static/js/index.js`);
  expect(await resIndexJs.text()).toContain('Hello Rsbuild!');
});

test('should serve HEAD responses without leaking file streams', async ({
  request,
  dev,
}) => {
  const rsbuild = await dev({ config: { dev: { writeToDisk: true } } });
  const url = `http://localhost:${rsbuild.port}/static/js/index.js`;
  const get = await request.get(url, {
    headers: { 'Accept-Encoding': 'identity' },
  });
  const readStream = rs.spyOn(fs, 'createReadStream');

  try {
    const head = await request.head(url);
    expect(head.status()).toBe(200);
    expect(await head.body()).toHaveLength(0);
    for (const name of ['content-type', 'content-length', 'etag']) {
      expect(head.headers()[name]).toBe(get.headers()[name]);
    }

    const range = await request.head(url, { headers: { Range: 'bytes=0-9' } });
    expect(range.status()).toBe(206);
    expect(range.headers()['content-length']).toBe('10');
    expect(await range.body()).toHaveLength(0);

    await expect
      .poll(() =>
        readStream.mock.results.every(
          (result) => result.type === 'return' && result.value.closed,
        ),
      )
      .toBe(true);
  } finally {
    readStream.mockRestore();
  }
});

test('should return 403 for path traversal', async ({ request, dev }) => {
  const rsbuild = await dev();
  const baseUrl = `http://localhost:${rsbuild.port}`;
  const res = await request.get(`${baseUrl}/..%2f../foo.txt`);
  expect(res.status()).toEqual(403);
  expect(await res.text()).toContain('Forbidden');
  await rsbuild.expectLog('Malicious path');
});

test('should return 400 for null byte injection', async ({ request, dev }) => {
  const rsbuild = await dev();
  const baseUrl = `http://localhost:${rsbuild.port}`;
  const res = await request.get(`${baseUrl}/foo%00bar.js`);
  expect(res.status()).toEqual(400);
  expect(await res.text()).toContain('Bad Request');
  await rsbuild.expectLog('Invalid pathname');
});

test('should return 400 for invalid pathname', async ({ request, dev }) => {
  const rsbuild = await dev();
  const baseUrl = `http://localhost:${rsbuild.port}`;
  const res = await request.get(`${baseUrl}/foo%E0%A4bar.js`);
  expect(res.status()).toEqual(400);
  expect(await res.text()).toContain('Bad Request');
  await rsbuild.expectLog('Invalid pathname');
});
