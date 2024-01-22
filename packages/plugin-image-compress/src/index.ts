import type { RsbuildPlugin } from '@rsbuild/core';
import assert from 'node:assert';
import { ImageMinimizerPlugin } from './minimizer';
import { withDefaultOptions } from './shared/utils';
import type { Codecs, Options } from './types';

export type PluginImageCompressOptions = Options[];
export const DEFAULT_OPTIONS: Codecs[] = ['jpeg', 'png', 'ico'];

export interface IPluginImageCompress {
  (...options: Options[]): RsbuildPlugin;
  (options: Options[]): RsbuildPlugin;
}

const castOptions = (args: (Options | Options[])[]): Options[] => {
  const head = args[0];
  // expect [['png', { use: 'jpeg' }]]
  if (Array.isArray(head)) {
    return head;
  }
  // expect ['png', { use: 'jpeg' }]
  const ret: Options[] = [];
  for (const arg of args) {
    assert(!Array.isArray(arg));
    ret.push(arg);
  }
  return ret;
};

const normalizeOptions = (options: Options[]) => {
  const opts = options.length ? options : DEFAULT_OPTIONS;
  const normalized = opts.map((opt) => withDefaultOptions(opt));
  return normalized;
};

/** Options enable by default: {@link DEFAULT_OPTIONS} */
export const pluginImageCompress: IPluginImageCompress = (
  ...args
): RsbuildPlugin => ({
  name: 'rsbuild:image-compress',

  setup(api) {
    const opts = normalizeOptions(castOptions(args));

    api.modifyBundlerChain((chain, { isProd }) => {
      if (!isProd) {
        return;
      }

      chain.optimization.minimize(true);

      for (const opt of opts) {
        chain.optimization
          .minimizer(`image-compress-${opt.use}`)
          .use(ImageMinimizerPlugin, [opt]);
      }
    });
  },
});
