import path from 'path';
import { expect } from '@playwright/test';
import { build } from '@scripts/shared';
import { webpackOnlyTest } from '@scripts/helper';

// TODO: needs rspack exportsPresence error
webpackOnlyTest(
  'should throw error by default(exportsPresence error)',
  async () => {
    await expect(
      build({
        cwd: __dirname,
        entry: {
          index: path.resolve(__dirname, './src/index.js'),
        },
      }),
    ).rejects.toThrowError();
  },
);
