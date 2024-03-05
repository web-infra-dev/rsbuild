import {
  getBrowserslistWithDefault,
  mergeChainedOptions,
} from '@rsbuild/shared';
import type {
  ModifyBundlerChainUtils,
  RsbuildPlugin,
  BundlerChain,
} from '@rsbuild/shared';
import browserslist from '@rsbuild/shared/browserslist';
import { browserslistToTargets } from 'lightningcss';
import path from 'node:path';
import type {
  LightningCssLoaderOptions,
  PluginLightningcssOptions,
} from './types';

const PLUGIN_NAME = 'rsbuild:lightningcss';

const applyLightningcssLoader = ({
  chain,
  utils: { CHAIN_ID },
  browserslist: browserslistUserConfig,
  options,
}: {
  chain: BundlerChain;
  utils: ModifyBundlerChainUtils;
  browserslist: string[];
  options: PluginLightningcssOptions | undefined;
}) => {
  const defaultOptions = {
    targets: browserslistToTargets(browserslist(browserslistUserConfig)),
  } satisfies LightningCssLoaderOptions;

  const mergedOptions: LightningCssLoaderOptions = mergeChainedOptions({
    defaults: defaultOptions,
    options: options?.transform,
  });

  [CHAIN_ID.RULE.CSS, CHAIN_ID.RULE.SASS, CHAIN_ID.RULE.LESS].forEach(
    (ruleId) => {
      const rule = chain.module.rule(ruleId);
      const use = rule.use(CHAIN_ID.USE.LIGHTNINGCSS);

      use.loader(path.resolve(__dirname, './loader')).options(mergedOptions);

      switch (ruleId) {
        case CHAIN_ID.RULE.SASS:
          use.before(CHAIN_ID.USE.RESOLVE_URL);
          break;
        case CHAIN_ID.RULE.LESS:
          use.before(CHAIN_ID.USE.LESS);
          break;
        case CHAIN_ID.RULE.CSS:
          use.after(CHAIN_ID.USE.CSS);
          break;
      }
      rule.uses.delete(CHAIN_ID.USE.POSTCSS);
    },
  );
};

const applyLightningCssMinifyPlugin = async ({
  chain,
  utils: { CHAIN_ID },
  browserslist: browserslistUserConfig,
  options,
}: {
  chain: BundlerChain;
  browserslist: string[];
  utils: ModifyBundlerChainUtils;
  options: PluginLightningcssOptions | undefined;
}) => {
  const defaultOptions = {
    targets: browserslistToTargets(browserslist(browserslistUserConfig)),
  } satisfies LightningCssLoaderOptions;

  const mergedOptions: LightningCssLoaderOptions = mergeChainedOptions({
    defaults: defaultOptions,
    options: options?.minify,
  });

  const { LightningCssMinifyPlugin } = await import('./minimizer');
  chain.optimization
    .minimizer(CHAIN_ID.MINIMIZER.CSS)
    .use(LightningCssMinifyPlugin, [mergedOptions])
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
      const browserslist = await getBrowserslistWithDefault(
        context.rootPath,
        config,
        target,
      );

      if (!isServer && !isWebWorker && options?.transform !== false) {
        applyLightningcssLoader({ chain, utils, browserslist, options });
      }

      const isMinimize = isProd && !config.output.disableMinimize;

      if (isMinimize && options?.minify !== false) {
        applyLightningCssMinifyPlugin({ chain, utils, browserslist, options });
      }
    });
  },
});
