import { logger } from '../logger';
import { setupCommands } from './commands';
import { prepareCli } from './prepare';

export async function runCLI(): Promise<void> {
  prepareCli();

  try {
    setupCommands();
  } catch (err) {
    logger.error('Failed to start Rsbuild CLI.');
    logger.error(err);
  }
}
