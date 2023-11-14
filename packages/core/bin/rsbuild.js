#!/usr/bin/env node
const { logger } = require('@rsbuild/shared/rslog');

function initNodeEnv() {
  if (!process.env.NODE_ENV) {
    const command = process.argv[2];
    process.env.NODE_ENV = ['build', 'preview'].includes(command)
      ? 'production'
      : 'development';
  }
}

async function main() {
  initNodeEnv();

  const { version } = require('../package.json');

  // If not called through a package manager,
  // output a blank line to keep the greet log nice.
  const { npm_execpath } = process.env;
  if (!npm_execpath || npm_execpath.includes('npx-cli.js')) {
    console.log();
  }

  logger.greet(`  ${`Rsbuild v${version}`}\n`);

  try {
    const { runCli } = require('@rsbuild/core/cli');
    await runCli();
  } catch (err) {
    logger.error(err);
  }
}

main();
