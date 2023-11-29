import { isProd } from '@rsbuild/shared';
import type { RsbuildPlugin } from '../types';

// For Rsbuild Server Config
export const pluginServer = (): RsbuildPlugin => ({
  name: 'rsbuild:server',

  setup(api) {
    api.modifyRsbuildConfig((rsbuildConfig, { mergeRsbuildConfig }) => {
      // copy publicDir to dist when build
      if (isProd() && rsbuildConfig.server?.publicDir) {
        const { copy } = rsbuildConfig.output || {};
        const publicPattern = [
          {
            from: rsbuildConfig.server?.publicDir,
            to: '',
            noErrorOnMissing: true,
          },
        ];

        return mergeRsbuildConfig(rsbuildConfig, {
          output: {
            copy: Array.isArray(copy)
              ? publicPattern
              : {
                  patterns: publicPattern,
                },
          },
        });
      }
    });
  },
});
