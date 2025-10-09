import { expect, rspackTest } from '@e2e/helper';
import { getPolyfillContent } from '../helper';

rspackTest(
  'should read browserslist for development env correctly',
  async ({ dev }) => {
    const rsbuild = await dev();

    const files = rsbuild.getDistFiles({ sourceMaps: true });
    const content = getPolyfillContent(files);

    expect(content.includes('es.string.replace-all')).toBeFalsy();
  },
);

rspackTest(
  'should read browserslist for production env correctly',
  async ({ build }) => {
    const rsbuild = await build();
    const files = rsbuild.getDistFiles({ sourceMaps: true });
    const content = getPolyfillContent(files);

    expect(content.includes('es.string.replace-all')).toBeTruthy();
  },
);
