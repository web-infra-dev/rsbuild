import type { Rspack } from '@rsbuild/core';
import type { ConfigChainWithContext, FileFilterUtil } from '@rsbuild/shared';
import type {
  LegacyOptions as LegacySassOptions,
  Options as SassOptions,
} from 'sass-embedded';
import type SassLoader from '../compiled/sass-loader/index.js';

export type SassLoaderOptions = Omit<SassLoader.Options, 'sassOptions'> &
  (
    | {
        api?: 'legacy';
        sassOptions?: Partial<LegacySassOptions<'async'>>;
      }
    | {
        api: 'modern' | 'modern-compiler';
        sassOptions?: SassOptions<'async'>;
      }
  );

export type PluginSassOptions = {
  /**
   * Options passed to sass-loader.
   * @see https://github.com/webpack-contrib/sass-loader
   */
  sassLoaderOptions?: ConfigChainWithContext<
    SassLoaderOptions,
    {
      /**
       * @deprecated
       * use `exclude` option instead.
       */
      addExcludes: FileFilterUtil;
    }
  >;

  /**
   * Exclude some `.scss` or `.sass` files, they will not be transformed by sass-loader.
   */
  exclude?: Rspack.RuleSetCondition;
};
