import path from 'path';
import { expect } from '@playwright/test';
import { webpackOnlyTest } from '@scripts/helper';
import { build } from '@scripts/shared';

webpackOnlyTest('should compile const enum correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      output: {
        polyfill: 'off',
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find((file) => /index\.\w+\.js/.test(file))!];

  expect(content.includes('console.log("fish is :",0)')).toBeTruthy();
});
