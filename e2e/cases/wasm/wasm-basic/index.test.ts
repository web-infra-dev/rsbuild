import { expect, test } from '@e2e/helper';

test('should allow to import a Wasm file', async ({ page, build }) => {
  const rsbuild = await build();
  const files = rsbuild.getDistFiles();

  const wasmFile = Object.keys(files).find((file) =>
    file.endsWith('.module.wasm'),
  );

  expect(wasmFile).toBeTruthy();
  expect(/static[\\/]wasm/g.test(wasmFile!)).toBeTruthy();

  await page.waitForFunction(() => {
    return Boolean(document.querySelector('#root')?.innerHTML);
  });

  const locator = page.locator('#root');
  await expect(locator).toHaveText('6');
});
