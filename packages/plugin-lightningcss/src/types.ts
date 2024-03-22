import type { CustomAtRules, TransformOptions } from 'lightningcss';

export type LightningCSSTransformOptions = Omit<
  TransformOptions<CustomAtRules>,
  'filename' | 'code' | 'inputSourceMap'
>;

type Implementation = unknown; // loose type of `typeof import('lightningcss')`

export type LightningCSSLoaderOptions = LightningCSSTransformOptions & {
  implementation?: Implementation;
};

export type LightningCSSMinifyPluginOptions = Omit<
  LightningCSSTransformOptions,
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
  transform?: boolean | LightningCSSTransformOptions;
  /**
   * @see https://github.com/parcel-bundler/lightningcss/blob/master/node/index.d.ts
   * @default
   * {
   *   targets: browserslistToTargets(browserslist)
   * }
   */
  minify?: boolean | LightningCSSTransformOptions;
  /**
   * lightningcss instance
   * @example
   * import { pluginLightningcss } from '@rsbuild/plugin-lightningcss';
   * import lightningcss from 'lightningcss';
   * pluginLightningcss({
   *    implementation: lightningcss,
   *    minify: {
   *      exclude: lightningcss.Features.ColorFunction
   *    }
   * })
   */
  implementation?: Implementation;
};
