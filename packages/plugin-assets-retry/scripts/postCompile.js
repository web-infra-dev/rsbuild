const path = require('node:path');
const { readFile, writeFile, mkdir } = require('node:fs/promises');
const { transformAsync } = require('@babel/core');
const { performance } = require('node:perf_hooks');

/**
 *
 * @param {string} filename
 * @param {string} output
 */
async function compileRuntimeFile(filename) {
  const sourceFilePath = path.join(__dirname, `../src/runtime/${filename}.ts`);

  const { minify } = await import('terser');
  const runtimeCode = await readFile(sourceFilePath, 'utf8');
  const distPath = path.join(__dirname, `../dist/runtime/${filename}.js`);
  const distMinPath = path.join(
    __dirname,
    `../dist/runtime/${filename}.min.js`,
  );
  const { code } = await transformAsync(runtimeCode, {
    presets: [
      '@babel/preset-typescript',
      [
        '@babel/preset-env',
        {
          targets:
            'iOS >= 9, Android >= 4.4, last 2 versions, > 0.2%, not dead',
        },
      ],
    ],
    filename: sourceFilePath,
  });
  const { code: minifiedRuntimeCode } = await minify(
    {
      [distPath]: code,
    },
    {
      ecma: 5,
    },
  );
  await Promise.all([
    writeFile(distPath, code),
    writeFile(distMinPath, minifiedRuntimeCode),
  ]);
}

async function compile() {
  const startTime = performance.now();
  await mkdir(path.join(__dirname, '../dist/runtime'));
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
