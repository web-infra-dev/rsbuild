#!/usr/bin/env node
import nodeModule from 'node:module';

// enable on-disk code caching of all modules loaded by Node.js
// requires Nodejs >= 22.8.0
// @ts-expect-error enableCompileCache is not typed in `@types/node` 18.x
const { enableCompileCache } = nodeModule;
if (enableCompileCache && !process.env.NODE_DISABLE_COMPILE_CACHE) {
  try {
    enableCompileCache();
  } catch {
    // ignore errors
  }
}

async function main() {
  const { __internalHelper, logger } = await import('../dist/index.js');
  const { runCli, prepareCli } = __internalHelper;

  prepareCli();

  try {
    runCli();
  } catch (err) {
    logger.error(err);
  }
}

main();
