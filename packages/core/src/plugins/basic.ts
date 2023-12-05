import path from 'path';
import { TARGET_ID_MAP } from '@rsbuild/shared';
import type { RsbuildPlugin } from '../types';

/**
 * Provide some basic configs of rspack
 */
export const pluginBasic = (): RsbuildPlugin => ({
  name: 'rsbuild:basic',

  setup(api) {
    api.modifyBundlerChain((chain, { env, isProd, target }) => {
      chain.name(TARGET_ID_MAP[target]);

      // The base directory for resolving entry points and loaders from the configuration.
      chain.context(api.context.rootPath);

      chain.mode(isProd ? 'production' : 'development');

      chain.merge({
        infrastructureLogging: {
          // Using `error` level to avoid `cache.PackFileCacheStrategy` logs
          level: 'error',
        },
      });

      // Disable performance hints, these logs are too complex
      chain.performance.hints(false);

      // Align with the futureDefaults of webpack 6
      chain.module.parser.merge({
        javascript: {
          exportsPresence: 'error',
        },
      });

      if (env === 'development') {
        // Set correct path for source map
        // this helps VS Code break points working correctly in monorepo
        chain.output.devtoolModuleFilenameTemplate(
          (info: { absoluteResourcePath: string }) =>
            path.resolve(info.absoluteResourcePath).replace(/\\/g, '/'),
        );
      }
    });
  },
});
