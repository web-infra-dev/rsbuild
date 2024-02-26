import { color, debug, logger, isFunction } from '@rsbuild/shared';
import type {
  Falsy,
  PluginManager,
  RsbuildPlugin,
  RsbuildPluginAPI,
  BundlerPluginInstance,
} from '@rsbuild/shared';

function validatePlugin(plugin: unknown) {
  const type = typeof plugin;

  if (type !== 'object' || plugin === null) {
    throw new Error(
      `Expect Rsbuild plugin instance to be an object, but got ${type}.`,
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
      )} looks like a Webpack or Rspack plugin, please use ${color.yellow(
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
    `Expect Rsbuild plugin.setup to be a function, but got ${type}.`,
  );
}

export function createPluginManager(): PluginManager {
  let plugins: RsbuildPlugin[] = [];

  const addPlugins = (
    newPlugins: Array<RsbuildPlugin | Falsy>,
    options?: { before?: string },
  ) => {
    const { before } = options || {};

    newPlugins.forEach((newPlugin) => {
      if (!newPlugin) {
        return;
      }

      validatePlugin(newPlugin);

      if (plugins.find((item) => item.name === newPlugin.name)) {
        logger.warn(
          `Rsbuild plugin "${newPlugin.name}" registered multiple times.`,
        );
      } else if (before) {
        const index = plugins.findIndex((item) => item.name === before);
        if (index === -1) {
          logger.warn(`Plugin "${before}" does not exist.`);
          plugins.push(newPlugin);
        } else {
          plugins.splice(index, 0, newPlugin);
        }
      } else {
        plugins.push(newPlugin);
      }
    });
  };

  const removePlugins = (pluginNames: string[]) => {
    plugins = plugins.filter((plugin) => !pluginNames.includes(plugin.name));
  };

  const isPluginExists = (pluginName: string) =>
    Boolean(plugins.find((plugin) => plugin.name === pluginName));

  return {
    get plugins() {
      return plugins;
    },
    addPlugins,
    removePlugins,
    isPluginExists,
  };
}

export const pluginDagSort = (plugins: RsbuildPlugin[]): RsbuildPlugin[] => {
  let allLines: [string, string][] = [];

  function getPlugin(name: string) {
    const target = plugins.find((item) => item.name === name);
    if (!target) {
      throw new Error(`plugin ${name} not existed`);
    }
    return target;
  }

  plugins.forEach((plugin) => {
    plugin.pre?.forEach((pre) => {
      if (pre && plugins.some((item) => item.name === pre)) {
        allLines.push([pre, plugin.name]);
      }
    });

    plugin.post?.forEach((post) => {
      if (post && plugins.some((item) => item.name === post)) {
        allLines.push([plugin.name, post]);
      }
    });
  });

  // search the zero input plugin
  let zeroEndPoints = plugins.filter(
    (item) => !allLines.find((l) => l[1] === item.name),
  );

  const sortedPoint: RsbuildPlugin[] = [];

  while (zeroEndPoints.length) {
    const zep = zeroEndPoints.shift()!;
    sortedPoint.push(getPlugin(zep.name));
    allLines = allLines.filter((l) => l[0] !== getPlugin(zep.name).name);

    const restPoints = plugins.filter(
      (item) => !sortedPoint.find((sp) => sp.name === item.name),
    );
    zeroEndPoints = restPoints.filter(
      (item) => !allLines.find((l) => l[1] === item.name),
    );
  }

  // if has ring, throw error
  if (allLines.length) {
    const restInRingPoints: Record<string, boolean> = {};
    allLines.forEach((l) => {
      restInRingPoints[l[0]] = true;
      restInRingPoints[l[1]] = true;
    });

    throw new Error(
      `plugins dependencies has loop: ${Object.keys(restInRingPoints).join(
        ',',
      )}`,
    );
  }

  return sortedPoint;
};

export async function initPlugins({
  pluginAPI,
  pluginManager,
}: {
  pluginAPI?: RsbuildPluginAPI;
  pluginManager: PluginManager;
}) {
  debug('init plugins');

  const plugins = pluginDagSort(pluginManager.plugins);

  const removedPlugins = plugins.reduce<string[]>((ret, plugin) => {
    if (plugin.remove) {
      return ret.concat(plugin.remove);
    }
    return ret;
  }, []);

  for (const plugin of plugins) {
    if (removedPlugins.includes(plugin.name)) {
      continue;
    }
    await plugin.setup(pluginAPI!);
  }

  debug('init plugins done');
}
