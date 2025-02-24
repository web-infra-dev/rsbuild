import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { dualPackage } from '@rsbuild/config/rslib.config.ts';
import { type RsbuildPlugin, logger } from '@rsbuild/core';
import { defineConfig } from '@rslib/core';
import { minify, transform } from '@swc/core';
import pkgJson from './package.json';

/**
 * Compile runtime code to ES5
 */
const pluginCompileRuntime: RsbuildPlugin = {
  name: 'rsbuild-plugin-compile-runtime',
  setup(api) {
    /**
     * transform `src/runtime/${filename}.ts`
     * to `dist/runtime/${filename}.js` and `dist/runtime/${filename}.min.js`
     */
    async function compileRuntimeFile(filename: string) {
      const sourceFilePath = path.join(
        api.context.rootPath,
        `src/runtime/${filename}.ts`,
      );

      const runtimeCode = await readFile(sourceFilePath, 'utf8');
      const distPath = path.join(
        api.context.distPath,
        'runtime',
        `${filename}.js`,
      );
      const distMinPath = path.join(
        api.context.distPath,
        'runtime',
        `${filename}.min.js`,
      );

      const { code } = await transform(runtimeCode, {
        jsc: {
          target: 'es5',
          parser: {
            syntax: 'typescript',
          },
        },
        // Output script file to be used in `<script>` tag
        isModule: false,
        sourceFileName: sourceFilePath,
      });

      const { code: minifiedRuntimeCode } = await minify(code, {
        ecma: 5,
        // allows SWC to mangle function names
        module: true,
      });

      await Promise.all([
        writeFile(distPath, code),
        writeFile(distMinPath, minifiedRuntimeCode),
      ]);
    }

    api.onAfterBuild(async () => {
      const startTime = performance.now();
      const runtimeDir = path.join(api.context.distPath, 'runtime');

      if (!existsSync(runtimeDir)) {
        await mkdir(runtimeDir);
      }

      await Promise.all([
        compileRuntimeFile('initialChunkRetry'),
        compileRuntimeFile('asyncChunkRetry'),
      ]);

      logger.success(
        `compiled assets retry runtime code in ${(
          performance.now() - startTime
        ).toFixed(1)} ms`,
      );
    });
  },
};

export default defineConfig({
  ...dualPackage,
  source: {
    define: {
      RSBUILD_VERSION: JSON.stringify(pkgJson.version.replace(/\./g, '-')),
    },
  },
  plugins: [pluginCompileRuntime],
});
