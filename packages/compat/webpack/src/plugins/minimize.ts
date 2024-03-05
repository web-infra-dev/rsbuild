import {
  CHAIN_ID,
  getTerserMinifyOptions,
  type BundlerChain,
  type RsbuildPlugin,
  type NormalizedConfig,
  parseMinifyOptions,
} from '@rsbuild/shared';

async function applyJSMinimizer(chain: BundlerChain, config: NormalizedConfig) {
  const { default: TerserPlugin } = await import('terser-webpack-plugin');

  const finalOptions = await getTerserMinifyOptions(config);

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
    api.modifyBundlerChain(async (chain, { isProd }) => {
      const config = api.getNormalizedConfig();
      const doesMinimize =
        isProd &&
        !config.output.disableMinimize &&
        config.output.minify !== false;

      // set minimize to allow users to disable minimize
      chain.optimization.minimize(doesMinimize);

      if (parseMinifyOptions(config, isProd).minifyJs) {
        await applyJSMinimizer(chain, config);
      }
    });
  },
});
