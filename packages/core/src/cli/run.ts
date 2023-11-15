import { createRsbuild, type RsbuildPlugin } from '..';
import { setupProgram } from './commands';
import { loadConfig } from './config';

type RunCliOptions = {
  isRestart?: boolean;
  defaultPlugins?: RsbuildPlugin[];
};

export async function runCli(options: RunCliOptions = {}) {
  const config = await loadConfig();

  const rsbuild = await createRsbuild({
    rsbuildConfig: config,
    provider: config.provider,
  });

  if (options.defaultPlugins) {
    rsbuild.addPlugins(options.defaultPlugins);
  }

  if (config.plugins) {
    rsbuild.addPlugins(config.plugins);
  }

  if (!options.isRestart) {
    setupProgram(rsbuild);
  }

  return rsbuild;
}
