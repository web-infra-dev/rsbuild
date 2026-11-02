import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Rspack } from '@rsbuild/core';
import { expect, gotoPage, test } from '@e2e/helper';

for (const mixed of [false, true]) {
  test(`should reload only outdated pages when initial chunks change (mixed: ${mixed})`, async ({
    page,
    devOnly,
    cwd,
  }) => {
    const temp = await mkdtemp(join(tmpdir(), 'rsbuild-initial-chunks-'));
    const stateFile = join(temp, 'extra');
    let compiler!: Rspack.Compiler;
    await writeFile(stateFile, 'false');
    const hotUpdateRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('.hot-update.')) {
        hotUpdateRequests.push(request.url());
      }
    });
    const rsbuild = await devOnly({
      config: {
        tools: {
          rspack(config, { environment }) {
            if (environment.name !== 'web') return;
            config.module.rules ??= [];
            config.module.rules.push({
              test: /index\.js$/,
              use: {
                loader: join(cwd, 'extra-loader.mjs'),
                options: { stateFile },
              },
            });
            config.plugins.push({
              apply(value: Rspack.Compiler) {
                compiler = value;
              },
            });
          },
        },
        environments: {
          web: {},
          ...(mixed && {
            node: {
              source: { entry: { server: './src/server.js' } },
              output: { target: 'node' },
            },
          }),
        },
      },
    });

    try {
      const compiled = Promise.withResolvers<void>();
      rsbuild.instance.onAfterDevCompile(() => compiled.resolve());
      await writeFile(stateFile, 'true');
      compiler.watching!.invalidate();
      await compiled.promise;

      // This marker is handled after the initial stats messages in the browser.
      rsbuild.server!.environments.web.hot.onConnect((client) => {
        client.send('custom', { event: 'connected' });
      });
      await page.addInitScript(() => {
        sessionStorage.setItem(
          'loads',
          String(Number(sessionStorage.getItem('loads') || 0) + 1),
        );
      });
      await gotoPage(page, rsbuild);
      await expect(page.locator('body')).toHaveAttribute(
        'data-connected',
        'true',
      );
      expect(await page.evaluate(() => sessionStorage.getItem('loads'))).toBe(
        '1',
      );

      // The same page must still reload when its loaded chunks become outdated.
      await writeFile(stateFile, 'false');
      compiler.watching!.invalidate();
      await expect
        .poll(() => page.evaluate(() => sessionStorage.getItem('loads')))
        .toBe('2');
      await expect(page.locator('body')).toHaveAttribute(
        'data-connected',
        'true',
      );
      await expect(page.locator('#root')).toHaveText('ready');
      expect(hotUpdateRequests).toEqual([]);
    } finally {
      await rm(temp, { recursive: true, force: true });
    }
  });
}
