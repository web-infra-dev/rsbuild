import { expect, test } from '@e2e/helper';

test('should allow to use new URL to get path of a Wasm file', async ({
  page,
  build,
}) => {
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

  await expect(
    page.evaluate(`document.querySelector('#root').innerHTML`),
  ).resolves.toMatch(/\/static\/wasm\/\w+\.module\.wasm/);
});
