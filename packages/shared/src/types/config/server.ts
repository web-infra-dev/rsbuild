export type HtmlFallback = false | 'index';

export interface ServerConfig {
  /**
   * Specify a port number for Dev Server to listen.
   */
  port?: number;
  /**
   * After configuring this option, you can enable HTTPS Server, and disabling the HTTP Server.
   */
  https?: { key: string; cert: string };
  /**
   * Used to set the host of Dev Server.
   */
  host?: string;
  /**
   * Adds headers to all responses.
   */
  headers?: Record<string, string | string[]>;
  htmlFallback?: HtmlFallback;
}

export type NormalizedServerConfig = ServerConfig &
  Required<Pick<ServerConfig, 'htmlFallback' | 'port' | 'host'>>;
