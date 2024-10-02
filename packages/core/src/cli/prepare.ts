import nodeModule from 'node:module';
import { logger } from '../logger';

function initNodeEnv() {
  if (!process.env.NODE_ENV) {
    const command = process.argv[2];
    process.env.NODE_ENV = ['build', 'preview'].includes(command)
      ? 'production'
      : 'development';
  }
}

export function prepareCli(): void {
  initNodeEnv();

  // @ts-expect-error enableCompileCache is not typed yet
  const { enableCompileCache } = nodeModule;
  if (enableCompileCache && !process.env.NODE_DISABLE_COMPILE_CACHE) {
    try {
      enableCompileCache();
    } catch {
      // ignore errors
    }
  }

  // Print a blank line to keep the greet log nice.
  // Some package managers automatically output a blank line, some do not.
  const { npm_execpath } = process.env;
  if (
    !npm_execpath ||
    npm_execpath.includes('npx-cli.js') ||
    npm_execpath.includes('.bun')
  ) {
    console.log();
  }

  logger.greet(`  ${`Rsbuild v${RSBUILD_VERSION}`}\n`);
}
