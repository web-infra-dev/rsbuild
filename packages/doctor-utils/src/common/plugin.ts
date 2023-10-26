import { SDK } from '@rsbuild/doctor-types';

export function getPluginHooks(plugin: SDK.PluginData) {
  return Object.keys(plugin);
}

export function getPluginTapNames(plugin: SDK.PluginData) {
  const hooks = getPluginHooks(plugin);

  const tapNames = new Set<string>();

  hooks.forEach((hook) => {
    plugin[hook].forEach((data) => {
      tapNames.add(data.tapName);
    });
  });

  return [...tapNames];
}

export function getPluginSummary(
  plugin: SDK.PluginData,
): SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.GetPluginSummary> {
  return {
    hooks: getPluginHooks(plugin),
    tapNames: getPluginTapNames(plugin),
  };
}

export function getPluginData(
  plugin: SDK.PluginData,
  selectedHooks: string[] = [],
  selectedTapNames: string[] = [],
): SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.GetPluginData> {
  const hooks = getPluginHooks(plugin).filter((hook) => {
    if (selectedHooks.length && selectedHooks.indexOf(hook) === -1) {
      return false;
    }
    return true;
  });

  if (!hooks.length) return [];

  const tapNames = getPluginTapNames(plugin);

  return tapNames.reduce((total, tapName) => {
    if (selectedTapNames.length && selectedTapNames.indexOf(tapName) === -1) {
      return total;
    }

    hooks.forEach((hook) => {
      const hookData = plugin[hook].filter((e) => e.tapName === tapName);

      if (hookData.length === 0) return;

      total.push({
        tapName,
        hook,
        data: hookData.map((e) => {
          return {
            startAt: e.startAt,
            endAt: e.endAt,
            costs: e.costs,
            type: e.type,
          };
        }),
      });
    });

    return total;
  }, [] as SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.GetPluginData>);
}
