import type { CrossOrigin } from '@rsbuild/shared';

export type PluginAssetsRetryOptions = {
  max?: number;
  type?: string[];
  test?: string | ((url: string) => boolean);
  domain?: string[];
  crossOrigin?: boolean | CrossOrigin;
  inlineScript?: boolean;
  onFail?: (options: AssetsRetryHookContext) => void;
  onRetry?: (options: AssetsRetryHookContext) => void;
  onSuccess?: (options: AssetsRetryHookContext) => void;
};

export type AssetsRetryHookContext = {
  url: string;
  times: number;
  domain: string;
  tagName: string;
};
