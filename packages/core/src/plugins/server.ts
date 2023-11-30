import { isProd } from '@rsbuild/shared';
import type { RsbuildPlugin } from '../types';

// For Rsbuild Server Config
export const pluginServer = (): RsbuildPlugin => ({
  name: 'rsbuild:server',

  setup(api) {
    api.modifyRsbuildConfig((rsbuildConfig, { mergeRsbuildConfig }) => {
      // copy publicDir to dist when build
      if (isProd() && rsbuildConfig.server?.publicDir) {
        const { name, copyOnBuild } = rsbuildConfig.server?.publicDir;

        if (!copyOnBuild || !name) {
          return;
        }

        const { copy } = rsbuildConfig.output || {};
        const publicPattern = [
          {
            from: name,
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
