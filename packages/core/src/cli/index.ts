import { BuilderPlugin, createBuilder } from '..';
import { setupProgram } from './commands';
import { getDefaultEntries, loadConfig } from './config';

export { defineConfig } from './config';

type RunCliOptions = {
  defaultPlugins?: BuilderPlugin[];
};

export async function runCli(options: RunCliOptions = {}) {
  const { provider, ...config } = await loadConfig();
  const builder = await createBuilder({
    provider,
    builderConfig: config,
    entry: config.source?.entries || getDefaultEntries(),
  });

  if (options.defaultPlugins) {
    builder.addPlugins(options.defaultPlugins);
  }

  if (config.builderPlugins) {
    builder.addPlugins(config.builderPlugins);
  }

  setupProgram(builder);
}
