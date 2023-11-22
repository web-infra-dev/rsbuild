import { CHAIN_ID, BundlerChain, getJSMinifyOptions } from '@rsbuild/shared';
import { applyCSSMinimizer } from '@rsbuild/plugin-css-minimizer';
import type { RsbuildPlugin, NormalizedConfig } from '../types';

async function applyJSMinimizer(chain: BundlerChain, config: NormalizedConfig) {
  const { default: TerserPlugin } = await import('terser-webpack-plugin');

  const finalOptions = await getJSMinifyOptions(config);

  chain.optimization
    .minimizer(CHAIN_ID.MINIMIZER.JS)
    .use(TerserPlugin, [
      // Due to terser-webpack-plugin has changed the type of class, which using a generic type in
      // constructor, leading auto inference of parameters of plugin constructor is not possible, using any instead
      finalOptions as any,
    ])
    .end();
}

export const pluginMinimize = (): RsbuildPlugin => ({
  name: 'rsbuild-webpack:minimize',

  setup(api) {
    api.modifyBundlerChain(async (chain, { isProd, CHAIN_ID }) => {
      const config = api.getNormalizedConfig();
      const isMinimize = isProd && !config.output.disableMinimize;

      // set minimize to allow users to disable minimize
      chain.optimization.minimize(isMinimize);

      if (isMinimize) {
        await applyJSMinimizer(chain, config);
        await applyCSSMinimizer(chain, CHAIN_ID, {
          pluginOptions: config.tools.minifyCss,
        });
      }
    });
  },
});
