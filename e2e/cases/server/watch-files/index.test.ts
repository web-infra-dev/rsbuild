import fs from 'node:fs';
import path from 'node:path';
import { test } from '@e2e/helper';
import { toPosixPath } from '@rstackjs/test-utils';

const watchedDir1 = path.join(import.meta.dirname, 'test-temp-1');
const watchedDir2 = path.join(import.meta.dirname, 'test-temp-2');
const watchedFile1 = path.join(watchedDir1, 'test.txt');
const watchedFile2 = path.join(watchedDir2, 'test.txt');

test.beforeEach(() => {
  fs.mkdirSync(watchedDir1, { recursive: true });
  fs.mkdirSync(watchedDir2, { recursive: true });
  fs.writeFileSync(watchedFile1, '');
  fs.writeFileSync(watchedFile2, '');
});

test.afterAll(() => {
  fs.rmSync(watchedDir1, { force: true, recursive: true });
  fs.rmSync(watchedDir2, { force: true, recursive: true });
});

test('should work with string and path to file', async ({ dev, page }) => {
  await dev({
    config: {
      dev: {
        watchFiles: {
          paths: watchedFile1,
        },
      },
    },
  });

  await Promise.all([page.waitForEvent('load'), fs.promises.writeFile(watchedFile1, 'test')]);
});

test('should work with string and path to directory', async ({ dev, page }) => {
  await dev({
    config: {
      dev: {
        watchFiles: {
          paths: watchedDir1,
        },
      },
    },
  });

  await Promise.all([page.waitForEvent('load'), fs.promises.writeFile(watchedFile1, 'test')]);
});

test('should work with string array directory', async ({ dev, page }) => {
  await dev({
    config: {
      dev: {
        watchFiles: {
          paths: [watchedDir1, watchedDir2],
        },
      },
    },
  });

  await Promise.all([page.waitForEvent('load'), fs.promises.writeFile(watchedFile1, 'test')]);

  await Promise.all([page.waitForEvent('load'), fs.promises.writeFile(watchedFile2, 'test')]);
});

test('should work with string and glob', async ({ dev, page }) => {
  await dev({
    config: {
      dev: {
        watchFiles: {
          paths: toPosixPath(path.join(watchedDir1, '**/*')),
        },
      },
    },
  });

  await Promise.all([page.waitForEvent('load'), fs.promises.writeFile(watchedFile1, 'test')]);
});

test('should work with options', async ({ dev, page }) => {
  await dev({
    config: {
      dev: {
        watchFiles: {
          paths: watchedFile1,
          options: {
            usePolling: true,
          },
        },
      },
    },
  });

  await Promise.all([page.waitForEvent('load'), fs.promises.writeFile(watchedFile1, 'test')]);
});
