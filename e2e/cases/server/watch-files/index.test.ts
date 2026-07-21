import fs from 'node:fs';
import path from 'node:path';
import { test } from '@e2e/helper';
import { toPosixPath } from '@rstackjs/test-utils';

const watchedDir = path.join(import.meta.dirname, 'test-temp-assets');
const otherWatchedDir = path.join(import.meta.dirname, 'test-temp-other');
const watchedFile = path.join(watchedDir, 'example.txt');
const otherWatchedFile = path.join(otherWatchedDir, 'other.txt');

test.beforeEach(() => {
  fs.mkdirSync(watchedDir, { recursive: true });
  fs.mkdirSync(otherWatchedDir, { recursive: true });
  fs.writeFileSync(watchedFile, '');
  fs.writeFileSync(otherWatchedFile, '');
});

test.afterAll(() => {
  fs.rmSync(watchedDir, { force: true, recursive: true });
  fs.rmSync(otherWatchedDir, { force: true, recursive: true });
});

test('should work with string and path to file', async ({ dev, page }) => {
  await dev({
    config: {
      dev: {
        watchFiles: {
          paths: watchedFile,
        },
      },
    },
  });

  await Promise.all([page.waitForEvent('load'), fs.promises.writeFile(watchedFile, 'test')]);
});

test('should work with string and path to directory', async ({ dev, page }) => {
  await dev({
    config: {
      dev: {
        watchFiles: {
          paths: watchedDir,
        },
      },
    },
  });

  await Promise.all([page.waitForEvent('load'), fs.promises.writeFile(watchedFile, 'test')]);
});

test('should work with string array directory', async ({ dev, page }) => {
  await dev({
    config: {
      dev: {
        watchFiles: {
          paths: [watchedDir, otherWatchedDir],
        },
      },
    },
  });

  await Promise.all([page.waitForEvent('load'), fs.promises.writeFile(watchedFile, 'test')]);

  await Promise.all([page.waitForEvent('load'), fs.promises.writeFile(otherWatchedFile, 'test')]);
});

test('should work with string and glob', async ({ dev, page }) => {
  await dev({
    config: {
      dev: {
        watchFiles: {
          paths: toPosixPath(path.join(watchedDir, '**/*')),
        },
      },
    },
  });

  await Promise.all([page.waitForEvent('load'), fs.promises.writeFile(watchedFile, 'test')]);
});

test('should work with options', async ({ dev, page }) => {
  await dev({
    config: {
      dev: {
        watchFiles: {
          paths: watchedFile,
          options: {
            usePolling: true,
          },
        },
      },
    },
  });

  await Promise.all([page.waitForEvent('load'), fs.promises.writeFile(watchedFile, 'test')]);
});
