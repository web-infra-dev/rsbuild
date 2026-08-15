import { expect, test } from '@e2e/helper';
import { getFileContent } from '@rstackjs/test-utils';

test('should override blocking script loading for web ESM bundles', async ({ runBoth }) => {
  await runBoth(({ result }) => {
    const html = getFileContent(result.getDistFiles(), 'index.html');
    expect(html).toContain('<script type="module" src="');
  });
});
