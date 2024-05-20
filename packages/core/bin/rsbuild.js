#!/usr/bin/env node
import { logger } from '@rsbuild/shared';
import { __internalHelper } from '../dist/index.js';

const { runCli, prepareCli } = __internalHelper;

async function main() {
  prepareCli();

  try {
    runCli();
  } catch (err) {
    logger.error(err);
  }
}

main();
