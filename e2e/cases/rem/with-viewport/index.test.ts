import { expect, test } from '@playwright/test';
import { build } from '@e2e/helper';
import { viewportValue } from './rsbuild.config';

test('should inject rem runtime code after meta tags', async () => {
  const remRuntimeCodeKeyWord = 'setRootPixel';
  const rsbuild = await build({
    cwd: __dirname,
  });
  const files = await rsbuild.unwrapOutputJSON();
  const html =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];

  expect(html).toContain(remRuntimeCodeKeyWord);
  expect(html).toContain(viewportValue);
  expect(html.indexOf(remRuntimeCodeKeyWord)).toBeGreaterThan(
    html.indexOf(viewportValue),
  );
});
