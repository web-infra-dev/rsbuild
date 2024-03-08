import { expect, test } from '@playwright/test';
import { build } from '@e2e/helper';
import { join } from 'node:path';
import { fse } from '@rsbuild/shared';

test('should compile Node addons correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });
  const files = await rsbuild.unwrapOutputJSON();
  const addonFile = Object.keys(files).find((file) => file.endsWith('a.node'));

  expect(addonFile?.includes('server/a.node')).toBeTruthy();

  expect(
    fse.existsSync(join(__dirname, 'dist', 'server', 'a.node')),
  ).toBeTruthy();

  if (process.platform === 'darwin') {
    const content = await import('./dist/server/index.js');
    expect(typeof content.default.readLength).toEqual('function');
  }
});
