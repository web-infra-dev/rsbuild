import fs from 'node:fs';
import path from 'node:path';
import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import type { RsbuildConfig, TransformImport } from '@rsbuild/core';
import fse from 'fs-extra';

export const cases: Parameters<typeof shareTest>[] = [
  [
    'camelCase test',
    './src/camel.js',
    {
      libraryName: 'foo',
      libraryDirectory: 'lib',
      camelToDashComponentName: false,
    },
  ],
  [
    'kebab-case test',
    './src/kebab.js',
    {
      libraryName: 'foo',
      libraryDirectory: 'lib',
      camelToDashComponentName: true,
    },
  ],
  [
    'transform to named import',
    './src/named.js',
    {
      libraryName: 'foo',
      libraryDirectory: 'lib',
      camelToDashComponentName: true,
      transformToDefaultImport: false,
    },
  ],
];

export function findEntry(
  files: Record<string, string>,
  name = 'index',
): string {
  for (const key of Reflect.ownKeys(files) as string[]) {
    if (key.includes(`dist/static/js/${name}`) && key.endsWith('.js')) {
      return key;
    }
  }

  throw new Error('unreachable');
}

export function copyPkgToNodeModules() {
  const nodeModules = path.resolve(__dirname, 'node_modules');

  fse.ensureDirSync(nodeModules);
  fs.cpSync(path.resolve(__dirname, 'foo'), path.resolve(nodeModules, 'foo'), {
    recursive: true,
  });
}

export function shareTest(
  msg: string,
  entry: string,
  transformImport: TransformImport,
  otherConfigs: {
    plugins?: any[];
  } = {},
) {
  const setupConfig = {
    cwd: __dirname,
  };
  const config: RsbuildConfig = {
    source: {
      entry: {
        index: entry,
      },
      transformImport: [transformImport],
    },
    performance: {
      chunkSplit: {
        strategy: 'all-in-one',
      },
    },
  };

  test(msg, async () => {
    const rsbuild = await build({
      ...setupConfig,
      ...otherConfigs,
      rsbuildConfig: { ...config },
    });
    const files = await rsbuild.getDistFiles({ sourceMaps: true });
    expect(files[findEntry(files)]).toContain('transformImport test succeed');
  });
}
