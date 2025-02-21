import fs from 'node:fs';
import { join } from 'node:path';
import { dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';

const cwd = __dirname;

test('multiple environments writeToDisk should work correctly', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd,
    page,
    rsbuildConfig: {
      dev: {
        writeToDisk: true,
      },
      environments: {
        web: {
          output: {
            distPath: {
              root: 'dist',
            },
          },
          dev: {
            writeToDisk: false,
          },
        },
        web1: {
          output: {
            distPath: {
              root: 'dist-1',
            },
          },
          dev: {
            writeToDisk: true,
          },
        },
        web2: {
          output: {
            distPath: {
              root: 'dist-2',
            },
          },
        },
      },
    },
  });

  const test = page.locator('#test');
  await expect(test).toHaveText('Hello Rsbuild!');

  expect(fs.existsSync(join(cwd, 'dist/index.html'))).toBeFalsy();
  expect(fs.existsSync(join(cwd, 'dist-1/index.html'))).toBeTruthy();
  expect(fs.existsSync(join(cwd, 'dist-2/index.html'))).toBeTruthy();

  await rsbuild.close();
});

test('should writeToDisk correctly when environment writeToDisk configuration same', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd,
    page,
    rsbuildConfig: {
      dev: {
        writeToDisk: false,
      },
      environments: {
        web: {
          output: {
            distPath: {
              root: 'dist-same',
            },
          },
          dev: {
            writeToDisk: true,
          },
        },
        web1: {
          output: {
            distPath: {
              root: 'dist-same-1',
            },
          },
          dev: {
            writeToDisk: true,
          },
        },
      },
    },
  });

  const test = page.locator('#test');
  await expect(test).toHaveText('Hello Rsbuild!');

  expect(fs.existsSync(join(cwd, 'dist-same/index.html'))).toBeTruthy();
  expect(fs.existsSync(join(cwd, 'dist-same-1/index.html'))).toBeTruthy();

  await rsbuild.close();
});
