import { join } from 'node:path';
import { build, dev, globContentJSON } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { getPolyfillContent } from '../helper';

test('should read browserslist for development env correctly', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
  });

  const outputs = await globContentJSON(join(__dirname, 'dist'));
  const content = getPolyfillContent(outputs);

  expect(content.includes('es.string.replace-all')).toBeFalsy();

  await rsbuild.close();
});

test('should read browserslist for production env correctly', async () => {
  await build({
    cwd: __dirname,
  });

  const outputs = await globContentJSON(join(__dirname, 'dist'));
  const content = getPolyfillContent(outputs);

  expect(content.includes('es.string.replace-all')).toBeTruthy();
});
