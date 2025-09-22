import { join } from 'node:path';
import { expect, readDirContents, rspackTest, test } from '@e2e/helper';
import { remove } from 'fs-extra';

const distPath = join(__dirname, 'dist');

test.beforeEach(async () => {
  await remove(distPath);
});

rspackTest(
  'should only build specified environment when using --environment option',
  async ({ execCliSync }) => {
    execCliSync('build --environment web2');

    const files = await readDirContents(distPath);
    const outputFiles = Object.keys(files);

    expect(
      outputFiles.find((item) => item.includes('web1/index.html')),
    ).toBeFalsy();
    expect(
      outputFiles.find((item) => item.includes('web2/index.html')),
    ).toBeTruthy();
  },
);

rspackTest(
  'should build specified environments when using --environment shorten option',
  async ({ execCliSync }) => {
    execCliSync('build --environment web1,web2');

    const files = await readDirContents(distPath);
    const outputFiles = Object.keys(files);

    expect(
      outputFiles.find((item) => item.includes('web1/index.html')),
    ).toBeTruthy();
    expect(
      outputFiles.find((item) => item.includes('web2/index.html')),
    ).toBeTruthy();
  },
);
