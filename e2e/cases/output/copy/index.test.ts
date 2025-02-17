import fs from 'node:fs';
import { join } from 'node:path';
import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should copy asset to dist folder correctly', async () => {
  await build({
    cwd: import.meta.dirname,
    rsbuildConfig: {
      output: {
        distPath: {
          root: 'dist-1',
        },
        copy: [{ from: '../../../assets' }],
      },
    },
  });

  expect(
    fs.existsSync(join(import.meta.dirname, 'dist-1/icon.png')),
  ).toBeTruthy();
});

test('should copy asset from src to dist folder correctly', async () => {
  await build({
    cwd: import.meta.dirname,
    rsbuildConfig: {
      output: {
        copy: [
          {
            from: '**/*.txt',
            to: 'assets',
            context: join(import.meta.dirname, 'src'),
          },
        ],
      },
    },
  });

  expect(
    fs.existsSync(join(import.meta.dirname, 'dist/assets/foo.txt')),
  ).toBeTruthy();
});

test('should copy asset to dist sub-folder correctly', async () => {
  await build({
    cwd: import.meta.dirname,
    rsbuildConfig: {
      output: {
        distPath: {
          root: 'dist-1',
        },
        copy: [{ from: '../../../assets', to: 'foo' }],
      },
    },
  });

  expect(
    fs.existsSync(join(import.meta.dirname, 'dist-1/foo/icon.png')),
  ).toBeTruthy();
});
