import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest('should allow to set hash format to fullhash', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = await rsbuild.unwrapOutputJSON();
  const filenames = Object.keys(files);

  let firstHash = '';

  for (const filename of filenames) {
    if (!filename.includes('static')) {
      continue;
    }

    const hash = filename.match(/[a-f0-9]{12}\.js/)![0];
    if (!firstHash) {
      firstHash = hash;
    } else {
      expect(hash).toEqual(firstHash);
    }
  }
});
