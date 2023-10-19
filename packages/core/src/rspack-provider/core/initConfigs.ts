import {
  debug,
  isDebug,
  initPlugins,
  mergeRsbuildConfig,
  type PluginStore,
  type InspectConfigOptions,
  type CreateRsbuildOptions,
} from '@rsbuild/shared';
import { inspectConfig } from './inspectConfig';
import { generateRspackConfig } from './rspackConfig';
import { normalizeConfig } from '../config/normalize';
import type { Context } from '../types';

async function modifyRsbuildConfig(context: Context) {
  debug('modify builder config');
  const [modified] = await context.hooks.modifyRsbuildConfigHook.call(
    context.config,
    { mergeRsbuildConfig },
  );
  context.config = modified;

  debug('modify builder config done');
}

export type InitConfigsOptions = {
  context: Context;
  pluginStore: PluginStore;
  builderOptions: Required<CreateRsbuildOptions>;
};

export async function initConfigs({
  context,
  pluginStore,
  builderOptions,
}: InitConfigsOptions) {
  const { ensureArray } = await import('@modern-js/utils');

  await context.configValidatingTask;
  await initPlugins({
    pluginAPI: context.pluginAPI,
    pluginStore,
  });

  await modifyRsbuildConfig(context);
  context.normalizedConfig = normalizeConfig(context.config);

  const targets = ensureArray(builderOptions.target);
  const rspackConfigs = await Promise.all(
    targets.map((target) => generateRspackConfig({ target, context })),
  );

  // write builder config and Rspack config to disk in debug mode
  if (isDebug()) {
    const inspect = () => {
      const inspectOptions: InspectConfigOptions = {
        verbose: true,
        writeToDisk: true,
      };
      inspectConfig({
        context,
        pluginStore,
        inspectOptions,
        builderOptions,
        bundlerConfigs: rspackConfigs,
      });
    };

    // run inspect later to avoid cleaned by cleanOutput plugin
    context.hooks.onBeforeBuildHook.tap(inspect);
    context.hooks.onBeforeStartDevServerHook.tap(inspect);
  }

  return {
    rspackConfigs,
  };
}
