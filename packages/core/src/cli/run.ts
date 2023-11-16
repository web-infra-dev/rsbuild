import { createRsbuild, type RsbuildPlugin } from '..';
import { setupProgram } from './commands';
import { loadConfig } from './config';

type RunCliOptions = {
  isRestart?: boolean;
};

export async function runCli(options: RunCliOptions = {}) {
  const config = await loadConfig();

  const rsbuild = await createRsbuild({
    rsbuildConfig: config,
    provider: config.provider,
  });

  if (!options.isRestart) {
    setupProgram(rsbuild);
  }

  return rsbuild;
}
