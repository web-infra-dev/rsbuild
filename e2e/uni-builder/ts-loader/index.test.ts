import path from 'path';
import { expect } from '@playwright/test';
import { webpackOnlyTest } from '@scripts/helper';
import { build } from '@scripts/shared';

webpackOnlyTest('build pass with default ts-loader options', async () => {
  const rsbuild = await build<'webpack'>({
    cwd: __dirname,
    rsbuildConfig: {
      tools: {
        tsLoader: {},
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();

  const output =
    files[Object.keys(files).find((file) => /index\.\w+\.js/.test(file))!];
  expect(output).toBeTruthy();
});
