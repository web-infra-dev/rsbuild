import prodServer, {
  Logger,
  type ModernServerOptions,
} from '@modern-js/prod-server';
import chalk from 'chalk';
import { logger as defaultLogger } from './logger';
import { DEFAULT_PORT, DEFAULT_DEV_HOST } from './constants';
import type { Context, StartServerResult, SharedRsbuildConfig } from './types';

export const getServerOptions = (
  builderConfig: SharedRsbuildConfig,
): ModernServerOptions['config'] => {
  return {
    output: {
      path: builderConfig.output?.distPath?.root,
      assetPrefix: builderConfig.output?.assetPrefix,
      distPath: builderConfig.output?.distPath,
    },
    source: {
      alias: {},
    },
    html: {},
    tools: {
      babel: {},
    },
    server: {},
    runtime: {},
    bff: {},
  };
};

export async function printServerURLs(
  urls: Array<{ url: string; label: string }>,
  name = 'Server',
  logger: Logger = defaultLogger,
) {
  let message = `${name} running at:\n\n`;

  message += urls
    .map(
      ({ label, url }) =>
        `  ${`> ${label.padEnd(10)}`}${chalk.cyanBright(url)}\n`,
    )
    .join('');

  logger.info(message);
}

export async function startProdServer(
  context: Context,
  builderConfig: SharedRsbuildConfig,
) {
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
  }

  const { getPort } = await import('@modern-js/utils');

  const port = await getPort(builderConfig.dev?.port || DEFAULT_PORT);
  const server = await prodServer({
    pwd: context.rootPath,
    config: getServerOptions(builderConfig),
  });

  await server.init();

  return new Promise<StartServerResult>((resolve) => {
    server.listen(
      {
        host: DEFAULT_DEV_HOST,
        port,
      },
      async (err: Error) => {
        if (err) {
          throw err;
        }

        const { getAddressUrls } = await import('@modern-js/utils');
        const urls = getAddressUrls('http', port);

        await printServerURLs(urls);
        resolve({
          port,
          urls: urls.map((item) => item.url),
          server,
        });
      },
    );
  });
}
