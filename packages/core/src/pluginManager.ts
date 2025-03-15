import { color, isFunction } from './helpers';
import { logger } from './logger';
import type {
  BundlerPluginInstance,
  Falsy,
  PluginManager,
  PluginMeta,
  RsbuildPlugin,
  RsbuildPluginAPI,
} from './types';

function validatePlugin(plugin: unknown) {
  const type = typeof plugin;

  if (type !== 'object' || plugin === null) {
    throw new Error(
      `[rsbuild:plugin] Expect Rsbuild plugin instance to be an object, but got ${type}.`,
    );
  }

  if (isFunction((plugin as RsbuildPlugin).setup)) {
    return;
  }

  if (isFunction((plugin as BundlerPluginInstance).apply)) {
    const { name = 'SomeWebpackPlugin' } =
      (plugin as BundlerPluginInstance).constructor || {};

    const messages = [
      `${color.yellow(
        name,
      )} looks like a webpack or Rspack plugin, please use ${color.yellow(
        '`tools.rspack`',
      )} to register it:`,
      color.green(`
  // rsbuild.config.ts
  export default {
    tools: {
      rspack: {
        plugins: [new ${name}()]
      }
    }
  };
`),
    ];

    throw new Error(messages.join('\n'));
  }

  throw new Error(
    `[rsbuild:plugin] Expect the setup function of Rsbuild plugin to be a function, but got ${type}.`,
  );
}

export const RSBUILD_ALL_ENVIRONMENT_SYMBOL = 'RSBUILD_ALL_ENVIRONMENT_SYMBOL';

export const isPluginMatchEnvironment = (
  pluginEnvironment: string,
  currentEnvironment: string,
): boolean =>
  pluginEnvironment === currentEnvironment ||
  pluginEnvironment === RSBUILD_ALL_ENVIRONMENT_SYMBOL;

export function createPluginManager(): PluginManager {
  let plugins: PluginMeta[] = [];

  const addPlugins = (
    newPlugins: Array<RsbuildPlugin | Falsy>,
    options?: { before?: string; environment?: string },
  ) => {
    const { before, environment = RSBUILD_ALL_ENVIRONMENT_SYMBOL } =
      options || {};

    for (const newPlugin of newPlugins) {
      if (!newPlugin) {
        continue;
      }

      validatePlugin(newPlugin);

      if (before) {
        const index = plugins.findIndex(
          (item) => item.instance.name === before,
        );
        if (index === -1) {
          logger.warn(`Plugin "${before}" does not exist.`);
          plugins.push({
            environment,
            instance: newPlugin,
          });
        } else {
          plugins.splice(index, 0, {
            environment,
            instance: newPlugin,
          });
        }
      } else {
        plugins.push({
          environment,
          instance: newPlugin,
        });
      }
    }
  };

  const removePlugins = (
    pluginNames: string[],
    options: { environment?: string } = {},
  ) => {
    plugins = plugins.filter(
      (plugin) =>
        !(
          pluginNames.includes(plugin.instance.name) &&
          (!options.environment || plugin.environment === options.environment)
        ),
    );
  };

  const isPluginExists = (
    pluginName: string,
    options: { environment: string } = {
      environment: RSBUILD_ALL_ENVIRONMENT_SYMBOL,
    },
  ) =>
    Boolean(
      plugins.find(
        (plugin) =>
          plugin.instance.name === pluginName &&
          isPluginMatchEnvironment(plugin.environment, options.environment),
      ),
    );

  const getPlugins = (
    options: { environment: string } = {
      environment: RSBUILD_ALL_ENVIRONMENT_SYMBOL,
    },
  ) => {
    return plugins
      .filter((p) =>
        isPluginMatchEnvironment(p.environment, options.environment),
      )
      .map((p) => p.instance);
  };
  return {
    getPlugins,
    getAllPluginsWithMeta: () => plugins,
    addPlugins,
    removePlugins,
    isPluginExists,
  };
}

export const pluginDagSort = (plugins: PluginMeta[]): PluginMeta[] => {
  let allLines: [string, string][] = [];

  function getPlugin(name: string) {
    const targets = plugins.filter((item) => item.instance.name === name);
    if (!targets.length) {
      throw new Error(`[rsbuild:plugin] Plugin "${name}" not existed`);
    }
    return targets;
  }

  for (const plugin of plugins) {
    if (plugin.instance.pre) {
      for (const pre of plugin.instance.pre) {
        if (pre && plugins.some((item) => item.instance.name === pre)) {
          allLines.push([pre, plugin.instance.name]);
        }
      }
    }

    if (plugin.instance.post) {
      for (const post of plugin.instance.post) {
        if (post && plugins.some((item) => item.instance.name === post)) {
          allLines.push([plugin.instance.name, post]);
        }
      }
    }
  }

  // search the zero input plugin
  let zeroEndPoints = plugins.filter(
    (item) => !allLines.find((l) => l[1] === item.instance.name),
  );

  const sortedPoint: PluginMeta[] = [];

  while (zeroEndPoints.length) {
    const zep = zeroEndPoints.shift()!;
    sortedPoint.push(...getPlugin(zep.instance.name));
    allLines = allLines.filter(
      (l) => l[0] !== getPlugin(zep.instance.name)[0].instance.name,
    );

    const restPoints = plugins.filter(
      (item) =>
        !sortedPoint.find((sp) => sp.instance.name === item.instance.name),
    );
    zeroEndPoints = restPoints.filter(
      (item) => !allLines.find((l) => l[1] === item.instance.name),
    );
  }

  // if has ring, throw error
  if (allLines.length) {
    const restInRingPoints: Record<string, boolean> = {};
    for (const l of allLines) {
      restInRingPoints[l[0]] = true;
      restInRingPoints[l[1]] = true;
    }

    throw new Error(
      `[rsbuild:plugin] Plugins dependencies has loop: ${Object.keys(
        restInRingPoints,
      ).join(',')}`,
    );
  }

  return sortedPoint;
};

export async function initPlugins({
  getPluginAPI,
  pluginManager,
}: {
  getPluginAPI: (environment?: string) => RsbuildPluginAPI;
  pluginManager: PluginManager;
}): Promise<void> {
  logger.debug('init plugins');

  const plugins = pluginDagSort(pluginManager.getAllPluginsWithMeta());

  const removedPlugins = plugins.reduce<Record<string, string[]>>(
    (ret, plugin) => {
      if (plugin.instance.remove) {
        ret[plugin.environment] ??= [];
        ret[plugin.environment].push(...plugin.instance.remove);
      }
      return ret;
    },
    {},
  );

  for (const plugin of plugins) {
    const isGlobalPlugin =
      plugin.environment === 'RSBUILD_ALL_ENVIRONMENT_SYMBOL';

    if (
      removedPlugins[plugin.environment]?.includes(plugin.instance.name) ||
      (!isGlobalPlugin &&
        removedPlugins[RSBUILD_ALL_ENVIRONMENT_SYMBOL]?.includes(
          plugin.instance.name,
        ))
    ) {
      continue;
    }
    const { instance, environment } = plugin;
    await instance.setup(getPluginAPI(environment));
  }

  logger.debug('init plugins done');
}
