import { RsbuildPlugin, createRsbuild } from '..';
import { setupProgram } from './commands';
import { getDefaultEntries, loadConfig } from './config';

export { defineConfig } from './config';

type RunCliOptions = {
  defaultPlugins?: RsbuildPlugin[];
};

export async function runCli(options: RunCliOptions = {}) {
  const config = await loadConfig();
  const rsbuild = await createRsbuild({
    rsbuildConfig: config,
    entry: config.source?.entries || getDefaultEntries(),
  });

  if (options.defaultPlugins) {
    rsbuild.addPlugins(options.defaultPlugins);
  }

  if (config.plugins) {
    rsbuild.addPlugins(config.plugins);
  }

  setupProgram(rsbuild);
}
