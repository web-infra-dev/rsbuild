import type lightningcss from 'lightningcss';
import type { CustomAtRules, TransformOptions } from 'lightningcss';

export type Lightningcss = typeof lightningcss;

export type LightningCSSTransformOptions = Omit<
  TransformOptions<CustomAtRules>,
  'filename' | 'code' | 'inputSourceMap'
>;

export type LightningCSSLoaderOptions = LightningCSSTransformOptions & {
  implementation?: Lightningcss;
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
   * lightningcss instance
   * @example
   * import { pluginLightningcss } from '@rsbuild/plugin-lightningcss';
   * import * as lightningcss from 'lightningcss';
   *
   * pluginLightningcss({
   *    implementation: lightningcss,
   * })
   */
  implementation?: unknown; // loose type of `typeof import('lightningcss')`
};
