import { once } from 'node:events';
import { PassThrough } from 'node:stream';
import { expect, test } from '@e2e/helper';
import {
  createLogger,
  type RsbuildPluginAPI,
  type Rspack,
} from '@rsbuild/core';
import { rstest } from '@rstest/core';

test('should serve static files', async ({ request, dev }) => {
  const rsbuild = await dev();
  const baseUrl = `http://localhost:${rsbuild.port}`;
  const resText = await request.get(`${baseUrl}/foo.txt`);
  expect(await resText.text()).toContain('bar');
  const resIndexJs = await request.get(`${baseUrl}/static/js/index.js`);
  expect(await resIndexJs.text()).toContain('Hello Rsbuild!');
});

for (const outcome of ['complete', 'disconnect']) {
  test(`should clean up the asset stream and log once when requests ${outcome}`, async ({
    dev,
  }) => {
    let compiler: Rspack.Compiler;
    const rsbuild = await dev({
      config: {
        customLogger: createLogger({ level: 'verbose' }),
        server: { compress: false },
        plugins: [
          {
            name: 'capture-compiler',
            setup(api: RsbuildPluginAPI) {
              api.onAfterCreateCompiler(({ compiler: created }) => {
                compiler =
                  'compilers' in created ? created.compilers[0] : created;
              });
            },
          },
        ],
      },
    });
    const content = Object.entries(rsbuild.getDistFiles()).find(([name]) =>
      name.endsWith('/static/js/index.js'),
    )![1];
    const stream = new PassThrough({ autoDestroy: false });
    const closed = once(stream, 'close');
    const createReadStream = rstest
      .spyOn(compiler!.outputFileSystem!, 'createReadStream')
      .mockReturnValue(stream);
    const log = rstest.spyOn(rsbuild.instance.logger, 'debug');
    const controller = new AbortController();

    if (outcome === 'complete') {
      stream.end(content);
    } else {
      stream.write(content.slice(0, 1));
    }

    try {
      const response = await fetch(
        `http://localhost:${rsbuild.port}/static/js/index.js`,
        { signal: controller.signal },
      );
      expect(response.status).toBe(200);
      if (outcome === 'complete') {
        expect(await response.text()).toBe(content);
      } else {
        controller.abort();
      }
      await closed;
      expect(stream.destroyed).toBe(true);
      await expect.poll(() => log.mock.calls.length).toBe(1);
      expect(log).toHaveBeenCalledWith(
        expect.stringContaining('GET /static/js/index.js'),
      );
    } finally {
      controller.abort();
      stream.destroy();
      createReadStream.mockRestore();
      log.mockRestore();
    }
  });
}

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
