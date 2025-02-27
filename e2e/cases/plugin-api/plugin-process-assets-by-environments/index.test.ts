import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';
import type { RsbuildPluginAPI } from '@rsbuild/core';

rspackOnlyTest(
  'should allow plugin to process assets by environments',
  async () => {
    const rsbuild = await build({
      cwd: __dirname,
    });

    expect(existsSync(join(rsbuild.distPath, 'static/index.js'))).toBeFalsy();
    expect(existsSync(join(rsbuild.distPath, 'server/index.js'))).toBeTruthy();
  },
);

rspackOnlyTest('should filter environments correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    plugins: [
      {
        name: 'my-plugin-node',
        setup(api: RsbuildPluginAPI) {
          api.processAssets(
            { stage: 'summarize', environments: ['node'] },
            ({ assets, compilation }) => {
              for (const key of Object.keys(assets)) {
                if (key.endsWith('.js')) {
                  compilation.deleteAsset(key);
                }
              }
            },
          );
        },
      },
    ],
  });

  expect(existsSync(join(rsbuild.distPath, 'static/index.js'))).toBeFalsy();
  expect(existsSync(join(rsbuild.distPath, 'server/index.js'))).toBeFalsy();
});
