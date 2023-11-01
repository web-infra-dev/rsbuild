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

export type UniBuilderWebpackConfig = RsbuildWebpackConfig & {};

export type UniBuilderRspackConfig = RsbuildRspackConfig & {};

export type BuilderConfig<B = 'rspack'> = B extends 'rspack'
  ? UniBuilderRspackConfig
  : UniBuilderWebpackConfig;
