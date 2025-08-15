import type { NormalizedClientConfig } from './types';

declare global {
  const RSBUILD_VERSION: string;
  const WEBPACK_HASH: string;
  const RSBUILD_CLIENT_CONFIG: NormalizedClientConfig;
  const RSBUILD_SERVER_HOST: string;
  const RSBUILD_SERVER_PORT: number;
  const RSBUILD_DEV_LIVE_RELOAD: boolean;
  const RSBUILD_WEB_SOCKET_TOKEN: string;
  const Deno: unknown;
}
