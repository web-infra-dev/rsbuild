import { URL } from 'url';
import assert from 'assert';
import { join } from 'path';
import { fse } from '@rsbuild/shared';
import { globContentJSON, runStaticServer } from '@scripts/helper';
import type {
  CreateRsbuildOptions,
  RsbuildConfig as RspackRsbuildConfig,
} from '@rsbuild/core';
import type { RsbuildConfig as WebpackRsbuildConfig } from '@rsbuild/webpack';

export const getHrefByEntryName = (entryName: string, port: number) => {
  const baseUrl = new URL(`http://localhost:${port}`);
  const htmlRoot = new URL('/', baseUrl);
  const homeUrl = new URL(`${entryName}.html`, htmlRoot);

  return homeUrl.href;
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

export const createRsbuild = async (
  rsbuildOptions: CreateRsbuildOptions,
  rsbuildConfig: WebpackRsbuildConfig | RspackRsbuildConfig = {},
) => {
  const { createRsbuild } = await import('@rsbuild/core');

  if (process.env.PROVIDE_TYPE === 'rspack') {
    return createRsbuild({
      ...rsbuildOptions,
      rsbuildConfig,
    });
  }

  const { webpackProvider } = await import('@rsbuild/webpack');
  return createRsbuild({
    ...rsbuildOptions,
    rsbuildConfig: rsbuildConfig as WebpackRsbuildConfig,
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

const updateConfigForTest = <BundlerType>(
  config: BundlerType extends 'webpack'
    ? WebpackRsbuildConfig
    : RspackRsbuildConfig,
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

export async function dev<BundlerType = 'rspack'>({
  plugins,
  rsbuildConfig = {},
  ...options
}: CreateRsbuildOptions & {
  plugins?: any[];
  rsbuildConfig?: BundlerType extends 'webpack'
    ? WebpackRsbuildConfig
    : RspackRsbuildConfig;
}) {
  process.env.NODE_ENV = 'development';

  updateConfigForTest(rsbuildConfig);

  const rsbuild = await createRsbuild(options, rsbuildConfig);

  if (plugins) {
    rsbuild.addPlugins(plugins);
  }

  return rsbuild.startDevServer({
    printURLs: false,
  });
}

export async function build<BundlerType = 'rspack'>({
  plugins,
  runServer = false,
  rsbuildConfig = {},
  ...options
}: CreateRsbuildOptions & {
  plugins?: any[];
  runServer?: boolean;
  rsbuildConfig?: BundlerType extends 'webpack'
    ? WebpackRsbuildConfig
    : RspackRsbuildConfig;
}) {
  process.env.NODE_ENV = 'production';

  updateConfigForTest(rsbuildConfig);

  const rsbuild = await createRsbuild(options, rsbuildConfig);

  rsbuild.removePlugins(['plugin-file-size']);

  if (plugins) {
    rsbuild.addPlugins(plugins);
  }

  await rsbuild.build();

  const { distPath } = rsbuild.context;

  const { port, close } = runServer
    ? await runStaticServer(distPath, {
        port: rsbuildConfig.dev!.port,
      })
    : { port: 0, close: noop };

  const clean = async () => await fse.remove(distPath);

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
    instance: rsbuild,
  };
}
