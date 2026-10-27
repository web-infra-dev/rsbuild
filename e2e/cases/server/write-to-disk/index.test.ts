import fs from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@e2e/helper';
import type { RsbuildPlugin } from '@rsbuild/core';
import { rs } from 'rstack/test';

test('should work with the default writeToDisk configuration', async ({
  page,
  dev,
}) => {
  await dev({
    config: {
      output: {
        distPath: 'dist-write-to-disk-default',
      },
    },
  });

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');
});

test('should work when writeToDisk is set to false', async ({ page, dev }) => {
  await dev({
    config: {
      output: {
        distPath: 'dist-write-to-disk-false',
      },
      dev: {
        writeToDisk: false,
      },
    },
  });

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');
});

test('should write only changed assets once when writeToDisk is true', async ({
  page,
  dev,
  copySrcDir,
  editFile,
  prepareDist,
}) => {
  const entry = join(await copySrcDir(), 'index.js');
  const distPath = await prepareDist('dist-write-to-disk');
  const jsPath = join(distPath, 'index.js');
  const stablePath = join(distPath, 'stable.txt');
  const writeFile = rs.spyOn(fs, 'writeFile');

  const countWrites = (filePath: string) =>
    writeFile.mock.calls.filter(([file]) => file === filePath).length;

  try {
    const rsbuild = await dev({
      config: {
        source: {
          entry: { index: entry },
        },
        output: {
          distPath: { root: distPath, js: '.' },
          filename: { js: '[name].js' },
        },
        dev: {
          writeToDisk: true,
          hmr: false,
          liveReload: false,
        },
        plugins: [
          {
            name: 'stable-asset',
            setup(api) {
              api.processAssets(
                { stage: 'additional' },
                ({ compilation, sources }) => {
                  compilation.emitAsset(
                    'stable.txt',
                    new sources.RawSource('unchanged asset'),
                  );
                },
              );
            },
          } satisfies RsbuildPlugin,
        ],
      },
    });

    await expect(page.locator('#test')).toHaveText('Hello Rsbuild!');
    expect(countWrites(jsPath)).toBe(1);
    expect(countWrites(stablePath)).toBe(1);
    expect(fs.readFileSync(jsPath, 'utf8')).toContain('Hello Rsbuild!');
    expect(fs.readFileSync(stablePath, 'utf8')).toBe('unchanged asset');

    writeFile.mockClear();
    const recompiled = new Promise<void>((resolve) => {
      rsbuild.instance.onAfterDevCompile(() => resolve());
    });
    await editFile(entry, (code) =>
      code.replace('Hello Rsbuild!', 'Hello Rsbuild 2!'),
    );
    await recompiled;

    expect(countWrites(jsPath)).toBe(1);
    expect(countWrites(stablePath)).toBe(0);
    expect(fs.readFileSync(jsPath, 'utf8')).toContain('Hello Rsbuild 2!');
    expect(fs.readFileSync(stablePath, 'utf8')).toBe('unchanged asset');
  } finally {
    writeFile.mockRestore();
  }
});
