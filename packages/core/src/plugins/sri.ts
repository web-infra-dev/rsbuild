import type { Buffer } from 'node:buffer';
import crypto from 'node:crypto';
import {
  type Rspack,
  type SriAlgorithm,
  type SriOptions,
  isHtmlDisabled,
  isProd,
  logger,
  removeLeadingSlash,
} from '@rsbuild/shared';
import { HTML_REGEX } from '../constants';
import type { RsbuildPlugin } from '../types';

const getAssetName = (url: string, assetPrefix: string) => {
  if (url.startsWith(assetPrefix)) {
    return removeLeadingSlash(url.replace(assetPrefix, ''));
  }
  return removeLeadingSlash(url);
};

export const pluginSri = (): RsbuildPlugin => ({
  name: 'rsbuild:sri',

  setup(api) {
    const placeholder = 'RSBUILD_INTEGRITY_PLACEHOLDER:';

    const getAlgorithm = () => {
      const config = api.getNormalizedConfig();
      const { sri } = config.security;
      const enable = sri.enable === 'auto' ? isProd() : sri.enable;

      if (!enable) {
        return null;
      }

      const { algorithm = 'sha384' }: SriOptions = sri;
      return algorithm;
    };

    api.modifyHTMLTags({
      // ensure `sri` can be applied to all tags
      order: 'post',
      handler(tags, { assetPrefix }) {
        const algorithm = getAlgorithm();

        if (!algorithm) {
          return tags;
        }

        const allTags = [...tags.headTags, ...tags.bodyTags];

        for (const tag of allTags) {
          let url = '';

          if (!tag.attrs) {
            continue;
          }

          if (tag.tag === 'script' && typeof tag.attrs.src === 'string') {
            url = tag.attrs.src;
          } else if (
            tag.tag === 'link' &&
            tag.attrs.rel === 'stylesheet' &&
            typeof tag.attrs.href === 'string'
          ) {
            url = tag.attrs.href;
          }

          if (!url) {
            continue;
          }

          const assetName = getAssetName(url, assetPrefix);

          if (!assetName) {
            continue;
          }

          tag.attrs.integrity ??= `${placeholder}${assetName}`;
        }

        return tags;
      },
    });

    const replaceIntegrity = (
      htmlContent: string,
      assets: Rspack.Assets,
      algorithm: SriAlgorithm,
      integrityCache: Map<string, string>,
    ) => {
      const regex = /integrity="RSBUILD_INTEGRITY_PLACEHOLDER:([^"]+)"/g;
      const matches = htmlContent.matchAll(regex);
      let replacedHtml = htmlContent;

      const calcIntegrity = (
        algorithm: SriAlgorithm,
        assetName: string,
        data: Buffer,
      ) => {
        if (integrityCache.has(assetName)) {
          return integrityCache.get(assetName);
        }

        const hash = crypto
          .createHash(algorithm)
          .update(data)
          .digest()
          .toString('base64');
        const integrity = `${algorithm}-${hash}`;

        integrityCache.set(assetName, integrity);

        return integrity;
      };

      for (const match of matches) {
        const assetName = match[1];
        if (!assetName) {
          continue;
        }

        if (assets[assetName]) {
          const integrity = calcIntegrity(
            algorithm,
            assetName,
            assets[assetName].buffer(),
          );
          replacedHtml = replacedHtml.replaceAll(
            `integrity="${placeholder}${assetName}"`,
            `integrity="${integrity}"`,
          );
        } else {
          logger.debug(
            `[rsbuild:sri] failed to generate integrity for ${assetName}.`,
          );
          // remove the integrity placeholder
          replacedHtml = replacedHtml.replace(
            `integrity="${placeholder}${assetName}"`,
            '',
          );
        }
      }

      return replacedHtml;
    };

    class SriReplaceIntegrityPlugin {
      algorithm: SriAlgorithm;

      constructor(algorithm: SriAlgorithm) {
        this.algorithm = algorithm;
      }

      apply(compiler: Rspack.Compiler) {
        compiler.hooks.compilation.tap(
          'SriReplaceIntegrityPlugin',
          (compilation) => {
            compilation.hooks.processAssets.tapPromise(
              {
                name: 'SriReplaceIntegrityPlugin',
                // use to final stage to get the final asset content
                stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_REPORT,
              },
              async (assets) => {
                const integrityCache = new Map<string, string>();

                for (const asset of Object.keys(assets)) {
                  if (!HTML_REGEX.test(asset)) {
                    continue;
                  }

                  const htmlContent: string = assets[asset].source();
                  if (!htmlContent.includes(placeholder)) {
                    continue;
                  }

                  assets[asset] = new compiler.webpack.sources.RawSource(
                    replaceIntegrity(
                      htmlContent,
                      assets,
                      this.algorithm,
                      integrityCache,
                    ),
                  );
                }
              },
            );
          },
        );
      }
    }

    api.modifyBundlerChain((chain, { target }) => {
      const config = api.getNormalizedConfig();

      if (isHtmlDisabled(config, target)) {
        return;
      }

      const algorithm = getAlgorithm();
      if (!algorithm) {
        return;
      }

      chain
        .plugin('rsbuild-sri-replace')
        .use(SriReplaceIntegrityPlugin, [algorithm]);
    });
  },
});
