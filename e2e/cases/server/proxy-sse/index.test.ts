import { dev, getRandomPort } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import polka from 'polka';

test('should proxy SSE request correctly', async ({ page }) => {
  const ssePort = await getRandomPort();
  const rsbuild = await dev({
    cwd: __dirname,
    page,
    rsbuildConfig: {
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

  const app = polka();

  app.get('/sse', (_req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    res.write('data: Hello SSE1\n');
    res.write('data: Hello SSE2\n');
  });

  await new Promise<void>((resolve) => {
    app.listen(ssePort, () => resolve());
  });

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

  await rsbuild.close();
  app.server?.close();
});
