import { basename, join } from 'node:path';
import { expect, test } from '@e2e/helper';

const getJsFilenames = (files: Record<string, string>) =>
  Object.keys(files)
    .filter((filename) => filename.endsWith('.js'))
    .map((filename) => basename(filename));

const findChunk = (filenames: string[], name: string) =>
  filenames.find((filename) =>
    new RegExp(`^${name}\\.[a-f0-9]{8}\\.js$`).test(filename),
  );

test('should keep unchanged MPA filename hashes stable', async ({
  build,
  copySrcDir,
  editFile,
}) => {
  const srcDir = await copySrcDir();
  const config = {
    source: {
      entry: {
        pageA: join(srcDir, 'pageA.js'),
        pageB: join(srcDir, 'pageB.js'),
      },
    },
    output: {
      filenameHash: 'contenthash:8',
    },
  };

  const firstBuild = await build({ config });
  const firstFilenames = getJsFilenames(firstBuild.getDistFiles());
  const firstPageA = findChunk(firstFilenames, 'pageA');
  const firstPageB = findChunk(firstFilenames, 'pageB');

  expect(firstFilenames).toHaveLength(2);
  expect(firstPageA).toBeDefined();
  expect(firstPageB).toBeDefined();

  await editFile(join(srcDir, 'pageAMessage.js'), (content) =>
    content.replace('before', 'after'),
  );

  const secondBuild = await build({ config });
  const secondFilenames = getJsFilenames(secondBuild.getDistFiles());
  const secondPageA = findChunk(secondFilenames, 'pageA');
  const secondPageB = findChunk(secondFilenames, 'pageB');

  expect(secondFilenames).toHaveLength(2);
  expect(secondPageA).toBeDefined();
  expect(secondPageA).not.toBe(firstPageA);
  expect(secondPageB).toBe(firstPageB);
});
