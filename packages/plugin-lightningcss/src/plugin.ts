import path from 'node:path';
import type {
  BundlerChain,
  ChainIdentifier,
  NormalizedConfig,
  RsbuildContext,
  RsbuildPlugin,
  RsbuildTarget,
} from '@rsbuild/core';
import {
  getBrowserslistWithDefault,
  mergeChainedOptions,
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
  CHAIN_ID,
  targets,
  options = {},
}: {
  chain: BundlerChain;
  CHAIN_ID: ChainIdentifier;
  targets: LightningCSS.Targets;
  options: PluginLightningcssOptions | undefined;
}) => {
  if (!chain.module.rules.has(CHAIN_ID.RULE.CSS)) {
    return;
  }

  const defaultOptions = {
    targets,
  } satisfies LightningCSSLoaderOptions;

  const { implementation } = options;

  if (options.transform === true) {
    options.transform = {};
  }

  const mergedOptions: LightningCSSLoaderOptions = mergeChainedOptions({
    defaults: defaultOptions,
    options: {
      ...(implementation ? { implementation } : {}),
      ...options.transform,
    },
  });

  const rule = chain.module.rule(CHAIN_ID.RULE.CSS);

  rule
    .use(CHAIN_ID.USE.LIGHTNINGCSS)
    .loader(path.resolve(__dirname, './loader.cjs'))
    .options(mergedOptions)
    .after(CHAIN_ID.USE.CSS);

  rule.uses.delete(CHAIN_ID.USE.POSTCSS);
};

const applyLightningCSSMinifyPlugin = async ({
  chain,
  CHAIN_ID,
  targets,
  options,
}: {
  chain: BundlerChain;
  CHAIN_ID: ChainIdentifier;
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
    let targets: LightningCSS.Targets;

    api.modifyBundlerChain({
      // ensure lightningcss-loader can be applied to sass/less/stylus rules
      order: 'pre',

      handler: async (chain, { CHAIN_ID, target }) => {
        const config = api.getNormalizedConfig();

        targets = await getLightningCSSTargets({
          context: api.context,
          config,
          target,
          options,
        });

        if (target === 'web' && options?.transform !== false) {
          applyLightningCSSLoader({
            chain,
            CHAIN_ID,
            targets,
            options,
          });
        }
      },
    });

    api.modifyBundlerChain(async (chain, { CHAIN_ID, isProd }) => {
      const config = api.getNormalizedConfig();
      const { minify } = config.output;
      const isMinimize =
        isProd &&
        (minify === true || (typeof minify === 'object' && minify.css));

      if (isMinimize && options?.minify !== false) {
        await applyLightningCSSMinifyPlugin({
          chain,
          CHAIN_ID,
          targets,
          options,
        });
      }
    });
  },
});
