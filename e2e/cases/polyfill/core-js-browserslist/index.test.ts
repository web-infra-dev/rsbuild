import { expect, test } from '@e2e/helper';
import { getPolyfillContent } from '../helper';

test('should read browserslist for development env correctly', async ({
  dev,
}) => {
  const rsbuild = await dev();

  const files = rsbuild.getDistFiles({ sourceMaps: true });
  const content = getPolyfillContent(files);

  expect(content.includes('es.string.replace-all')).toBeFalsy();
});

test('should read browserslist for production env correctly', async ({
  buildOnly,
}) => {
  const rsbuild = await buildOnly();
  const files = rsbuild.getDistFiles({ sourceMaps: true });
  const content = getPolyfillContent(files);

  expect(content.includes('es.string.replace-all')).toBeTruthy();
});
