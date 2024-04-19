import path from 'node:path';
import {
  getDistPath,
  getFilename,
  FONT_EXTENSIONS,
  IMAGE_EXTENSIONS,
  VIDEO_EXTENSIONS,
  AUDIO_EXTENSIONS,
  type BundlerChainRule,
} from '@rsbuild/shared';
import type { RsbuildPlugin } from '../types';
import type { GeneratorOptionsByModuleType } from '@rspack/core';

const chainStaticAssetRule = ({
  emit,
  rule,
  maxSize,
  filename,
  assetType,
}: {
  emit: boolean;
  rule: BundlerChainRule;
  maxSize: number;
  filename: string;
  assetType: string;
}) => {
  const generatorOptions:
    | GeneratorOptionsByModuleType['asset']
    | GeneratorOptionsByModuleType['asset/resource'] = {
    filename,
  };

  if (emit === false) {
    generatorOptions.emit = false;
  }

  // force to url: "foo.png?url" or "foo.png?__inline=false"
  rule
    .oneOf(`${assetType}-asset-url`)
    .type('asset/resource')
    .resourceQuery(/(__inline=false|url)/)
    .set('generator', generatorOptions);

  // force to inline: "foo.png?inline"
  rule
    .oneOf(`${assetType}-asset-inline`)
    .type('asset/inline')
    .resourceQuery(/inline/);

  // default: when size < dataUrlCondition.maxSize will inline
  rule
    .oneOf(`${assetType}-asset`)
    .type('asset')
    .parser({
      dataUrlCondition: {
        maxSize,
      },
    })
    .set('generator', generatorOptions);
};

export function getRegExpForExts(exts: string[]): RegExp {
  const matcher = exts
    .map((ext) => ext.trim())
    .map((ext) => (ext.startsWith('.') ? ext.slice(1) : ext))
    .join('|');

  return new RegExp(
    exts.length === 1 ? `\\.${matcher}$` : `\\.(?:${matcher})$`,
    'i',
  );
}

export const pluginAsset = (): RsbuildPlugin => ({
  name: 'rsbuild:asset',

  setup(api) {
    api.modifyBundlerChain((chain, { isProd, target }) => {
      const config = api.getNormalizedConfig();

      const createAssetRule = (
        assetType: 'image' | 'media' | 'font' | 'svg',
        exts: string[],
        emit: boolean,
      ) => {
        const regExp = getRegExpForExts(exts);
        const distDir = getDistPath(config, assetType);
        const filename = getFilename(config, assetType, isProd);
        const { dataUriLimit } = config.output;
        const maxSize =
          typeof dataUriLimit === 'number'
            ? dataUriLimit
            : dataUriLimit[assetType];
        const rule = chain.module.rule(assetType).test(regExp);

        chainStaticAssetRule({
          emit,
          rule,
          maxSize,
          filename: path.posix.join(distDir, filename),
          assetType,
        });
      };

      const emit = config.output.emitAssets({ target });

      createAssetRule('image', IMAGE_EXTENSIONS, emit);
      createAssetRule('svg', ['svg'], emit);
      createAssetRule(
        'media',
        [...VIDEO_EXTENSIONS, ...AUDIO_EXTENSIONS],
        emit,
      );
      createAssetRule('font', FONT_EXTENSIONS, emit);
    });
  },
});
