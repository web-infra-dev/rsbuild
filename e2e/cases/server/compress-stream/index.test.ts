import type { ServerResponse } from 'node:http';
import { expect, test } from '@e2e/helper';

test('should flush streamed HTML before deferred data in dev and preview', async ({
  runBothServe,
}) => {
  const shell =
    '<!doctype html><html><body>' + '<p>Shell ready</p>'.repeat(3000);
  const suffix = '<p>Deferred data ready</p></body></html>';
  let releaseSuffix: (() => void) | undefined;

  await runBothServe(
    async ({ result }) => {
      const controller = new AbortController();

      try {
        const response = await fetch(`http://localhost:${result.port}/stream`, {
          headers: { 'accept-encoding': 'gzip' },
          // Only guard against a stalled stream; correctness does not depend on timing.
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(5_000),
          ]),
        });
        expect(response.headers.get('content-encoding')).toBe('gzip');

        const reader = response.body!.getReader();
        const chunks: Buffer[] = [];
        let length = 0;

        // Fetch decodes gzip. Hold the suffix until the entire shell is decoded.
        // This fails if the compressor waits for res.end() to release the shell.
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          const chunk = Buffer.from(value);
          chunks.push(chunk);
          length += chunk.length;

          if (length === Buffer.byteLength(shell)) {
            expect(Buffer.concat(chunks).toString()).toBe(shell);
            releaseSuffix!();
          }
        }
        expect(Buffer.concat(chunks).toString()).toBe(shell + suffix);
      } finally {
        releaseSuffix?.();
        releaseSuffix = undefined;
        controller.abort();
      }
    },
    {
      config: {
        server: {
          htmlFallback: false,
          setup:
            ({ server }) =>
            () => {
              server.middlewares.use((req, res, next) => {
                if (req.url !== '/stream') {
                  next();
                  return;
                }

                releaseSuffix = () => {
                  if (!res.writableEnded && !res.destroyed) {
                    res.end(suffix);
                  }
                };
                res.setHeader('Content-Type', 'text/html');
                res.write(shell);
                (res as ServerResponse & { flush?: () => void }).flush?.();
              });
            },
        },
      },
    },
  );
});
