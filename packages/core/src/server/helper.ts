import net from 'node:net';
import {
  color,
  logger,
  deepmerge,
  isFunction,
  getUrlLabel,
  normalizeUrl,
  DEFAULT_PORT,
  DEFAULT_DEV_HOST,
} from '@rsbuild/shared';
import type {
  Routes,
  DevConfig,
  PrintUrls,
  RsbuildEntry,
  RsbuildConfig,
  OutputStructure,
} from '@rsbuild/shared';

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

export const mergeDevOptions = ({
  rsbuildConfig,
  port,
}: {
  rsbuildConfig: RsbuildConfig;
  port: number;
}) => {
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
  };

  const devConfig = rsbuildConfig.dev
    ? deepmerge(defaultDevConfig, rsbuildConfig.dev)
    : defaultDevConfig;

  return devConfig;
};

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

export const getServerOptions = async ({
  rsbuildConfig,
  getPortSilently,
}: {
  rsbuildConfig: RsbuildConfig;
  getPortSilently?: boolean;
}) => {
  const host = rsbuildConfig.server?.host || DEFAULT_DEV_HOST;
  const port = await getPort({
    host,
    port: rsbuildConfig.server?.port || DEFAULT_PORT,
    strictPort: rsbuildConfig.server?.strictPort || false,
    silent: getPortSilently,
  });

  const https = Boolean(rsbuildConfig.server?.https) || false;

  return { port, host, https, serverConfig: rsbuildConfig.server || {} };
};

export const getDevOptions = async ({
  rsbuildConfig,
  getPortSilently,
}: {
  rsbuildConfig: RsbuildConfig;
  getPortSilently?: boolean;
}) => {
  const { port, host, https, serverConfig } = await getServerOptions({
    rsbuildConfig,
    getPortSilently,
  });

  const devConfig = mergeDevOptions({ rsbuildConfig, port });

  return {
    devServerConfig: {
      ...serverConfig,
      ...devConfig,
    },
    port,
    host,
    https,
  };
};
