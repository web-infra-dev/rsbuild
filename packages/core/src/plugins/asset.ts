import path from 'node:path';
import type {
  AssetModuleFilename,
  GeneratorOptionsByModuleType,
} from '@rspack/core';
import { CHAIN_ID } from '../configChain';
import {
  AUDIO_EXTENSIONS,
  FONT_EXTENSIONS,
  IMAGE_EXTENSIONS,
  VIDEO_EXTENSIONS,
} from '../constants';
import { getFilename } from '../helpers';
import type { RsbuildPlugin, RspackChain } from '../types';

const chainStaticAssetRule = ({
  emit,
  rule,
  maxSize,
  filename,
  assetType,
}: {
  emit: boolean;
  rule: RspackChain.Rule;
  maxSize: number;
  filename: AssetModuleFilename;
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
    api.modifyBundlerChain((chain, { isProd, environment }) => {
      const { config } = environment;

      const getMergedFilename = (
        assetType: 'svg' | 'font' | 'image' | 'media' | 'assets',
      ): AssetModuleFilename => {
        const distDir = config.output.distPath[assetType];
        const filename = getFilename(config, assetType, isProd);

        if (typeof filename === 'function') {
          return (...args) => {
            const name = filename(...args);
            return path.posix.join(distDir, name);
          };
        }

        return path.posix.join(distDir, filename);
      };

      const createAssetRule = (
        assetType: 'svg' | 'font' | 'image' | 'media',
        exts: string[],
        emit: boolean,
      ) => {
        const regExp = getRegExpForExts(exts);
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
          filename: getMergedFilename(assetType),
          assetType,
        });
      };

      const { emitAssets } = config.output;

      // image
      createAssetRule(CHAIN_ID.RULE.IMAGE, IMAGE_EXTENSIONS, emitAssets);
      // svg
      createAssetRule(CHAIN_ID.RULE.SVG, ['svg'], emitAssets);
      // media
      createAssetRule(
        CHAIN_ID.RULE.MEDIA,
        [...VIDEO_EXTENSIONS, ...AUDIO_EXTENSIONS],
        emitAssets,
      );
      // font
      createAssetRule(CHAIN_ID.RULE.FONT, FONT_EXTENSIONS, emitAssets);
      // assets
      const assetsFilename = getMergedFilename('assets');
      chain.output.assetModuleFilename(assetsFilename);
      if (!emitAssets) {
        chain.module.generator.merge({ 'asset/resource': { emit: false } });
      }

      // additional assets
      const { assetsInclude } = config.source;
      if (assetsInclude) {
        const { dataUriLimit } = config.output;
        const rule = chain.module
          .rule(CHAIN_ID.RULE.ADDITIONAL_ASSETS)
          .test(assetsInclude);
        const maxSize =
          typeof dataUriLimit === 'number' ? dataUriLimit : dataUriLimit.assets;

        chainStaticAssetRule({
          emit: emitAssets,
          rule,
          maxSize,
          filename: assetsFilename,
          assetType: 'additional-assets',
        });
      }
    });
  },
});
