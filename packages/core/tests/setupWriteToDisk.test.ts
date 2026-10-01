import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Compiler } from '@rspack/core';
import { defaultLogger } from '../src/logger';
import { setupWriteToDisk } from '../src/server/assets-middleware/setupWriteToDisk';

type AssetEmittedTap = (
  file: string,
  info: unknown,
  callback: (err?: Error) => void,
) => void;

/**
 * A minimal compiler that writes to a non-native output file system,
 * like the dev server's memory fs, and emits assets through the
 * `emit` and `assetEmitted` hooks.
 */
const createCompiler = () => {
  const emitTaps: (() => void)[] = [];
  const assetEmittedTaps: AssetEmittedTap[] = [];
  const compiler = {
    options: {},
    outputFileSystem: {},
    hooks: {
      emit: { tap: (_: string, fn: () => void) => emitTaps.push(fn) },
      assetEmitted: {
        tapAsync: (_: string, fn: AssetEmittedTap) => assetEmittedTaps.push(fn),
      },
    },
  } as unknown as Compiler;

  /** Emit one asset and return how many times its content was read. */
  const emitAsset = async (targetPath: string) => {
    let contentReads = 0;
    const info = {
      targetPath,
      get content() {
        contentReads++;
        return Buffer.from('content');
      },
    };

    for (const tap of emitTaps) {
      tap();
    }
    for (const tap of assetEmittedTaps) {
      await new Promise<void>((resolve, reject) => {
        tap(targetPath, info, (err) => (err ? reject(err) : resolve()));
      });
    }
    return contentReads;
  };

  return { compiler, emitAsset };
};

let distDir: string;

beforeEach(() => {
  distDir = mkdtempSync(join(tmpdir(), 'rsbuild-write-to-disk-'));
});

afterEach(() => {
  rmSync(distDir, { recursive: true, force: true });
});

test('should read asset content only after writeToDisk accepts the file', async () => {
  const { compiler, emitAsset } = createCompiler();
  setupWriteToDisk(
    [compiler],
    [(filePath) => filePath.endsWith('.html')],
    defaultLogger,
  );

  expect(await emitAsset(join(distDir, 'index.js'))).toBe(0);
  expect(await emitAsset(join(distDir, 'index.html'))).toBe(1);
  expect(readFileSync(join(distDir, 'index.html'), 'utf8')).toBe('content');
});

test('should skip assets of environments that disable writeToDisk', async () => {
  const web = createCompiler();
  const node = createCompiler();
  setupWriteToDisk([web.compiler, node.compiler], [false, true], defaultLogger);

  expect(await web.emitAsset(join(distDir, 'web.js'))).toBe(0);
  expect(await node.emitAsset(join(distDir, 'node.js'))).toBe(1);
});
