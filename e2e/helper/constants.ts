import { join } from 'node:path';

export const BUILD_END_LOG = 'built in';

export const RSBUILD_BIN_PATH = join(
  __dirname,
  '../node_modules/@rsbuild/core/bin/rsbuild.js',
);

export const CREATE_RSBUILD_BIN_PATH = join(
  __dirname,
  '../node_modules/create-rsbuild/bin.js',
);
