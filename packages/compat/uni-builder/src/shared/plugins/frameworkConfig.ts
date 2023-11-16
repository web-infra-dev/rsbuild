import { fse, type DefaultRsbuildPlugin } from '@rsbuild/shared';

export const pluginFrameworkConfig = (
  configPath: string,
): DefaultRsbuildPlugin => ({
  name: 'plugin-framework-config',

  setup(api) {
    api.modifyBundlerChain((chain) => {
      if (!fse.existsSync(configPath)) {
        return;
      }

      const cache = chain.get('cache');

      cache.buildDependencies = {
        ...cache.buildDependencies,
        frameworkConfig: [configPath],
      };

      chain.cache(cache);
    });
  },
});
