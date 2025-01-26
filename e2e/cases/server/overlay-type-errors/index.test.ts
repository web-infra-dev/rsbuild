import { dev, gotoPage, proxyConsole } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { pluginTypeCheck } from '@rsbuild/plugin-type-check';

const cwd = __dirname;

test('should display type errors on overlay correctly', async ({ page }) => {
  const { restore } = proxyConsole();

  let tsCheckDoneResolve: () => void;
  const waitTsCheckDone = new Promise<void>((resolve) => {
    tsCheckDoneResolve = resolve;
  });

  const rsbuild = await dev({
    cwd,
    plugins: [
      {
        name: 'remove-pre-ts-check-plugin',
        remove: [pluginTypeCheck.name],
        setup() {},
      },
      pluginTypeCheck({
        forkTsCheckerOptions: {
          logger: {
            log: console.log,
            error: (...args: any[]) => {
              tsCheckDoneResolve();
              return console.error(...args);
            },
          },
        },
      }),
    ],
  });

  await waitTsCheckDone;

  await gotoPage(page, rsbuild);
  const errorOverlay = page.locator('rsbuild-error-overlay');

  await expect(errorOverlay.locator('.title')).toHaveText('Build failed');

  // The first span is "<span style="color:#888">TS2322: </span>"
  const firstSpan = errorOverlay.locator('span').first();
  expect(await firstSpan.textContent()).toEqual('TS2322: ');
  expect(await firstSpan.getAttribute('style')).toEqual('color:#888;');

  // The first link is "<a class="file-link">/src/index.ts:3:1</a>"
  const firstLink = errorOverlay.locator('.file-link').first();
  expect(await firstLink.getAttribute('class')).toEqual('file-link');
  expect(
    (await firstLink.textContent())?.endsWith('/src/index.ts:3:1'),
  ).toBeTruthy();

  await rsbuild.close();

  restore();
});
