import { join } from 'node:path';
import { expect, test } from '@e2e/helper';

for (const esm of [false, true]) {
  test(`should handle HMR manifest fallbacks with output.module=${esm}`, async ({
    dev,
    page,
    copySrcDir,
    editFile,
  }) => {
    const entry = join(await copySrcDir(), 'index.js');
    const { port } = await dev({
      config: {
        source: { entry: { index: entry } },
        output: { module: esm },
      },
    });
    await expect(page.locator('#test')).toHaveText('before');

    const extension = esm ? 'json.mjs' : 'json';
    const manifestResponse = page.waitForResponse((response) =>
      response.url().endsWith(`.hot-update.${extension}`),
    );
    await editFile(entry, (code) => code.replace('before', 'after'));
    const manifest = await manifestResponse;
    expect(manifest.status()).toBe(200);
    await expect(page.locator('#test')).toHaveText('after');

    const cases: [method: string, pathname: string, status: number][] = [
      ['GET', '/ordinary-page', 218],
    ];

    for (const query of ['', '?cache=probe']) {
      const missing = `/runtime.missing.hot-update.${extension}${query}`;
      cases.push(
        ['GET', missing, 404],
        ['HEAD', missing, 404],
        ['OPTIONS', missing, 218],
        ['GET', `${new URL(manifest.url()).pathname}${query}`, 200],
        ['GET', `/ordinary-page?next=${missing}`, 218],
      );
    }

    for (const [method, pathname, status] of cases) {
      const response = await fetch(`http://localhost:${port}${pathname}`, {
        method,
      });
      await response.text();
      expect(response.status, `${method} ${pathname}`).toBe(status);
    }
  });
}
