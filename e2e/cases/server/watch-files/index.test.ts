import fs from 'node:fs';
import path from 'node:path';
import { test } from '@e2e/helper';

const watchedDir1 = path.join(import.meta.dirname, 'test-temp-1');
const watchedDir2 = path.join(import.meta.dirname, 'test-temp-2');
const watchedFile1 = path.join(watchedDir1, 'test.txt');
const watchedFile2 = path.join(watchedDir2, 'test.txt');
const addedFile = path.join(watchedDir1, 'added.txt');

test.beforeEach(() => {
  fs.mkdirSync(watchedDir1, { recursive: true });
  fs.mkdirSync(watchedDir2, { recursive: true });
  fs.writeFileSync(watchedFile1, '');
  fs.writeFileSync(watchedFile2, '');
  fs.rmSync(addedFile, { force: true });
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

test('should reload when a watched file is added, changed, or removed', async ({ dev, page }) => {
  await dev({
    config: {
      dev: {
        watchFiles: {
          paths: watchedDir1,
        },
      },
    },
  });

  await Promise.all([page.waitForEvent('load'), fs.promises.writeFile(addedFile, 'test')]);
  await Promise.all([page.waitForEvent('load'), fs.promises.writeFile(watchedFile1, 'test')]);
  await Promise.all([page.waitForEvent('load'), fs.promises.rm(addedFile)]);
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
          paths: 'test-temp-1/**/*',
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

test('should reload the page for selected events', async ({ dev, page }) => {
  await dev({
    config: {
      dev: {
        watchFiles: {
          paths: watchedDir1,
          events: ['add', 'unlink'],
        },
      },
    },
  });

  await Promise.all([page.waitForEvent('load'), fs.promises.writeFile(addedFile, 'test')]);
  await Promise.all([page.waitForEvent('load'), fs.promises.rm(addedFile)]);
});
