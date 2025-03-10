import type { Buffer } from 'node:buffer';
import crypto from 'node:crypto';
import { HTML_REGEX } from '../constants';
import { removeLeadingSlash } from '../helpers';
import { logger } from '../logger';
import type {
  EnvironmentContext,
  RsbuildPlugin,
  Rspack,
  SriAlgorithm,
  SriOptions,
} from '../types';

const getAssetName = (url: string, assetPrefix: string) => {
  if (url.startsWith(assetPrefix)) {
    return removeLeadingSlash(url.replace(assetPrefix, ''));
  }
  return removeLeadingSlash(url);
};

const isSriLinkRel = (rel: string | boolean | null | undefined) => {
  return (
    typeof rel === 'string' &&
    ['stylesheet', 'preload', 'modulepreload'].includes(rel)
  );
};

export const pluginSri = (): RsbuildPlugin => ({
  name: 'rsbuild:sri',

  setup(api) {
    const placeholder = 'RSBUILD_INTEGRITY_PLACEHOLDER:';

    const getAlgorithm = (environment: EnvironmentContext) => {
      const { config } = environment;
      const { sri } = config.security;
      const enable =
        sri.enable === 'auto' ? config.mode === 'production' : sri.enable;

      if (!enable) {
        return null;
      }

      const { algorithm = 'sha384' }: SriOptions = sri;
      return algorithm;
    };

    api.modifyHTMLTags({
      // ensure `sri` can be applied to all tags
      order: 'post',
      handler(tags, { assetPrefix, environment }) {
        const algorithm = getAlgorithm(environment);

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
            isSriLinkRel(tag.attrs.rel) &&
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
          .update(data as Uint8Array)
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

    api.processAssets(
      {
        // use to final stage to get the final asset content
        stage: 'report',
      },
      ({ assets, sources, environment }) => {
        const { htmlPaths } = environment;

        if (Object.keys(htmlPaths).length === 0) {
          return;
        }

        const algorithm = getAlgorithm(environment);
        if (!algorithm) {
          return;
        }

        const integrityCache = new Map<string, string>();

        for (const asset of Object.keys(assets)) {
          if (!HTML_REGEX.test(asset)) {
            continue;
          }

          const htmlContent = assets[asset].source() as string;
          if (!htmlContent.includes(placeholder)) {
            continue;
          }

          assets[asset] = new sources.RawSource(
            replaceIntegrity(htmlContent, assets, algorithm, integrityCache),
          );
        }
      },
    );
  },
});
