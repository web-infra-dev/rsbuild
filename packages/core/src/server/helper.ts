import {
  color,
  logger as defaultLogger,
  getPort,
  deepmerge,
  isFunction,
  normalizeUrl,
  DEFAULT_PORT,
  DEFAULT_DEV_HOST,
} from '@rsbuild/shared';
import type {
  Logger,
  Routes,
  DevConfig,
  PrintUrls,
  RsbuildEntry,
  RsbuildConfig,
  OutputStructure,
} from '@rsbuild/shared';

/*
 * format route by entry and adjust the index route to be the first
 */
export const formatRoutes = (
  entry: RsbuildEntry,
  prefix: string | undefined,
  outputStructure: OutputStructure | undefined,
): Routes => {
  return (
    Object.keys(entry)
      .map((name) => ({
        name,
        route:
          (prefix ? `${prefix}/` : '') +
          // fix case: /html/index/index.html
          (name === 'index' && outputStructure !== 'nested' ? '' : name),
      }))
      // adjust the index route to be the first
      .sort((a) => (a.name === 'index' ? -1 : 1))
  );
};

export function printServerURLs({
  urls,
  port,
  routes,
  protocol,
  printUrls,
  logger = defaultLogger,
}: {
  urls: Array<{ url: string; label: string }>;
  port: number;
  routes: Routes;
  logger?: Logger;
  protocol: string;
  printUrls?: PrintUrls;
}) {
  if (printUrls === false) {
    return;
  }

  if (isFunction(printUrls)) {
    printUrls({
      urls: urls.map((item) => item.url),
      port,
      protocol,
    });
    return;
  }

  let message = '';

  if (routes.length === 1) {
    message = urls
      .map(
        ({ label, url }) =>
          `  ${`> ${label.padEnd(10)}`}${color.cyan(
            normalizeUrl(`${url}/${routes[0].route}`),
          )}\n`,
      )
      .join('');
  } else {
    const maxNameLength = Math.max(...routes.map((r) => r.name.length));
    urls.forEach(({ label, url }, index) => {
      if (index > 0) {
        message += '\n';
      }
      message += `  ${`> ${label}`}\n`;
      routes.forEach((r) => {
        message += `  ${color.dim('-')} ${color.dim(
          r.name.padEnd(maxNameLength + 4),
        )}${color.cyan(normalizeUrl(`${url}/${r.route}`))}\n`;
      });
    });
  }

  logger.log(message);
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
      protocol: '',
    },
    writeToDisk: false,
  };

  const devConfig = rsbuildConfig.dev
    ? deepmerge(defaultDevConfig, rsbuildConfig.dev)
    : defaultDevConfig;

  return devConfig;
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
