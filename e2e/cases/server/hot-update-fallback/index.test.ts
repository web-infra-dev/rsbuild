import { expect, test } from '@e2e/helper';

for (const cors of [true, false]) {
  test(`should handle HMR manifest fallbacks with cors=${cors}`, async ({
    devOnly,
  }) => {
    const { port } = await devOnly({ config: { server: { cors } } });
    const cases: [method: string, pathname: string, status: number][] = [
      ['GET', '/ordinary-page', 218],
    ];

    for (const extension of ['json', 'json.mjs']) {
      for (const query of ['', '?cache=probe']) {
        const missing = `/runtime.missing.hot-update.${extension}${query}`;
        cases.push(
          ['GET', missing, 404],
          ['HEAD', missing, 404],
          ['OPTIONS', missing, cors ? 204 : 218],
          ['GET', `/runtime.existing.hot-update.${extension}${query}`, 200],
          ['GET', `/ordinary-page?next=${missing}`, 218],
        );
      }
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
