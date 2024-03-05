import type { CustomAtRules, TransformOptions } from 'lightningcss';

type Implementation = typeof import('lightningcss');

export type LightningCssTransformOptions = Omit<
  TransformOptions<CustomAtRules>,
  'filename' | 'code' | 'inputSourceMap'
>;

export type LightningCssLoaderOptions = LightningCssTransformOptions & {
  implementation?: Implementation;
};

export type LightningCssMinifyPluginOptions = Omit<
  LightningCssTransformOptions,
  'minify'
> & {
  implementation?: Implementation;
};

export type PluginLightningcssOptions = {
  /**
   * @see https://github.com/parcel-bundler/lightningcss/blob/master/node/index.d.ts
   * @default
   * {
   *   targets: browserslistToTargets(browserslist)
   * }
   */
  transform?: false | LightningCssLoaderOptions;
  /**
   * @see https://github.com/parcel-bundler/lightningcss/blob/master/node/index.d.ts
   * @default
   * {
   *   targets: browserslistToTargets(browserslist)
   * }
   */
  minify?: false | LightningCssMinifyPluginOptions;
};
