#!/usr/bin/env node
import nodeModule from 'node:module';

// enable on-disk code caching of all modules loaded by Node.js
// requires Nodejs >= 22.8.0
const { enableCompileCache } = nodeModule;
// Skip CI, where builds typically run once and cannot reuse the cache.
if (enableCompileCache && !process.env.CI) {
  try {
    enableCompileCache();
  } catch {
    // ignore errors
  }
}

async function main() {
  const { runCLI } = await import('../dist/index.js');
  runCLI();
}

main();
