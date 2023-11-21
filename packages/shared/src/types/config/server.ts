export interface ServerConfig {
  /**
   * Specify a port number for Dev Server to listen.
   */
  port?: number;
  /**
   * After configuring this option, you can enable HTTPS Dev Server, and disabling the HTTP Dev Server.
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
}

export type NormalizedServerConfig = ServerConfig &
  Required<Pick<ServerConfig, 'port' | 'host'>>;
