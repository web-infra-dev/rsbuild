import { expect, test } from '@e2e/helper';
import { getFileContent } from '@rstackjs/test-utils';

test.for([
  ['/', '/static/image/image.png'],
  ['auto', '../../static/image/image.png'],
] as const)(
  'should resolve emitted assets in CSS `?url` with assetPrefix=%s',
  async ([assetPrefix, url], { build }) => {
    const rsbuild = await build({
      config: { output: { assetPrefix, filenameHash: false } },
    });
    const files = rsbuild.getDistFiles();
    const cssContent = getFileContent(files, 'static/css/style.css');
    expect(cssContent).toContain(`url(${url})`);
  },
);
