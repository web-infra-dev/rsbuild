import path from 'node:path';
import type { RstestConfig } from 'rstack/test';

export const baseConfig: RstestConfig = {
  env: {
    FORCE_COLOR: '0',
  },
  globals: true,
  output: {
    externals: ['@rsbuild/core'],
  },
  restoreMocks: true,
  setupFiles: [path.join(import.meta.dirname, 'rstest.setup.ts')],
  unstubEnvs: true,
};
