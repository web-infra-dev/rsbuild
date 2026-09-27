import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rspack } from '@rspack/core';
import { logger } from '../src';
import { setupWriteToDisk } from '../src/server/assets-middleware/setupWriteToDisk';
import type { Rspack } from '../src/types';

test('should not write assets again when the compiler writes to disk', async () => {
  const compiler = rspack({});
  const root = mkdtempSync(join(tmpdir(), 'rsbuild-write-to-disk-'));
  const targetPath = join(root, 'index.js');

  setupWriteToDisk([compiler], true, logger);
  await compiler.hooks.emit.promise({} as Rspack.Compilation);
  await compiler.hooks.assetEmitted.promise('index.js', {
    targetPath,
    content: Buffer.from('test'),
  } as Parameters<typeof compiler.hooks.assetEmitted.promise>[1]);

  expect(existsSync(targetPath)).toBe(false);
});
