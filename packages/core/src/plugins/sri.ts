import type { Buffer } from 'node:buffer';
import crypto from 'node:crypto';
import {
  type Rspack,
  type SriAlgorithm,
  type SriOptions,
  isDev,
  isHtmlDisabled,
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

const getAsset = (
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

  return {
    name: assetName,
    content: source.buffer() as Buffer,
  };
};

export const pluginSri = (): RsbuildPlugin => ({
  name: 'rsbuild:sri',

  setup(api) {
    const integrityMap = new Map<
      // asset name
      string,
      {
        content: Buffer;
        integrity: string;
        htmlFiles: string[];
      }
    >();

    const getAlgorithm = () => {
      const config = api.getNormalizedConfig();
      const { sri } = config.security;

      if (
        sri === false ||
        (sri === true && isDev()) ||
        (typeof sri === 'object' && !sri.enable)
      ) {
        return null;
      }

      const { algorithm = 'sha384' }: SriOptions = sri === true ? {} : sri;

      return algorithm;
    };

    api.modifyHTMLTags({
      // ensure `sri` can be applied to all tags
      order: 'post',
      handler(tags, { compilation, assetPrefix, filename }) {
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

          const asset = getAsset(url, assetPrefix, compilation);

          if (!asset) {
            continue;
          }

          const cached = integrityMap.get(asset.name);
          if (cached) {
            if (!cached.htmlFiles.includes(filename)) {
              integrityMap.set(asset.name, {
                ...cached,
                htmlFiles: [...cached.htmlFiles, filename],
              });
            }
            continue;
          }

          const integrity = getIntegrity(algorithm, asset.content);
          tag.attrs.integrity ??= integrity;

          integrityMap.set(asset.name, {
            content: asset.content,
            integrity,
            htmlFiles: [filename],
          });
        }

        return tags;
      },
    });

    class SriUpdateIntegrityPlugin {
      apply(compiler: Rspack.Compiler) {
        compiler.hooks.compilation.tap(
          'SriUpdateIntegrityPlugin',
          (compilation) => {
            compilation.hooks.processAssets.tapPromise(
              {
                name: 'SriUpdateIntegrityPlugin',
                // use to final stage to get the final asset content
                stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_REPORT,
              },
              async (assets) => {
                const algorithm = getAlgorithm();

                if (!algorithm) {
                  return;
                }

                for (const asset of Object.keys(assets)) {
                  if (integrityMap.get(asset)) {
                    console.log(asset);
                  }
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

      chain.plugin('rsbuild-sri').use(SriUpdateIntegrityPlugin);
    });
  },
});
