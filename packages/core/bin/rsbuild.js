#!/usr/bin/env node
const { prepareCli } = require('../dist/cli/prepare');

async function main() {
  prepareCli();
  try {
    const { runCli } = require('../dist/cli/commands');
    runCli();
  } catch (err) {
    logger.error(err);
  }
}

main();
