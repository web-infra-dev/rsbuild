export type HtmlFallback = false | 'index';

export interface ServerConfig {
  headers?: Record<string, string | string[]>;
  htmlFallback?: HtmlFallback;
}

export type NormalizedServerConfig = ServerConfig &
  Required<Pick<ServerConfig, 'htmlFallback'>>;
