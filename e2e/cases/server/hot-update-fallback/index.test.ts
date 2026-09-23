import { join } from 'node:path';
import { expect, test } from '@e2e/helper';

test.for([false, true])(
  'should handle HMR manifest fallbacks with output.module=%s',
  async (esm, { dev, page, copySrcDir, editFile }) => {
    const entry = join(await copySrcDir(), 'index.js');
    const { port } = await dev({
      config: {
        source: { entry: { index: entry } },
        output: { module: esm },
      },
    });
    const extension = esm ? 'json.mjs' : 'json';
    const manifestResponse = page.waitForResponse(
      `**/*.hot-update.${extension}`,
    );
    await editFile(entry, (code) => code.replace('before', 'after'));
    const manifest = new URL((await manifestResponse).url()).pathname;
    await expect(page.locator('#test')).toHaveText('after');

    const missing = `/runtime.missing.hot-update.${extension}`;
    for (const [method, pathname, status] of [
      ['GET', `${manifest}?cache=probe`, 200],
      ['GET', missing, 404],
      ['GET', `${missing}?cache=probe`, 404],
      ['OPTIONS', missing, 218],
      ['GET', '/ordinary-page', 218],
      ['GET', `/ordinary-page?next=${missing}`, 218],
    ] as const) {
      const response = await page.request.fetch(
        `http://localhost:${port}${pathname}`,
        { method },
      );
      expect(response.status(), `${method} ${pathname}`).toBe(status);
    }
  },
);
