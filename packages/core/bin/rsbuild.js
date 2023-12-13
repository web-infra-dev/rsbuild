#!/usr/bin/env node
const { prepareCli } = require('../dist/cli/prepare');

async function main() {
  prepareCli();

  try {
    const { runCli } = require('../dist/cli/commands');
    runCli();
  } catch (err) {
    const { logger } = require('@rsbuild/shared/rslog');
    logger.error(err);
  }
}

main();
