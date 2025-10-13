import fs from 'node:fs';
import { join } from 'node:path';

import { expect, test } from '@e2e/helper';
import type { RsbuildPlugin } from '@rsbuild/core';

test('should copy asset to dist folder correctly', async ({ build }) => {
  await build({
    config: {
      output: {
        distPath: 'dist-1',
        copy: [{ from: '../../../assets' }],
      },
    },
  });

  expect(fs.existsSync(join(__dirname, 'dist-1/icon.png'))).toBeTruthy();
});

test('should copy asset from src to dist folder correctly', async ({
  build,
}) => {
  await build({
    config: {
      output: {
        copy: [
          { from: '**/*.txt', to: 'assets', context: join(__dirname, 'src') },
        ],
      },
    },
  });

  expect(fs.existsSync(join(__dirname, 'dist/assets/foo.txt'))).toBeTruthy();
});

test('should copy asset to dist sub-folder correctly', async ({ build }) => {
  await build({
    config: {
      output: {
        distPath: 'dist-1',
        copy: [{ from: '../../../assets', to: 'foo' }],
      },
    },
  });

  expect(fs.existsSync(join(__dirname, 'dist-1/foo/icon.png'))).toBeTruthy();
});

test('should merge copy config correctly', async ({ build }) => {
  const rsbuildPlugin = (): RsbuildPlugin => ({
    name: 'example',
    setup(api) {
      api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
        return mergeRsbuildConfig(config, {
          output: {
            copy: {
              patterns: [
                {
                  from: '../../../assets/icon.png',
                },
              ],
            },
          },
        });
      });
    },
  });

  const rsbuildPlugin2 = (): RsbuildPlugin => ({
    name: 'example2',
    setup(api) {
      api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
        return mergeRsbuildConfig(config, {
          output: {
            copy: [
              {
                from: '../../../assets/image.png',
              },
            ],
          },
        });
      });
    },
  });

  await build({
    config: {
      output: {
        distPath: 'dist-4',
      },
      plugins: [rsbuildPlugin(), rsbuildPlugin2()],
    },
  });

  expect(fs.existsSync(join(__dirname, 'dist-4/icon.png'))).toBeTruthy();
  expect(fs.existsSync(join(__dirname, 'dist-4/image.png'))).toBeTruthy();
});
