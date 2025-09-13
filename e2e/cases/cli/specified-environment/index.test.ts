import { join } from 'node:path';
import {
  expect,
  readDirContents,
  rspackTest,
  runCliSync,
  test,
} from '@e2e/helper';
import { remove } from 'fs-extra';

const distPath = join(__dirname, 'dist');

test.beforeEach(async () => {
  await remove(distPath);
});

rspackTest(
  'should only build specified environment when using --environment option',
  async () => {
    runCliSync('build --environment web2', {
      cwd: __dirname,
    });

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
  async () => {
    runCliSync('build --environment web1,web2', {
      cwd: __dirname,
    });

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
