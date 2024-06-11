import type { RsbuildPlugin, Rspack } from '@rsbuild/core';
import { isRegExp } from '@rsbuild/shared';

export const pluginLazyCompilation = (): RsbuildPlugin => ({
  name: 'rsbuild:lazy-compilation',

  setup(api) {
    api.modifyBundlerChain((chain, { isProd, target }) => {
      if (isProd || target !== 'web') {
        return;
      }

      const config = api.getNormalizedConfig();

      const options = config.dev?.lazyCompilation;
      if (!options) {
        return;
      }

      const cssRegExp = /\.(?:css|less|sass|scss|styl|stylus)$/;

      const isExcludedModule = (name: string) => {
        return (
          // exclude CSS files because Rspack does not support it yet
          // TODO: remove this after Rspack supporting it
          cssRegExp.test(name)
        );
      };

      const defaultTest = (module: Rspack.Module) => {
        const name = module.nameForCondition();
        if (!name) {
          return false;
        }
        return !isExcludedModule(name);
      };

      const mergeOptions = (): Rspack.LazyCompilationOptions => {
        if (options === true) {
          return { test: defaultTest };
        }

        const { test } = options;
        if (!test) {
          return {
            ...options,
            test: defaultTest,
          };
        }

        return {
          ...options,
          test(module) {
            const name = module.nameForCondition();

            if (!name || isExcludedModule(name)) {
              return false;
            }

            if (isRegExp(test)) {
              return name ? test.test(name) : false;
            }

            return test(module);
          },
        };
      };

      chain.experiments({
        ...chain.get('experiments'),
        lazyCompilation: mergeOptions(),
      });
    });
  },
});
