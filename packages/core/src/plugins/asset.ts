import path from 'path';
import {
  getDistPath,
  getFilename,
  chainStaticAssetRule,
} from '@rsbuild/shared';
import type { DefaultRsbuildPlugin } from '@rsbuild/shared';

export function getRegExpForExts(exts: string[]): RegExp {
  const matcher = exts
    .map((ext) => ext.trim())
    .map((ext) => (ext.startsWith('.') ? ext.slice(1) : ext))
    .join('|');

  return new RegExp(
    exts.length === 1 ? `\\.${matcher}$` : `\\.(${matcher})$`,
    'i',
  );
}

export const pluginAsset = (
  assetType: 'image' | 'media' | 'font' | 'svg',
  exts: string[],
): DefaultRsbuildPlugin => ({
  name: `plugin-${assetType}`,

  setup(api) {
    api.modifyBundlerChain((chain, { isProd }) => {
      const config = api.getNormalizedConfig();
      const regExp = getRegExpForExts(exts);
      const distDir = getDistPath(config.output, assetType);
      const filename = getFilename(config.output, assetType, isProd);

      const maxSize = config.output.dataUriLimit[assetType];

      const rule = chain.module.rule(assetType).test(regExp);

      chainStaticAssetRule({
        rule,
        maxSize,
        filename: path.posix.join(distDir, filename),
        assetType,
      });
    });
  },
});
