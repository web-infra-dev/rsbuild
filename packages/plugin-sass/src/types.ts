import type { ConfigChainWithContext, Rspack } from '@rsbuild/core';
import type {
  LegacyOptions as LegacySassOptions,
  Options as SassOptions,
} from 'sass-embedded';
import type SassLoader from '../compiled/sass-loader/index.js';

export type SassLoaderOptions = Omit<
  SassLoader.Options,
  'sassOptions' | 'additionalData'
> &
  (
    | {
        api?: 'legacy';
        sassOptions?: Partial<LegacySassOptions<'async'>>;
      }
    | {
        api: 'modern' | 'modern-compiler';
        sassOptions?: SassOptions<'async'>;
      }
  ) & {
    // @types/sass-loader is outdated
    // see https://github.com/web-infra-dev/rsbuild/issues/2582
    additionalData?:
      | string
      | ((
          content: string | Buffer,
          loaderContext: Rspack.LoaderContext,
        ) => string);
  };

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
      addExcludes: (items: string | RegExp | Array<string | RegExp>) => void;
    }
  >;

  /**
   * Exclude some `.scss` or `.sass` files, they will not be transformed by sass-loader.
   */
  exclude?: Rspack.RuleSetCondition;
};
