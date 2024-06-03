import crypto from 'node:crypto';
import type { SriAlgorithm, SriOptions } from '@rsbuild/shared';
import type { RsbuildPlugin } from '../types';

const calcHash = (algorithm: SriAlgorithm, data: string) => {
  return crypto.createHash(algorithm).update(data).digest().toString('base64');
};

export const pluginSri = (): RsbuildPlugin => ({
  name: 'rsbuild:sri',

  setup(api) {
    api.modifyHTMLTags({
      // ensure `sri` can be applied to all tags
      order: 'post',
      handler(tags) {
        const config = api.getNormalizedConfig();
        const { sri } = config.security;

        if (!sri || (typeof sri === 'object' && !sri.enable)) {
          return tags;
        }

        const { algorithm = 'sha384' }: SriOptions = sri === true ? {} : sri;
        const allTags = [...tags.headTags, ...tags.bodyTags];

        for (const tag of allTags) {
          if (tag.tag === 'script' && tag.attrs?.src) {
            tag.attrs.integrity ??= calcHash(algorithm, 'TODO');
          }

          if (
            tag.tag === 'link' &&
            tag.attrs?.rel === 'stylesheet' &&
            tag.attrs?.href
          ) {
            tag.attrs.integrity ??= calcHash(algorithm, 'TODO');
          }
        }

        return tags;
      },
    });
  },
});
