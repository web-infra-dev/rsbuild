import { URL } from 'url';
import assert from 'assert';
import { join } from 'path';
import { fs } from '@rsbuild/shared/fs-extra';
import { globContentJSON, runStaticServer } from '@scripts/helper';
import type {
  CreateBuilderOptions,
  BuilderConfig as RspackBuilderConfig,
} from '@rsbuild/core';
import type { BuilderConfig as WebpackBuilderConfig } from '@rsbuild/webpack';
import { StartDevServerOptions } from '@rsbuild/shared';

export const getHrefByEntryName = (entryName: string, port: number) => {
  const baseUrl = new URL(`http://localhost:${port}`);
  const htmlRoot = new URL('/', baseUrl);
  const homeUrl = new URL(`${entryName}.html`, htmlRoot);

  return homeUrl.href;
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

export const createBuilder = async (
  builderOptions: CreateBuilderOptions,
  builderConfig: WebpackBuilderConfig | RspackBuilderConfig = {},
) => {
  const { createBuilder } = await import('@rsbuild/core');

  if (process.env.PROVIDE_TYPE === 'rspack') {
    return createBuilder({
      ...builderOptions,
      builderConfig,
    });
  }

  const { webpackProvider } = await import('@rsbuild/webpack');
  return createBuilder({
    ...builderOptions,
    builderConfig: builderConfig as WebpackBuilderConfig,
    provider: webpackProvider,
  });
};

const portMap = new Map();

function getRandomPort(defaultPort = Math.ceil(Math.random() * 10000) + 10000) {
  let port = defaultPort;
  while (true) {
    if (!portMap.get(port)) {
      portMap.set(port, 1);
      return port;
    } else {
      port++;
    }
  }
}

const updateConfigForTest = <BuilderType>(
  config: BuilderType extends 'webpack'
    ? WebpackBuilderConfig
    : RspackBuilderConfig,
) => {
  // make devPort random to avoid port conflict
  config.dev = {
    ...(config.dev || {}),
    port: getRandomPort(config.dev?.port),
  };

  config.dev!.progressBar = config.dev!.progressBar || false;

  if (!config.performance?.buildCache) {
    config.performance = {
      ...(config.performance || {}),
      buildCache: false,
    };
  }

  // disable polyfill to make the tests faster
  if (config.output?.polyfill === undefined) {
    config.output = {
      ...(config.output || {}),
      polyfill: 'off',
    };
  }
};

export async function dev<BuilderType = 'rspack'>({
  serverOptions,
  builderConfig = {},
  ...options
}: CreateBuilderOptions & {
  builderConfig?: BuilderType extends 'webpack'
    ? WebpackBuilderConfig
    : RspackBuilderConfig;
  serverOptions?: StartDevServerOptions['serverOptions'];
}) {
  process.env.NODE_ENV = 'development';

  updateConfigForTest(builderConfig);

  const builder = await createBuilder(options, builderConfig);
  return builder.startDevServer({
    printURLs: false,
    serverOptions,
  });
}

export async function build<BuilderType = 'rspack'>({
  plugins,
  runServer = false,
  builderConfig = {},
  ...options
}: CreateBuilderOptions & {
  plugins?: any[];
  runServer?: boolean;
  builderConfig?: BuilderType extends 'webpack'
    ? WebpackBuilderConfig
    : RspackBuilderConfig;
}) {
  process.env.NODE_ENV = 'production';

  updateConfigForTest(builderConfig);

  // todo: support test swc (add swc plugin) use providerType 'webpack-swc'?
  const builder = await createBuilder(options, builderConfig);

  builder.removePlugins(['plugin-file-size']);

  if (plugins) {
    builder.addPlugins(plugins);
  }

  await builder.build();

  const { distPath } = builder.context;

  const { port, close } = runServer
    ? await runStaticServer(distPath, {
        port: builderConfig.dev!.port,
      })
    : { port: 0, close: noop };

  const clean = async () => await fs.remove(distPath);

  const unwrapOutputJSON = async (ignoreMap = true) => {
    return globContentJSON(distPath, {
      absolute: true,
      ignore: ignoreMap ? [join(distPath, '/**/*.map')] : [],
    });
  };

  const getIndexFile = async () => {
    const files = await unwrapOutputJSON();
    const [name, content] =
      Object.entries(files).find(
        ([file]) => file.includes('index') && file.endsWith('.js'),
      ) || [];

    assert(name);

    return {
      content: content!,
      size: content!.length / 1024,
    };
  };

  return {
    distPath,
    port,
    clean,
    close,
    unwrapOutputJSON,
    getIndexFile,
    providerType: process.env.PROVIDE_TYPE || 'rspack',
    instance: builder,
  };
}
