import type { IncomingMessage, Server } from 'node:http';
import type { Http2SecureServer } from 'node:http2';
import type { Socket } from 'node:net';
import os from 'node:os';
import { posix, relative, sep } from 'node:path';
import { DEFAULT_DEV_HOST } from '../constants';
import {
  addTrailingSlash,
  color,
  isFunction,
  removeLeadingSlash,
} from '../helpers';
import { logger } from '../logger';
import type {
  InternalContext,
  NormalizedConfig,
  OutputStructure,
  PrintUrls,
  Routes,
  RsbuildEntry,
} from '../types';

/**
 * It used to subscribe http upgrade event
 */
export type UpgradeEvent = (
  req: IncomingMessage,
  socket: Socket,
  head: any,
) => void;

export type StartServerResult = {
  /**
   * The URLs that server is listening on.
   */
  urls: string[];
  /**
   * The actual port used by the server.
   */
  port: number;
  server: {
    /**
     * Close the server.
     * In development mode, this will call the `onCloseDevServer` hook.
     */
    close: () => Promise<void>;
  };
};

// remove repeat '/'
export const normalizeUrl = (url: string): string =>
  url.replace(/([^:]\/)\/+/g, '$1');

/**
 * Make sure there is slash before and after prefix
 */
const formatPrefix = (input: string | undefined) => {
  let prefix = input;

  if (prefix?.startsWith('./')) {
    prefix = prefix.replace('./', '');
  }

  if (!prefix) {
    return '/';
  }

  const hasLeadingSlash = prefix.startsWith('/');
  const hasTailSlash = prefix.endsWith('/');
  return `${hasLeadingSlash ? '' : '/'}${prefix}${hasTailSlash ? '' : '/'}`;
};

// /a + /b => /a/b
export const joinUrlSegments = (s1: string, s2: string): string => {
  if (!s1 || !s2) {
    return s1 || s2 || '';
  }

  return addTrailingSlash(s1) + removeLeadingSlash(s2);
};

export const stripBase = (path: string, base: string): string => {
  if (path === base) {
    return '/';
  }
  const trailingSlashBase = addTrailingSlash(base);

  return path.startsWith(trailingSlashBase)
    ? path.slice(trailingSlashBase.length - 1)
    : path;
};

export const getRoutes = (context: InternalContext): Routes => {
  return Object.values(context.environments).reduce<Routes>(
    (prev, environmentContext) => {
      const { distPath, config } = environmentContext;
      const distPrefix = relative(context.distPath, distPath)
        .split(sep)
        .join('/');

      const routes = formatRoutes(
        environmentContext.htmlPaths,
        context.normalizedConfig!.server.base,
        posix.join(distPrefix, config.output.distPath.html),
        config.html.outputStructure,
      );
      return prev.concat(...routes);
    },
    [],
  );
};

/*
 * format route by entry and adjust the index route to be the first
 */
export const formatRoutes = (
  entry: RsbuildEntry,
  base: string,
  distPathPrefix: string | undefined,
  outputStructure: OutputStructure | undefined,
): Routes => {
  const prefix = joinUrlSegments(base, formatPrefix(distPathPrefix));

  return (
    Object.keys(entry)
      .map((entryName) => {
        // fix case: /html/index/index.html
        const isIndex = entryName === 'index' && outputStructure !== 'nested';
        const displayName = isIndex ? '' : entryName;
        return {
          entryName,
          pathname: prefix + displayName,
        };
      })
      // adjust the index route to be the first
      .sort((a) => (a.entryName === 'index' ? -1 : 1))
  );
};

function getURLMessages(
  urls: Array<{ url: string; label: string }>,
  routes: Routes,
) {
  if (routes.length <= 1) {
    const pathname = routes.length ? routes[0].pathname : '';
    return urls
      .map(({ label, url }) => {
        const normalizedPathname = normalizeUrl(`${url}${pathname}`);
        const prefix = `➜ ${color.dim(label.padEnd(10))}`;
        return `  ${prefix}${color.cyan(normalizedPathname)}\n`;
      })
      .join('');
  }

  let message = '';
  const maxNameLength = Math.max(...routes.map((r) => r.entryName.length));
  urls.forEach(({ label, url }, index) => {
    if (index > 0) {
      message += '\n';
    }
    message += `  ${`➜ ${label}`}\n`;

    for (const r of routes) {
      message += `  ${color.dim('-')} ${color.dim(
        r.entryName.padEnd(maxNameLength + 4),
      )}${color.cyan(normalizeUrl(`${url}${r.pathname}`))}\n`;
    }
  });

  return message;
}

