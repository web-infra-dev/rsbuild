import fs from 'node:fs';
import path from 'node:path';
import type { RsbuildPlugin } from '@rsbuild/core';
import { type LibConfig, defineConfig } from '@rslib/core';

export const commonExternals: Array<string | RegExp> = [
  'webpack',
  /[\\/]compiled[\\/]/,
];

// Clean tsc cache to ensure the dts files can be generated correctly
export const pluginCleanTscCache: RsbuildPlugin = {
  name: 'plugin-clean-tsc-cache',
  setup(api) {
    api.onBeforeBuild(() => {
      const tsbuildinfo = path.join(
        api.context.rootPath,
        'tsconfig.tsbuildinfo',
      );
      if (fs.existsSync(tsbuildinfo)) {
        fs.rmSync(tsbuildinfo);
      }
    });
  },
};

export const esmConfig: LibConfig = {
  format: 'esm',
  syntax: 'es2021',
  dts: {
    build: true,
  },
  plugins: [pluginCleanTscCache],
};

export const cjsConfig: LibConfig = {
  format: 'cjs',
  syntax: 'es2021',
};

export const dualPackage = defineConfig({
  lib: [esmConfig, cjsConfig],
  output: {
    target: 'node',
  },
  tools: {
    rspack: {
      externals: commonExternals,
    },
  },
});
