// @ts-check
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { minify, transform } from '@swc/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * transform ../src/runtime/${filename}.ts
 *  to ../dist/runtime/${filename}.js
 * and ../dist/runtime/${filename}.min.js
 * @param {string} filename
 */
async function compileRuntimeFile(filename) {
  const sourceFilePath = path.join(__dirname, `../src/runtime/${filename}.ts`);

  const runtimeCode = await readFile(sourceFilePath, 'utf8');
  const distPath = path.join(__dirname, `../dist/runtime/${filename}.js`);
  const distMinPath = path.join(
    __dirname,
    `../dist/runtime/${filename}.min.js`,
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

async function compile() {
  const startTime = performance.now();

  const runtimeDir = path.join(__dirname, '../dist/runtime');
  if (!existsSync(runtimeDir)) {
    await mkdir(runtimeDir);
  }

  await Promise.all([
    compileRuntimeFile('initialChunkRetry'),
    compileRuntimeFile('asyncChunkRetry'),
  ]);

  console.log(
    `Compiled assets retry runtime code. Time cost: ${(
      performance.now() - startTime
    ).toFixed(2)}ms`,
  );
}

compile();
