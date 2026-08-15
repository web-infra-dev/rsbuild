import { basename, join } from 'node:path';
import { expect, test } from '@e2e/helper';

const getJsFilenames = (files: Record<string, string>) =>
  Object.keys(files)
    .filter((filename) => filename.endsWith('.js'))
    .map((filename) => basename(filename));

const findChunk = (filenames: string[], name: string) =>
  filenames.find((filename) => new RegExp(`^${name}\\.[a-f0-9]{8}\\.js$`).test(filename));

test('should keep unchanged SPA filename hashes stable', async ({
  build,
  copySrcDir,
  editFile,
}) => {
  const srcDir = await copySrcDir();
  const config = {
    source: {
      entry: {
        index: join(srcDir, 'index.js'),
      },
    },
    output: {
      filenameHash: 'contenthash:8',
    },
  };

  const firstBuild = await build({ config });
  const firstFilenames = getJsFilenames(firstBuild.getDistFiles());
  const firstIndex = findChunk(firstFilenames, 'index');
  const firstFeatureA = findChunk(firstFilenames, 'featureA');
  const firstFeatureB = findChunk(firstFilenames, 'featureB');

  expect(firstFilenames).toHaveLength(3);
  expect(firstIndex).toBeDefined();
  expect(firstFeatureA).toBeDefined();
  expect(firstFeatureB).toBeDefined();

  await editFile(join(srcDir, 'message.js'), (content) => content.replace('before', 'after'));

  const secondBuild = await build({ config });
  const secondFilenames = getJsFilenames(secondBuild.getDistFiles());
  const secondIndex = findChunk(secondFilenames, 'index');
  const secondFeatureA = findChunk(secondFilenames, 'featureA');
  const secondFeatureB = findChunk(secondFilenames, 'featureB');

  expect(secondFilenames).toHaveLength(3);
  expect(secondIndex).toBeDefined();
  expect(secondIndex).not.toBe(firstIndex);
  expect(secondFeatureA).toBe(firstFeatureA);
  expect(secondFeatureB).toBe(firstFeatureB);
});
