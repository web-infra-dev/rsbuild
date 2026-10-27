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
          // Abort a stuck request instead of waiting forever.
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(5_000),
          ]),
        });
        expect(response.headers.get('content-encoding')).toBe('gzip');

        const reader = response
          .body!.pipeThrough(new TextDecoderStream())
          .getReader();
        let html = '';

        // Fetch decompresses gzip automatically. Send the remaining HTML only after
        // the client has read the full shell, proving flush works before res.end().
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          html += value;

          if (html === shell) {
            releaseSuffix!();
          }
        }
        expect(html).toBe(shell + suffix);
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
                res.flush?.();
              });
            },
        },
      },
    },
  );
});
