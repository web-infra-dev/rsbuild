#!/usr/bin/env node
import nodeModule from 'node:module';

// enable on-disk code caching of all modules loaded by Node.js
// requires Nodejs >= 22.8.0
const { enableCompileCache } = nodeModule;
if (enableCompileCache) {
  try {
    enableCompileCache();
  } catch {
    // ignore errors
  }
}

function checkNodeVersion() {
  const { node, bun, deno } = process.versions;
  if (!node || bun || deno) {
    return;
  }
  if (Number(node.split('.')[0]) < 20) {
    throw new Error(
      `Unsupported Node.js version "${node}", Rsbuild requires Node.js 20+.`,
    );
  }
}

async function main() {
  checkNodeVersion();
  const { runCLI } = await import('../dist/index.js');
  runCLI();
}

main();
