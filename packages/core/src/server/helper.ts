import type { IncomingMessage } from 'node:http';
import net from 'node:net';
import type { Socket } from 'node:net';
import os from 'node:os';
import {
  DEFAULT_DEV_HOST,
  DEFAULT_PORT,
  color,
  deepmerge,
  isFunction,
  logger,
  normalizeUrl,
} from '@rsbuild/shared';
import type {
  DevConfig,
  NormalizedConfig,
  OutputStructure,
  PrintUrls,
  Routes,
  RsbuildEntry,
} from '@rsbuild/shared';

/**
 * It used to subscribe http upgrade event
 */
export type UpgradeEvent = (
  req: IncomingMessage,
  socket: Socket,
  head: any,
) => void;

export type StartServerResult = {
  urls: string[];
  port: number;
  server: {
    close: () => Promise<void>;
  };
};

/**
 * Make sure there is slash before and after prefix
 */
const formatPrefix = (prefix: string | undefined) => {
  if (!prefix) {
    return '/';
  }

  const hasLeadingSlash = prefix.startsWith('/');
  const hasTailSlash = prefix.endsWith('/');
  return `${hasLeadingSlash ? '' : '/'}${prefix}${hasTailSlash ? '' : '/'}`;
};

/*
 * format route by entry and adjust the index route to be the first
 */
export const formatRoutes = (
  entry: RsbuildEntry,
  prefix: string | undefined,
  outputStructure: OutputStructure | undefined,
): Routes => {
  const formattedPrefix = formatPrefix(prefix);

  return (
    Object.keys(entry)
      .map((entryName) => {
        // fix case: /html/index/index.html
        const isIndex = entryName === 'index' && outputStructure !== 'nested';
        const displayName = isIndex ? '' : entryName;
        return {
          entryName,
          pathname: formattedPrefix + displayName,
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
  if (routes.length === 1) {
    return urls
      .map(
        ({ label, url }) =>
          `  ${`> ${label.padEnd(10)}`}${color.cyan(
            normalizeUrl(`${url}${routes[0].pathname}`),
          )}\n`,
      )
      .join('');
  }

  let message = '';
  const maxNameLength = Math.max(...routes.map((r) => r.entryName.length));
  urls.forEach(({ label, url }, index) => {
    if (index > 0) {
      message += '\n';
    }
    message += `  ${`> ${label}`}\n`;

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
}: {
  urls: Array<{ url: string; label: string }>;
  port: number;
  routes: Routes;
  protocol: string;
  printUrls?: PrintUrls;
}) {
  if (printUrls === false) {
    return;
  }

  let urls = originalUrls;

  if (isFunction(printUrls)) {
    const newUrls = printUrls({
      urls: urls.map((item) => item.url),
      port,
      routes,
      protocol,
    });

    if (!newUrls) {
      return;
    }

    if (!Array.isArray(newUrls)) {
      throw new Error(
        `"server.printUrls" must return an array, but got ${typeof newUrls}.`,
      );
    }

    urls = newUrls.map((url) => ({
      url,
      label: getUrlLabel(url),
    }));
  }

  if (urls.length === 0) {
    return;
  }

  const message = getURLMessages(urls, routes);
  logger.log(message);

  return message;
}

/**
 * hmr socket connect path
 */
export const HMR_SOCK_PATH = '/rsbuild-hmr';

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
  silent = false,
}: {
  host: string;
  port: string | number;
  strictPort: boolean;
  tryLimits?: number;
  silent?: boolean;
}): Promise<number> => {
  if (typeof port === 'string') {
    port = Number.parseInt(port, 10);
  }

  if (strictPort) {
    tryLimits = 1;
  }

  const original = port;

  let found = false;
  let attempts = 0;
  while (!found && attempts <= tryLimits) {
    try {
      await new Promise((resolve, reject) => {
        const server = net.createServer();
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
        `Port "${original}" is occupied, please choose another one.`,
      );
    }
    if (!silent) {
      logger.info(
        `Port ${original} is in use, ${color.yellow(`using port ${port}.`)}\n`,
      );
    }
  }

  return port;
};

export const getServerConfig = async ({
  config,
  getPortSilently,
}: {
  config: NormalizedConfig;
  getPortSilently?: boolean;
}) => {
  const host = config.server.host || DEFAULT_DEV_HOST;
  const port = await getPort({
    host,
    port: config.server.port || DEFAULT_PORT,
    strictPort: config.server.strictPort || false,
    silent: getPortSilently,
  });
  const https = Boolean(config.server.https) || false;
  return { port, host, https };
};

export const getDevConfig = ({
  config,
  port,
}: {
  config: NormalizedConfig;
  port: number;
}): DevConfig => {
  const defaultDevConfig: DevConfig = {
    client: {
      path: HMR_SOCK_PATH,
      port: port.toString(),
      // By default it is set to "location.hostname"
      host: '',
      // By default it is set to "location.protocol === 'https:' ? 'wss' : 'ws'""
      protocol: undefined,
    },
    writeToDisk: false,
    liveReload: true,
  };

  const devConfig = config.dev
    ? deepmerge(defaultDevConfig, config.dev)
    : defaultDevConfig;

  return devConfig;
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

const isLoopbackHost = (host: string) => {
  const loopbackHosts = [
    'localhost',
    '127.0.0.1',
    '::1',
    '0000:0000:0000:0000:0000:0000:0000:0001',
  ];
  return loopbackHosts.includes(host);
};

const getHostInUrl = (host: string) => {
  if (net.isIPv6(host)) {
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

export const getUrlLabel = (url: string) => {
  try {
    const { host } = new URL(url);
    return isLoopbackHost(host) ? LOCAL_LABEL : NETWORK_LABEL;
  } catch (err) {
    return NETWORK_LABEL;
  }
};

type AddressUrl = { label: string; url: string };

export const getAddressUrls = ({
  protocol = 'http',
  port,
  host,
}: {
  protocol?: string;
  port: number;
  host?: string;
}): AddressUrl[] => {
  if (host && host !== DEFAULT_DEV_HOST) {
    return [
      {
        label: isLoopbackHost(host) ? LOCAL_LABEL : NETWORK_LABEL,
        url: concatUrl({
          port,
          host: getHostInUrl(host),
          protocol,
        }),
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