export function printServerURLs({
  urls: originalUrls,
  port,
  routes,
  protocol,
  printUrls,
  trailingLineBreak = true,
}: {
  urls: Array<{ url: string; label: string }>;
  port: number;
  routes: Routes;
  protocol: string;
  printUrls?: PrintUrls;
  trailingLineBreak?: boolean;
}): string | null {
  if (printUrls === false) {
    return null;
  }

  let urls = originalUrls;
  const useCustomUrl = isFunction(printUrls);

  if (useCustomUrl) {
    const newUrls = printUrls({
      urls: urls.map((item) => item.url),
      port,
      routes,
      protocol,
    });

    if (!newUrls) {
      return null;
    }

    if (!Array.isArray(newUrls)) {
      throw new Error(
        `${color.dim('[rsbuild:config]')} "server.printUrls" must return an array, but got ${typeof newUrls}.`,
      );
    }

    urls = newUrls.map((url) => ({
      url,
      label: getUrlLabel(url),
    }));
  }

  // If no urls, skip printing
  if (urls.length === 0) {
    return null;
  }

  // If no routes and not use custom url, skip printing
  if (routes.length === 0 && !useCustomUrl) {
    return null;
  }

  let message = getURLMessages(urls, routes);

  if (trailingLineBreak === false && message.endsWith('\n')) {
    message = message.slice(0, -1);
  }

  logger.log(message);

  return message;
}

/**
 * Get available free port.
 * @param port - Current port want to use.
 * @param tryLimits - Maximum number of retries.
 * @param strictPort - Whether to throw an error when the port is occupied.
 * @returns Available port number.
 */
export const getPort = async ({
  host,
  port,
  strictPort,
  tryLimits = 20,
}: {
  host: string;
  port: string | number;
  strictPort: boolean;
  tryLimits?: number;
}): Promise<number> => {
  if (typeof port === 'string') {
    port = Number.parseInt(port, 10);
  }

  if (strictPort) {
    tryLimits = 1;
  }

  const { createServer } = await import('node:net');
  const original = port;

  let found = false;
  let attempts = 0;

  while (!found && attempts <= tryLimits) {
    try {
      await new Promise((resolve, reject) => {
        const server = createServer();
        server.unref();
        server.on('error', reject);
        server.listen({ port, host }, () => {
          found = true;
          server.close(resolve);
        });
      });
    } catch (e: any) {
      if (e.code !== 'EADDRINUSE') {
        throw e;
      }
      port++;
      attempts++;
    }
  }

  if (port !== original) {
    if (strictPort) {
      throw new Error(
        `${color.dim('[rsbuild:server]')} Port ${color.yellow(
          original,
        )} is occupied, please choose another one.`,
      );
    }
  }

  return port;
};

export const getServerConfig = async ({
  config,
}: {
  config: NormalizedConfig;
}): Promise<{
  port: number;
  host: string;
  https: boolean;
  portTip: string | undefined;
}> => {
  const { host, port: originalPort, strictPort } = config.server;
  const port = await getPort({
    host,
    port: originalPort,
    strictPort,
  });
  const https = Boolean(config.server.https);
  const portTip =
    port !== originalPort
      ? `port ${originalPort} is in use, ${color.yellow(`using port ${port}.`)}`
      : undefined;

  return {
    port,
    host,
    https,
    portTip,
  };
};

