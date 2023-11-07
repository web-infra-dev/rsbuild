import type { MetaOptions, ScriptInject } from '@rsbuild/shared';
import type { RsbuildConfig as RsbuildRspackConfig } from '@rsbuild/core/rspack-provider';
import type { RsbuildConfig as RsbuildWebpackConfig } from '@rsbuild/webpack';

export type CreateWebpackBuilderOptions = {
  bundlerType: 'webpack';
  config: UniBuilderWebpackConfig;
};

export type CreateRspackBuilderOptions = {
  bundlerType: 'rspack';
  config: UniBuilderRspackConfig;
};

export type CreateUniBuilderOptions =
  | CreateWebpackBuilderOptions
  | CreateRspackBuilderOptions;

export type RsbuildConfig<B = 'rspack'> = B extends 'rspack'
  ? RsbuildRspackConfig
  : RsbuildWebpackConfig;

export type UniBuilderExtraConfig = {
  output?: {
    /**
     * @deprecated use `output.cssModules.localIdentName` instead
     */
    cssModuleLocalIdentName?: string;
    /**
     * Whether to generate a manifest file that contains information of all assets.
     */
    enableAssetManifest?: boolean;
  };
  html?: {
    /**
     * @deprecated use `html.meta` instead
     */
    metaByEntries?: Record<string, MetaOptions>;
    /**
     * @deprecated use `html.title` instead
     */
    titleByEntries?: Record<string, string>;
    /**
     * @deprecated use `html.favicon` instead
     */
    faviconByEntries?: Record<string, string | undefined>;
    /**
     * @deprecated use `html.inject` instead
     */
    injectByEntries?: Record<string, ScriptInject>;
    /**
     * @deprecated use `html.template` instead
     */
    templateByEntries?: Partial<Record<string, string>>;
  };
};

export type UniBuilderWebpackConfig = RsbuildWebpackConfig &
  UniBuilderExtraConfig;

export type UniBuilderRspackConfig = RsbuildRspackConfig &
  UniBuilderExtraConfig;

export type BuilderConfig<B = 'rspack'> = B extends 'rspack'
  ? UniBuilderRspackConfig
  : UniBuilderWebpackConfig;
