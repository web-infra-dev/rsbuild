import { join } from 'path';
import type { TaskConfig } from './types';

export const ROOT_DIR = join(__dirname, '..', '..', '..');
export const PACKAGES_DIR = join(ROOT_DIR, 'packages');
export const DIST_DIR = 'compiled';

export const DEFAULT_EXTERNALS = {
  // External caniuse-lite data, so users can update it manually.
  'caniuse-lite': 'caniuse-lite',
  '/^caniuse-lite(/.*)/': 'caniuse-lite$1',
  // External webpack, it's hard to bundle.
  webpack: 'webpack',
  '/^webpack(/.*)/': 'webpack$1',
  // External lodash because lots of packages will depend on it.
  lodash: 'lodash',
  '/^lodash(/.*)/': 'lodash$1',
  esbuild: 'esbuild',
  // ncc bundled wrong package.json, using external to avoid this problem
  './package.json': './package.json',
  '../package.json': './package.json',
  '../../package.json': './package.json',
  postcss: 'postcss',
  '@babel/core': '@babel/core',
};

export const TASKS: TaskConfig[] = [
  {
    packageDir: 'core',
    packageName: '@rsbuild/core',
    dependencies: [],
  },
  {
    packageDir: 'shared',
    packageName: '@rsbuild/shared',
    dependencies: ['deepmerge'],
  },
];
