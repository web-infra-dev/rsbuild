import { expect } from '@playwright/test';
import { build, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest('should allow to set hash format to fullhash', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = await rsbuild.unwrapOutputJSON();
  const filenames = Object.keys(files);

  let firstHash: string;

  filenames.forEach((filename) => {
    if (!filename.includes('static')) {
      return;
    }

    const hash = filename.match(/[a-f0-9]{12}\.js/)![0];
    if (!firstHash) {
      firstHash = hash;
    } else {
      expect(hash).toEqual(firstHash);
    }
  });
});
