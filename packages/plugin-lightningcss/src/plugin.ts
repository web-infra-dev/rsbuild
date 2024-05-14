import path from 'node:path';
import {
  getBrowserslistWithDefault,
  mergeChainedOptions,
  parseMinifyOptions,
} from '@rsbuild/shared';
import type {
  BundlerChain,
  ModifyBundlerChainUtils,
  NormalizedConfig,
  RsbuildContext,
  RsbuildPlugin,
  RsbuildTarget,
} from '@rsbuild/shared';
import browserslist from '@rsbuild/shared/browserslist';
import { browserslistToTargets as _browserslistToTargets } from 'lightningcss';
import type * as LightningCSS from 'lightningcss';
import type {
  LightningCSSLoaderOptions,
  PluginLightningcssOptions,
} from './types';

const PLUGIN_NAME = 'rsbuild:lightningcss';

const getLightningCSSTargets = async ({
  context,
  config,
  target,
  options,
}: {
  context: RsbuildContext;
  config: NormalizedConfig;
  target: RsbuildTarget;
  options: PluginLightningcssOptions | undefined;
}) => {
  const browserslistUserConfig = await getBrowserslistWithDefault(
    context.rootPath,
    config,
    target,
  );

  const { implementation } = (options ?? {}) as any;
  if (
    implementation &&
    typeof implementation.browserslistToTargets !== 'function'
  ) {
    throw new TypeError(
      `[${PLUGIN_NAME}]: options.implementation.browserslistToTargets must be an 'lightningcss' browserslistToTargets function. Received ${typeof implementation.browserslistToTargets}`,
    );
  }

  const browserslistToTargets: typeof _browserslistToTargets =
    implementation?.browserslistToTargets ?? _browserslistToTargets;

  const targets = browserslistToTargets(browserslist(browserslistUserConfig));
  return targets;
};

const applyLightningCSSLoader = ({
  chain,
  utils: { CHAIN_ID },
  targets,
  options,
}: {
  chain: BundlerChain;
  utils: ModifyBundlerChainUtils;
  targets: LightningCSS.Targets;
  options: PluginLightningcssOptions | undefined;
}) => {
  const defaultOptions = {
    targets,
  } satisfies LightningCSSLoaderOptions;

  const { implementation } = options ?? {};

  if (options?.transform === true) {
    options.transform = {};
  }

  const mergedOptions: LightningCSSLoaderOptions = mergeChainedOptions({
    defaults: defaultOptions,
    options: {
      ...(implementation ? { implementation } : {}),
      ...options?.transform,
    },
  });

  const ruleIds = [
    CHAIN_ID.RULE.CSS,
    CHAIN_ID.RULE.SASS,
    CHAIN_ID.RULE.LESS,
    CHAIN_ID.RULE.STYLUS,
  ];

  for (const ruleId of ruleIds) {
    const existRule = chain.module.rules.has(ruleId);
    if (!existRule) {
      continue;
    }

    const rule = chain.module.rule(ruleId);
    const use = rule.use(CHAIN_ID.USE.LIGHTNINGCSS);

    use.loader(path.resolve(__dirname, './loader.cjs')).options(mergedOptions);

    switch (ruleId) {
      case CHAIN_ID.RULE.SASS:
        use.before(CHAIN_ID.USE.RESOLVE_URL);
        break;
      case CHAIN_ID.RULE.LESS:
        use.before(CHAIN_ID.USE.LESS);
        break;
      case CHAIN_ID.RULE.STYLUS:
        use.before(CHAIN_ID.USE.STYLUS);
        break;
      case CHAIN_ID.RULE.CSS:
        use.after(CHAIN_ID.USE.CSS);
        break;
    }
    rule.uses.delete(CHAIN_ID.USE.POSTCSS);
  }
};

const applyLightningCSSMinifyPlugin = async ({
  chain,
  utils: { CHAIN_ID },
  targets,
  options,
}: {
  chain: BundlerChain;
  utils: ModifyBundlerChainUtils;
  targets: LightningCSS.Targets;
  options: PluginLightningcssOptions | undefined;
}) => {
  const defaultOptions = {
    targets,
  } satisfies LightningCSSLoaderOptions;

  const { implementation } = options ?? {};

  if (options?.minify === true) {
    options.minify = {};
  }

  const mergedOptions: LightningCSSLoaderOptions = mergeChainedOptions({
    defaults: defaultOptions,
    options: {
      ...(implementation ? { implementation } : {}),
      ...options?.minify,
    },
  });

  const { LightningCSSMinifyPlugin } = await import('./minimizer');
  chain.optimization
    .minimizer(CHAIN_ID.MINIMIZER.CSS)
    .use(LightningCSSMinifyPlugin, [mergedOptions])
    .end();
};

export const pluginLightningcss = (
  options?: PluginLightningcssOptions,
): RsbuildPlugin => ({
  name: PLUGIN_NAME,

  setup(api) {
    api.modifyBundlerChain(async (chain, utils) => {
      const { isServer, isWebWorker, isProd, target } = utils;
      const { context } = api;
      const config = api.getNormalizedConfig();
      const targets = await getLightningCSSTargets({
        context,
        config,
        target,
        options,
      });

      if (!isServer && !isWebWorker && options?.transform !== false) {
        applyLightningCSSLoader({
          chain,
          utils,
          targets,
          options,
        });
      }

      const isMinimize =
        isProd &&
        config.output.minify !== false &&
        parseMinifyOptions(config).minifyCss;

      if (isMinimize && options?.minify !== false) {
        await applyLightningCSSMinifyPlugin({
          chain,
          utils,
          targets,
          options,
        });
      }
    });
  },
});
