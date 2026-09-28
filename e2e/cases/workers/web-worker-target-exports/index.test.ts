import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect, test } from '@e2e/helper';

// Cloudflare Workers use a default handler export and named exports for classes such as Durable Objects.
test('should preserve module worker entry exports with library output', async ({
  build,
}) => {
  const result = await build();
  const entry = pathToFileURL(join(result.distPath, 'index.mjs'));
  const worker: typeof import('./src/index.ts') = await import(
    `${entry.href}?t=${Date.now()}`
  );

  expect(Object.keys(worker).sort()).toEqual(['Counter', 'default']);
  expect(await worker.default.fetch().text()).toBe('hello worker');
  expect(new worker.Counter().count).toBe(0);
});
