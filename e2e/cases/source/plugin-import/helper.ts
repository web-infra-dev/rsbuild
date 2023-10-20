import path from 'path';
import { build } from '@scripts/shared';
import { expect, test } from '@playwright/test';
import { fs } from '@rsbuild/shared/fs-extra';
import type { SharedTransformImport } from '@rsbuild/shared';
import { RsbuildConfig } from '@rsbuild/webpack';

export const cases: Parameters<typeof shareTest>[] = [
  [
    `camelCase test`,
    './src/camel.js',
    {
      libraryName: 'foo',
      libraryDirectory: 'lib',
      camelToDashComponentName: false,
    },
  ],
  [
    `kebab-case test`,
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

  throw new Error('unreacheable');
}

export function copyPkgToNodeModules() {
  const nodeModules = path.resolve(__dirname, 'node_modules');

  fs.ensureDirSync(nodeModules);
  fs.copySync(path.resolve(__dirname, 'foo'), path.resolve(nodeModules, 'foo'));
}

export function shareTest(
  msg: string,
  entry: string,
  transformImport: SharedTransformImport,
  otherConfigs: {
    plugins?: any[];
  } = {},
) {
  const setupConfig = {
    cwd: __dirname,
    entry: {
      index: entry,
    },
  };
  const config: RsbuildConfig = {
    source: {
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
    const files = await rsbuild.unwrapOutputJSON(false);
    expect(files[findEntry(files)]).toContain('transformImport test succeed');
  });
}
