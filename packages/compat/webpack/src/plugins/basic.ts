import path from 'path';
import type { RsbuildPlugin } from '../types';
import { applyBasicPlugin } from '@rsbuild/shared';

/**
 * Provide some basic configs of webpack
 */
export const pluginBasic = (): RsbuildPlugin => ({
  name: 'plugin-basic',

  setup(api) {
    applyBasicPlugin(api);

    api.modifyWebpackChain(async (chain, { env }) => {
      // Disable webpack performance hints.
      // These logs are too complex
      chain.performance.hints(false);

      // This will be futureDefaults in webpack 6
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
