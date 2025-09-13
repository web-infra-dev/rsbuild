import { expect, rspackTest } from '@e2e/helper';

rspackTest('should set the hash format to fullhash', async ({ build }) => {
  const rsbuild = await build();

  const files = rsbuild.getDistFiles();
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
