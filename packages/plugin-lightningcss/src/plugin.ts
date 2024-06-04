import path from 'node:path';
import type {
  BundlerChain,
  ChainIdentifier,
  NormalizedConfig,
  RsbuildContext,
  RsbuildPlugin,
  RsbuildTarget,
} from '@rsbuild/core';
import { getBrowserslistWithDefault, reduceConfigs } from '@rsbuild/shared';
import browserslist from '@rsbuild/shared/browserslist';
import * as lightningcss from 'lightningcss';
import type { Targets } from 'lightningcss';
import type {
  LightningCSSLoaderOptions,
  LightningCSSTransformOptions,
  Lightningcss,
  PluginLightningcssOptions,
} from './types';

export const PLUGIN_LIGHTNINGCSS_NAME = 'rsbuild:lightningcss';

const getLightningCSSTargets = async ({
  context,
  config,
  target,
  options,
}: {
  context: RsbuildContext;
  config: NormalizedConfig;
  target: RsbuildTarget;
  options: PluginLightningcssOptions;
}) => {
  const browserslistUserConfig = await getBrowserslistWithDefault(
    context.rootPath,
    config,
    target,
  );

  const implementation =
    (options.implementation as Lightningcss) ?? lightningcss;

  const targets = implementation.browserslistToTargets(
    browserslist(browserslistUserConfig),
  );

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
  targets: Targets;
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

  const mergedOptions = reduceConfigs<LightningCSSTransformOptions>({
    initial: defaultOptions,
    config: {
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
  targets: Targets;
  options: PluginLightningcssOptions | undefined;
}) => {
  const defaultOptions = {
    targets,
  } satisfies LightningCSSLoaderOptions;

  const { implementation } = options ?? {};

  if (options?.minify === true) {
    options.minify = {};
  }

  const mergedOptions = reduceConfigs<LightningCSSTransformOptions>({
    initial: defaultOptions,
    config: {
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

const validateImplementation = (implementation: unknown) => {
  if (!implementation) {
    return;
  }

  const lightningcss = implementation as Lightningcss;

  if (typeof implementation !== 'object') {
    throw new TypeError(
      `[${PLUGIN_LIGHTNINGCSS_NAME}]: implementation must be an 'lightningcss' object. Received ${typeof lightningcss}`,
    );
  }

  if (typeof lightningcss.transform !== 'function') {
    throw new TypeError(
      `[${PLUGIN_LIGHTNINGCSS_NAME}]: implementation.transform must be an 'lightningcss' transform function. Received ${typeof lightningcss.transform}`,
    );
  }

  if (typeof lightningcss.browserslistToTargets !== 'function') {
    throw new TypeError(
      `[${PLUGIN_LIGHTNINGCSS_NAME}]: options.implementation.browserslistToTargets must be an 'lightningcss' browserslistToTargets function. Received ${typeof lightningcss.browserslistToTargets}`,
    );
  }
};

export const pluginLightningcss = (
  options: PluginLightningcssOptions = {},
): RsbuildPlugin => ({
  name: PLUGIN_LIGHTNINGCSS_NAME,

  setup(api) {
    let targets: Targets;

    if (options.implementation) {
      validateImplementation(options.implementation);
    }

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
