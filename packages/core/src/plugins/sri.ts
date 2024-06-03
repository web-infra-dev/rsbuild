import type { Buffer } from 'node:buffer';
import crypto from 'node:crypto';
import {
  type Rspack,
  type SriAlgorithm,
  type SriOptions,
  isDev,
  removeLeadingSlash,
} from '@rsbuild/shared';
import type { RsbuildPlugin } from '../types';

const getIntegrity = (algorithm: SriAlgorithm, data: Buffer) => {
  const hash = crypto
    .createHash(algorithm)
    .update(data)
    .digest()
    .toString('base64');
  return `${algorithm}-${hash}`;
};

const getAssetName = (url: string, assetPrefix: string) => {
  if (url.startsWith(assetPrefix)) {
    return removeLeadingSlash(url.replace(assetPrefix, ''));
  }
  return removeLeadingSlash(url);
};

const getAssetContent = (
  url: string,
  assetPrefix: string,
  compilation: Rspack.Compilation,
) => {
  if (url === '') {
    return null;
  }

  const assetName = getAssetName(url, assetPrefix);
  const source = compilation.assets[assetName];

  if (!source) {
    return null;
  }

  return source.buffer() as Buffer;
};

export const pluginSri = (): RsbuildPlugin => ({
  name: 'rsbuild:sri',

  setup(api) {
    api.modifyHTMLTags({
      // ensure `sri` can be applied to all tags
      order: 'post',
      handler(tags, { compilation, assetPrefix }) {
        const config = api.getNormalizedConfig();
        const { sri } = config.security;

        if (
          sri === false ||
          (sri === true && isDev()) ||
          (typeof sri === 'object' && !sri.enable)
        ) {
          return tags;
        }

        const { algorithm = 'sha384' }: SriOptions = sri === true ? {} : sri;
        const allTags = [...tags.headTags, ...tags.bodyTags];

        for (const tag of allTags) {
          if (tag.tag === 'script' && typeof tag.attrs?.src === 'string') {
            const content = getAssetContent(
              tag.attrs.src,
              assetPrefix,
              compilation,
            );

            if (!content) {
              continue;
            }

            tag.attrs.integrity ??= getIntegrity(algorithm, content);
          } else if (
            tag.tag === 'link' &&
            tag.attrs &&
            tag.attrs.rel === 'stylesheet' &&
            typeof tag.attrs.href === 'string'
          ) {
            const content = getAssetContent(
              tag.attrs.href,
              assetPrefix,
              compilation,
            );

            if (!content) {
              continue;
            }

            tag.attrs.integrity ??= getIntegrity(algorithm, content);
          }
        }

        return tags;
      },
    });
  },
});
