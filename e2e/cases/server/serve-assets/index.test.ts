import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test } from '@e2e/helper';

test('should serve static files', async ({ request, dev }) => {
  const rsbuild = await dev();
  const baseUrl = `http://localhost:${rsbuild.port}`;
  const resText = await request.get(`${baseUrl}/foo.txt`);
  expect(await resText.text()).toContain('bar');
  const resIndexJs = await request.get(`${baseUrl}/static/js/index.js`);
  expect(await resIndexJs.text()).toContain('Hello Rsbuild!');
});

test('should gzip compressible static assets in dev and preview', async ({
  copySrcDir,
  request,
  runBothServe,
}) => {
  const publicDir = await copySrcDir();
  const body = Buffer.alloc(2048, 0xab);
  const assets = [
    ['module.wasm', body, 'gzip'],
    ['app.webmanifest', body, 'gzip'],
    ['config.toml', body, 'gzip'],
    ['font.ttf', body, 'gzip'],
    ['font.otf', body, 'gzip'],
    ['font.ttc', body, 'gzip'],
    ['image.bmp', body, 'gzip'],
    ['font.woff2', body, undefined],
    ['small.wasm', body.subarray(0, 1024), undefined],
  ] as const;

  for (const [name, content] of assets) {
    await writeFile(join(publicDir, name), content);
  }

  await runBothServe(
    async ({ result }) => {
      for (const [name, content, encoding] of assets) {
        const res = await request.get(
          `http://localhost:${result.port}/${name}`,
          {
            headers: { 'accept-encoding': 'gzip' },
          },
        );
        expect(res.headers()['content-encoding'], name).toBe(encoding);
        expect(await res.body(), name).toEqual(content);
      }
    },
    {
      config: {
        server: {
          publicDir: {
            name: publicDir,
          },
        },
      },
    },
  );
});

test('should serve byte ranges for compiled assets', async ({
  request,
  devOnly,
}) => {
  const { port } = await devOnly();
  const url = `http://localhost:${port}/static/js/index.js`;
  const asset = await (await request.get(url)).body();

  const partial = await request.get(url, {
    headers: { Range: 'bytes=2-4,5-7' },
  });
  expect(partial.status()).toBe(206);
  expect(partial.headers()['content-range']).toBe(`bytes 2-7/${asset.length}`);
  expect(await partial.body()).toEqual(asset.subarray(2, 8));

  const unsatisfiable = await request.get(url, {
    headers: { Range: `bytes=${asset.length}-` },
  });
  expect(unsatisfiable.status()).toBe(416);
  expect(unsatisfiable.headers()['content-range']).toBe(
    `bytes */${asset.length}`,
  );

  const malformed = await request.get(url, {
    headers: { Range: `bytes=2-4,invalid,${asset.length}-` },
  });
  expect(malformed.status()).toBe(200);
  expect(await malformed.body()).toEqual(asset);
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
