import { RsbuildPlugin, createRsbuild } from '..';
import { setupProgram } from './commands';
import { getDefaultEntries, loadConfig } from './config';

type RunCliOptions = {
  isRestart?: boolean;
  defaultPlugins?: RsbuildPlugin[];
};

export async function runCli(options: RunCliOptions = {}) {
  const config = await loadConfig();

  const rsbuild = await createRsbuild({
    rsbuildConfig: config,
    entry: config.source?.entries || getDefaultEntries(),
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
