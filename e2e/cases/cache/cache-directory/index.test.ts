import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@e2e/helper';
import fse from 'fs-extra';

test('should use `buildCache.cacheDirectory` as expected in dev', async ({
  dev,
}) => {
  const defaultDirectory = path.resolve(
    import.meta.dirname,
    './node_modules/.cache',
  );
  const cacheDirectory = path.resolve(
    import.meta.dirname,
    './node_modules/.cache2',
  );
  await fse.remove(defaultDirectory);
  await fse.remove(cacheDirectory);

  await dev({
    config: {
      performance: {
        buildCache: {
          cacheDirectory,
        },
      },
    },
  });

  expect(fs.existsSync(cacheDirectory)).toBeTruthy();
  expect(fs.existsSync(defaultDirectory)).toBeFalsy();
});

test('should use `buildCache.cacheDirectory` as expected in build', async ({
  build,
}) => {
  const defaultDirectory = path.resolve(
    import.meta.dirname,
    './node_modules/.cache',
  );
  const cacheDirectory = path.resolve(
    import.meta.dirname,
    './node_modules/.cache2',
  );
  await fse.remove(defaultDirectory);
  await fse.remove(cacheDirectory);

  await build({
    config: {
      performance: {
        buildCache: {
          cacheDirectory,
        },
      },
    },
  });

  expect(fs.existsSync(cacheDirectory)).toBeTruthy();
  expect(fs.existsSync(defaultDirectory)).toBeFalsy();
});
