import fs from 'node:fs';
import path from 'node:path';
import { test } from '@e2e/helper';

const watchedFile = path.join(import.meta.dirname, 'test-temp-example.txt');
const otherWatchedFile = path.join(import.meta.dirname, 'test-temp-other.txt');

test.beforeEach(() => {
  fs.writeFileSync(watchedFile, '');
  fs.writeFileSync(otherWatchedFile, '');
});

test.afterAll(() => {
  fs.rmSync(watchedFile, { force: true });
  fs.rmSync(otherWatchedFile, { force: true });
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

  await fs.promises.writeFile(watchedFile, 'test');
  // check the page is reloaded
  await new Promise((resolve) => {
    page.waitForURL(page.url()).then(resolve);
  });
});

test('should work with string and path to directory', async ({ dev, page }) => {
  await dev({
    config: {
      dev: {
        watchFiles: {
          paths: import.meta.dirname,
        },
      },
    },
  });

  await fs.promises.writeFile(watchedFile, 'test');

  await new Promise((resolve) => {
    page.waitForURL(page.url()).then(resolve);
  });
});

test('should work with string array paths', async ({ dev, page }) => {
  await dev({
    config: {
      dev: {
        watchFiles: {
          paths: [watchedFile, otherWatchedFile],
        },
      },
    },
  });

  await fs.promises.writeFile(watchedFile, 'test');
  // check the page is reloaded
  await new Promise((resolve) => {
    page.waitForURL(page.url()).then(resolve);
  });

  await fs.promises.writeFile(otherWatchedFile, 'test');
  // check the page is reloaded
  await new Promise((resolve) => {
    page.waitForURL(page.url()).then(resolve);
  });
});

test('should work with string and glob', async ({ dev, page }) => {
  await dev({
    config: {
      dev: {
        watchFiles: {
          paths: `${import.meta.dirname}/test-temp-*`,
        },
      },
    },
  });

  await fs.promises.writeFile(watchedFile, 'test');
  // check the page is reloaded
  await new Promise((resolve) => {
    page.waitForURL(page.url()).then(resolve);
  });
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

  await fs.promises.writeFile(watchedFile, 'test');
  // check the page is reloaded
  await new Promise((resolve) => {
    page.waitForURL(page.url()).then(resolve);
  });
});
