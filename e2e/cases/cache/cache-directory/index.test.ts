import fs from 'node:fs';
import path from 'node:path';
import { expect, expectFile, test } from '@e2e/helper';
import fse from 'fs-extra';

const cacheDirectory = path.resolve(
  import.meta.dirname,
  './node_modules/.cache',
);

test.beforeAll(async () => {
  await fse.remove(cacheDirectory);
});

test('should use `buildCache.cacheDirectory` as expected', async ({
  runDevAndBuild,
}) => {
  const devDirectory = path.resolve(
    import.meta.dirname,
    './node_modules/.cache2/dev',
  );
  await fse.remove(devDirectory);
  await runDevAndBuild(
    async () => {
      await expectFile(devDirectory);
      expect(fs.existsSync(cacheDirectory)).toBeFalsy();
    },
    {
      options: {
        config: {
          performance: {
            buildCache: {
              cacheDirectory: devDirectory,
            },
          },
        },
      },
    },
  );

  const buildDirectory = path.resolve(
    import.meta.dirname,
    './node_modules/.cache2/build',
  );
  await fse.remove(buildDirectory);
  await runDevAndBuild(
    async () => {
      await expectFile(buildDirectory);
      expect(fs.existsSync(cacheDirectory)).toBeFalsy();
    },
    {
      options: {
        config: {
          performance: {
            buildCache: {
              cacheDirectory: buildDirectory,
            },
          },
        },
      },
    },
  );
});
