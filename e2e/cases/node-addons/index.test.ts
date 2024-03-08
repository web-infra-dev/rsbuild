import fs from 'node:fs';
import { expect, test } from '@playwright/test';
import { build } from '@e2e/helper';
import { join } from 'node:path';

test('should compile Node addons correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });
  const files = await rsbuild.unwrapOutputJSON();
  const addonFile = Object.keys(files).find((file) => file.endsWith('a.node'));

  expect(addonFile?.includes('server/a.node')).toBeTruthy();

  expect(
    fs.existsSync(join(__dirname, 'dist', 'server', 'a.node')),
  ).toBeTruthy();

  const content = await import('./dist/server/index.js');
  expect(typeof content.default.readLength).toEqual('function');
});
