import type { CrossOrigin } from '@rsbuild/core';

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
  onFail?: (context: AssetsRetryHookContext) => void;
  /**
   * The callback function when the asset is being retried.
   */
  onRetry?: (context: AssetsRetryHookContext) => void;
  /**
   * The callback function when the asset is successfully retried.
   */
  onSuccess?: (context: AssetsRetryHookContext) => void;
  /**
   * The function to add query parameters to the URL of the asset being retried.
   * @param times e.g: 1 -> 2 -> 3
   * @param originalQuery initial request url's query e.g: <script src="https://cdn.com/a.js?version=1"></script> -> "?version=1"
   * @default false
   * @description true -> hasQuery(originalQuery) ? `${getQuery(originalQuery)}&retry=${existRetryTimes}` : `?retry=${existRetryTimes}`
   */
  addQuery?:
    | boolean
    | ((context: { times: number; originalQuery: string }) => string);
  /**
   * Whether to inline the runtime JavaScript code of Assets Retry plugin into the HTML file.
   * @default true
   */
  inlineScript?: boolean;
  /**
   * Whether to minify the runtime JavaScript code of Assets Retry plugin.
   * @default rsbuildConfig.mode === 'production'
   */
  minify?: boolean;
  /**
   * The delay time between retries. Unit: ms
   * @default 0
   */
  delay?: number | ((context: AssetsRetryHookContext) => number);
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
  isAsyncChunk: boolean;
};
