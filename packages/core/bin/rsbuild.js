#!/usr/bin/env node
const { logger } = require('rslog');

async function main() {
  const { version } = require('../package.json');
  logger.greet(`  ${`Rsbuild v${version}`}\n`);

  try {
    const { runCli } = require('@rsbuild/core/cli');
    await runCli();
  } catch (err) {
    logger.error(err);
  }
}

main();
