import type { IncomingMessage, ServerResponse } from 'http';
import type { Options as BaseProxyOptions } from '../../../compiled/http-proxy-middleware';

export type HtmlFallback = false | 'index';

export type ProxyDetail = BaseProxyOptions & {
  bypass?: (
    req: IncomingMessage,
    res: ServerResponse,
    proxyOptions: ProxyOptions,
  ) => string | undefined | null | false;
  context?: string | string[];
};

export type ProxyOptions =
  | Record<string, string>
  | Record<string, ProxyDetail>
  | ProxyDetail[]
  | ProxyDetail;

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
  /**
   * Configure proxy rules for the dev server or preview server to proxy requests to the specified service.
   */
  proxy?: ProxyOptions;
}

export type NormalizedServerConfig = ServerConfig &
  Required<Pick<ServerConfig, 'htmlFallback' | 'port' | 'host'>>;
