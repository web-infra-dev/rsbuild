import fs from 'node:fs';
import { createRequire } from 'node:module';
import { expect, test } from '@e2e/helper';
import { findFile, getFileContent } from '@rstackjs/test-utils';

const require = createRequire(import.meta.url);

test('should compile Node addons in ESM and CJS environments', async ({ build }) => {
  const rsbuild = await build();
  const files = rsbuild.getDistFiles();

  const esmAddonFile = findFile(files, 'esm/test.darwin.node');
  const cjsAddonFile = findFile(files, 'cjs/test.darwin.node');
  expect(fs.existsSync(esmAddonFile)).toBeTruthy();
  expect(fs.existsSync(cjsAddonFile)).toBeTruthy();

  expect(getFileContent(files, 'esm/index.js')).toContain('fileURLToPath');
  expect(getFileContent(files, 'cjs/index.cjs')).not.toContain('fileURLToPath');

  // the `test.darwin.node` is only compatible with darwin arm64
  if (process.platform === 'darwin' && process.arch === 'arm64') {
    const { addon: esmAddon } = await import('./dist/esm/index.js' as string);
    const { addon: cjsAddon } = require('./dist/cjs/index.cjs');
    expect(typeof esmAddon.readLength).toEqual('function');
    expect(typeof cjsAddon.readLength).toEqual('function');
  }
});
