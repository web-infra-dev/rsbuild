import { expect, getRandomPort, test } from '@e2e/helper';
import { promisify } from 'node:util';
import zlib from 'node:zlib';
import { createAdaptorServer } from '@hono/node-server';
import { Hono } from 'hono';

const gunzip = promisify(zlib.gunzip);

test('should proxy SSE request', async ({ dev, page }) => {
  const ssePort = await getRandomPort();
  const rsbuild = await dev({
    config: {
      server: {
        proxy: {
          '/api': {
            target: `http://localhost:${ssePort}`,
            pathRewrite: { '^/api': '' },
          },
        },
      },
    },
  });

  const app = new Hono();

  app.get('/sse', () => {
    return new Response('data: Hello SSE1\n\ndata: Hello SSE2\n\n', {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  });

  const server = createAdaptorServer({ fetch: app.fetch });

  await new Promise<void>((resolve) => {
    server.listen(ssePort, () => resolve());
  });

  try {
    const sseUrl = `http://localhost:${rsbuild.port}/api/sse`;

    const result = await page.evaluate(async (url) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      try {
        const response = await fetch(url, { signal: controller.signal });
        const reader = response.body!.getReader();
        const { value } = await reader.read();
        const text = new TextDecoder().decode(value);

        return {
          ok: response.ok,
          contentType: response.headers.get('content-type'),
          text,
        };
      } finally {
        clearTimeout(timeoutId);
      }
    }, sseUrl);

    expect(result.ok).toBe(true);
    expect(result.contentType).toBe('text/event-stream');
    expect(result.text).toContain('Hello SSE1');
    expect(result.text).toContain('Hello SSE2');
  } finally {
    server.close();
  }
});

test('should not gzip proxied SSE responses', async ({ dev, request }) => {
  const ssePort = await getRandomPort();
  const rsbuild = await dev({
    config: {
      server: {
        proxy: {
          '/api': {
            target: `http://localhost:${ssePort}`,
            pathRewrite: { '^/api': '' },
          },
        },
      },
    },
  });

  const app = new Hono();

  app.get('/sse', () => {
    return new Response('data: Hello SSE1\n\ndata: Hello SSE2\n\n', {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  });

  const server = createAdaptorServer({ fetch: app.fetch });

  await new Promise<void>((resolve) => {
    server.listen(ssePort, () => resolve());
  });

  try {
    const response = await request.get(`http://localhost:${rsbuild.port}/api/sse`, {
      headers: {
        'accept-encoding': 'gzip',
      },
    });
    const headers = response.headers();
    const rawBody = await response.body();
    const text = headers['content-encoding'] === 'gzip'
      ? (await gunzip(rawBody)).toString('utf8')
      : rawBody.toString('utf8');

    expect(headers['content-encoding']).toEqual(undefined);
    expect(headers['content-type']).toContain('text/event-stream');
    expect(text).toContain('Hello SSE1');
    expect(text).toContain('Hello SSE2');
  } finally {
    server.close();
  }
});
