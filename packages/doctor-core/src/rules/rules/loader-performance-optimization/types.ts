import type { SDK } from '@rsbuild/doctor-types';

export interface Config {
  /**
   * loaders which should be ignore.
   */
  ignore: (string | RegExp)[];
  /**
   * threshold which the loader total costs.
   * @unit millisecond
   * @default 5000
   */
  threshold: number;
  /**
   * the file extensions which will be match in rule check.
   * @default ["js", "css", "jpg", "jpeg", "png", "gif", "webp", "svg"]
   */
  extensions: (string | RegExp)[];
}

export interface LoaderMapValue extends SDK.LoaderTransformData {
  __resource__: SDK.ResourceData;
  __costs__: number;
}
