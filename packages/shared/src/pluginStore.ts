import { logger, debug } from './logger';
import type {
  PluginStore,
  RsbuildPlugin,
  RsbuildPluginAPI,
  RsbuildPlugins,
} from './types';
import { color, isFunction } from './utils';

export function createPluginStore(): PluginStore {
  let plugins: RsbuildPlugin[] = [];

  const addPlugins = (
    newPlugins: RsbuildPlugins,
    options?: { before?: string },
  ) => {
    const { before } = options || {};
    for (const plugin of newPlugins) {
      if (!plugin) continue;
      if (typeof plugin !== 'object') {
        throw new Error(
          `expect plugin instance is object, but got ${typeof plugin}.`,
        );
      }

      const { name, setup, apply } = plugin as any;
      if (typeof name !== 'string') {
        logger.warn(
          `Rsbuild plugin must have a "name" field for identification.`,
        );
      }
      if (!isFunction(setup)) {
        if (isFunction(apply)) {
          const _name = plugin.constructor?.name ?? 'SomeWebpackPlugin';

          const message =
            `${color.yellow(_name)} looks like a webpack or Rspack plugin, ` +
            `please use ${color.yellow('`tools.rspack`')} to register it:\n`;
          const example = [
            '  // rsbuild.config.ts',
            '  export default {',
            '    tools: {',
            '      rspack: {',
            `        plugins: [new ${name}()]`,
            '      }',
            '    }',
            '  };',
          ].join('\n');

          throw new Error(message + color.green(example));
        }

        throw new Error(
          `Expect Rsbuild plugin.setup to be a function, but got ${typeof plugin}.`,
        );
      }
      if (plugins.some((item) => item.name === plugin.name)) {
        logger.warn(
          `Rsbuild plugin "${plugin.name}" registered multiple times.`,
        );
      }
      if (before) {
        const index = plugins.findIndex((item) => item.name === before);
        if (index === -1) {
          logger.warn(`Plugin "${before}" does not exist.`);
          plugins.push(plugin);
        } else {
          plugins.splice(index, 0, plugin);
        }
      } else {
        plugins.push(plugin);
      }
    }
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

const pluginDagSort = <P extends Record<string, any>>(
  plugins: P[],
  key = 'name',
  preKey = 'pre',
  postKey = 'post',
): P[] => {
  type PluginQueryCondition = P | string;
  let allLines: [string, string][] = [];
  function getPluginByAny(q: PluginQueryCondition) {
    const target = plugins.find((item) =>
      typeof q === 'string' ? item[key] === q : item[key] === q[key],
    );
    // current plugin design can't guarantee the plugins in pre/post existed
    if (!target) {
      throw new Error(`plugin ${q} not existed`);
    }
    return target;
  }
  plugins.forEach((item) => {
    item[preKey]?.forEach((p: PluginQueryCondition) => {
      // compatibility: do not add the plugin-name that plugins not have
      if (plugins.find((ap) => ap.name === p)) {
        allLines.push([getPluginByAny(p)[key], getPluginByAny(item)[key]]);
      }
    });
    item[postKey]?.forEach((pt: PluginQueryCondition) => {
      // compatibility: do not add the plugin-name that plugins not have
      if (plugins.find((ap) => ap.name === pt)) {
        allLines.push([getPluginByAny(item)[key], getPluginByAny(pt)[key]]);
      }
    });
  });

  // search the zero input plugin
  let zeroEndPoints = plugins.filter(
    (item) => !allLines.find((l) => l[1] === item[key]),
  );

  const sortedPoint: P[] = [];
  while (zeroEndPoints.length) {
    const zep = zeroEndPoints.shift();
    sortedPoint.push(getPluginByAny(zep!));
    allLines = allLines.filter((l) => l[0] !== getPluginByAny(zep!)[key]);

    const restPoints = plugins.filter(
      (item) => !sortedPoint.find((sp) => sp[key] === item[key]),
    );
    zeroEndPoints = restPoints.filter(
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      (item) => !allLines.find((l) => l[1] === item[key]),
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
  pluginStore,
}: {
  pluginAPI?: RsbuildPluginAPI;
  pluginStore: PluginStore;
}) {
  debug('init plugins');

  const plugins = pluginDagSort(pluginStore.plugins);

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
