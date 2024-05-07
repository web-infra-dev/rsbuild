import type { CrossOrigin } from '@rsbuild/shared';

export type PluginAssetsRetryOptions = {
  /**
   * The maximum number of retries for a single asset.
   * @default 3
   */
  max?: number;
  /**
   * Used to specify the HTML tag types that need to be retried.
   * @default ['script', 'link', 'img']
   */
  type?: string[];
  /**
   * The test function of the asset to be retried.
   */
  test?: string | ((url: string) => boolean);
  /**
   * Specifies the retry domain when assets fail to load.
   */
  domain?: string[];
  /**
   * Set the `crossorigin` attribute for tags.
   * @default config.html.crossorigin
   */
  crossOrigin?: boolean | CrossOrigin;
  /**
   * The callback function when the asset is failed to be retried.
   */
  onFail?: (options: AssetsRetryHookContext) => void;
  /**
   * The callback function when the asset is being retried.
   */
  onRetry?: (options: AssetsRetryHookContext) => void;
  /**
   * The callback function when the asset is successfully retried.
   */
  onSuccess?: (options: AssetsRetryHookContext) => void;
  /**
   * The function to add query parameters to the URL of the asset being retried.
   * @param existRetryTimes e.g: 1 -> 2 -> 3
   * @default false
   * @description true -> `?retry=${existRetryTimes}`
   */
  addQuery?: boolean | ((existRetryTimes: number) => string);
  /**
   * Whether to inline the runtime JavaScript code of Assets Retry plugin into the HTML file.
   * @default true
   */
  inlineScript?: boolean;
  /**
   * Whether to minify the runtime JavaScript code of Assets Retry plugin.
   * @default process.env.NODE_ENV === 'production'
   */
  minify?: boolean;
};

export type RuntimeRetryOptions = Omit<
  PluginAssetsRetryOptions,
  'inlineScript' | 'minify'
>;

export type AssetsRetryHookContext = {
  url: string;
  times: number;
  domain: string;
  tagName: string;
};