const getIpv4Interfaces = () => {
  const interfaces = os.networkInterfaces();
  const ipv4Interfaces: Map<string, os.NetworkInterfaceInfo> = new Map();

  for (const key of Object.keys(interfaces)) {
    for (const detail of interfaces[key]!) {
      // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
      const familyV4Value = typeof detail.family === 'string' ? 'IPv4' : 4;

      if (
        detail.family === familyV4Value &&
        !ipv4Interfaces.has(detail.address)
      ) {
        ipv4Interfaces.set(detail.address, detail);
      }
    }
  }

  return Array.from(ipv4Interfaces.values());
};

export const isWildcardHost = (host: string): boolean => {
  const wildcardHosts = new Set([
    '0.0.0.0',
    '::',
    '0000:0000:0000:0000:0000:0000:0000:0000',
  ]);
  return wildcardHosts.has(host);
};

const isLoopbackHost = (host: string) => {
  const loopbackHosts = new Set([
    'localhost',
    '127.0.0.1',
    '::1',
    '0000:0000:0000:0000:0000:0000:0000:0001',
  ]);
  return loopbackHosts.has(host);
};

export const getHostInUrl = async (host: string): Promise<string> => {
  if (host === DEFAULT_DEV_HOST) {
    return 'localhost';
  }

  const { isIPv6 } = await import('node:net');
  if (isIPv6(host)) {
    return host === '::' ? '[::1]' : `[${host}]`;
  }
  return host;
};

const concatUrl = ({
  host,
  port,
  protocol,
}: {
  host: string;
  port: number;
  protocol: string;
}) => `${protocol}://${host}:${port}`;

const LOCAL_LABEL = 'Local:  ';
const NETWORK_LABEL = 'Network:  ';

const getUrlLabel = (url: string) => {
  try {
    const { host } = new URL(url);
    return isLoopbackHost(host) ? LOCAL_LABEL : NETWORK_LABEL;
  } catch {
    return NETWORK_LABEL;
  }
};

type AddressUrl = { label: string; url: string };

export const getAddressUrls = async ({
  protocol = 'http',
  port,
  host,
}: {
  protocol?: string;
  port: number;
  host?: string;
}): Promise<AddressUrl[]> => {
  if (host && host !== DEFAULT_DEV_HOST) {
    const url = concatUrl({
      port,
      host: await getHostInUrl(host),
      protocol,
    });
    return [
      {
        label: isLoopbackHost(host) ? LOCAL_LABEL : NETWORK_LABEL,
        url,
      },
    ];
  }

  const ipv4Interfaces = getIpv4Interfaces();
  const addressUrls: AddressUrl[] = [];
  let hasLocalUrl = false;

  for (const detail of ipv4Interfaces) {
    if (isLoopbackHost(detail.address) || detail.internal) {
      // avoid multiple prints of localhost
      // https://github.com/web-infra-dev/rsbuild/discussions/1543
      if (hasLocalUrl) {
        continue;
      }

      addressUrls.push({
        label: LOCAL_LABEL,
        url: concatUrl({ host: 'localhost', port, protocol }),
      });
      hasLocalUrl = true;
    } else {
      addressUrls.push({
        label: NETWORK_LABEL,
        url: concatUrl({ host: detail.address, port, protocol }),
      });
    }
  }

  return addressUrls;
};

export function getServerTerminator(
  server: Server | Http2SecureServer,
): () => Promise<void> {
  let listened = false;
  const pendingSockets = new Set<Socket>();

  const onConnection = (socket: Socket) => {
    pendingSockets.add(socket);
    socket.on('close', () => {
      pendingSockets.delete(socket);
    });
  };

  server.on('connection', onConnection);
  server.on('secureConnection', onConnection);
  server.once('listening', () => {
    listened = true;
  });

  return () =>
    new Promise<void>((resolve, reject) => {
      for (const socket of pendingSockets) {
        socket.destroy();
      }
      if (listened) {
        server.close((err) => (err ? reject(err) : resolve()));
      } else {
        resolve();
      }
    });
}

/**
 * Escape HTML characters
 * @example
 * escapeHtml('<div>Hello</div>') // '&lt;div&gt;Hello&lt;/div&gt;'
 */
export function escapeHtml(text: string | null | undefined): string {
  if (!text) {
    return '';
  }
  // `&` must be replaced first to avoid double-escaping
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
