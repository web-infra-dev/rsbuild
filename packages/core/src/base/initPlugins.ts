import {
  onExitProcess,
  createPublicContext,
  getHTMLPathByEntry,
  type PluginStore,
  BuilderContext,
  NormalizedSharedOutputConfig,
  SharedHtmlConfig,
  AsyncHook,
  OnExitFn,
} from '@rsbuild/shared';

export function getPluginAPI<
  Context extends BuilderContext & {
    hooks: {
      onExitHook: AsyncHook<OnExitFn>;
    };
    config: unknown;
    normalizedConfig?: {
      output: NormalizedSharedOutputConfig;
      html: SharedHtmlConfig;
    };
  },
  PluginHooks extends {
    [key: string]: unknown;
  },
>({
  context,
  pluginStore,
  pluginHooks,
}: {
  context: Context;
  pluginStore: PluginStore;
  pluginHooks: PluginHooks;
}) {
  const { hooks } = context;
  const publicContext = createPublicContext(context);

  const getBuilderConfig = () => {
    if (!context.normalizedConfig) {
      throw new Error(
        'Cannot access builder config until modifyBuilderConfig is called.',
      );
    }
    return context.config as Context['config'];
  };

  const getNormalizedConfig = () => {
    if (!context.normalizedConfig) {
      throw new Error(
        'Cannot access normalized config until modifyBuilderConfig is called.',
      );
    }
    return context.normalizedConfig as NonNullable<Context['normalizedConfig']>;
  };

  const getHTMLPaths = () => {
    return Object.keys(context.entry).reduce<Record<string, string>>(
      (prev, key) => {
        prev[key] = getHTMLPathByEntry(key, getNormalizedConfig());
        return prev;
      },
      {},
    );
  };

  onExitProcess(() => {
    hooks.onExitHook.call();
  });

  return {
    context: publicContext,
    getHTMLPaths,
    getBuilderConfig,
    getNormalizedConfig,
    isPluginExists: pluginStore.isPluginExists,

    // Hooks
    ...(pluginHooks as PluginHooks),
  };
}
