import path from 'node:path';
import type { RstestConfig } from 'rstack/test';

process.env.NO_COLOR = '1';

export const baseConfig: RstestConfig = {
  globals: true,
  output: {
    externals: ['@rsbuild/core'],
  },
  restoreMocks: true,
  setupFiles: [path.join(import.meta.dirname, 'rstest.setup.ts')],
  unstubEnvs: true,
};
