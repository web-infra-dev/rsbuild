import path from 'path';
import {
  SVG_REGEX,
  getDistPath,
  getFilename,
  chainStaticAssetRule,
} from '@rsbuild/shared';
import type { DefaultRsbuildPlugin } from '@rsbuild/shared';

export const pluginSvg = (): DefaultRsbuildPlugin => {
  return {
    name: 'plugin-svg',
    setup(api) {
      api.modifyBundlerChain(async (chain, { isProd, CHAIN_ID }) => {
        const config = api.getNormalizedConfig();
        const assetType = 'svg';

        const distDir = getDistPath(config.output, 'svg');
        const filename = getFilename(config.output, 'svg', isProd);
        const maxSize = config.output.dataUriLimit[assetType];

        const rule = chain.module.rule(CHAIN_ID.RULE.SVG).test(SVG_REGEX);

        // treat all .svg files as assets.
        chainStaticAssetRule({
          rule,
          maxSize,
          filename: path.posix.join(distDir, filename),
          assetType,
        });
      });
    },
  };
};
