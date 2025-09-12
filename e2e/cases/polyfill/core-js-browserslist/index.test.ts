import { build, dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { getPolyfillContent } from '../helper';

test('should read browserslist for development env correctly', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
  });

  const files = rsbuild.getDistFiles({ sourceMaps: true });
  const content = getPolyfillContent(files);

  expect(content.includes('es.string.replace-all')).toBeFalsy();
  await rsbuild.close();
});

test('should read browserslist for production env correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = rsbuild.getDistFiles({ sourceMaps: true });
  const content = getPolyfillContent(files);

  expect(content.includes('es.string.replace-all')).toBeTruthy();
  await rsbuild.close();
});
