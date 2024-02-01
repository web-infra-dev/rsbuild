import net from 'node:net';
import { URL } from 'node:url';
import assert from 'node:assert';
import { join } from 'node:path';
import { fse } from '@rsbuild/shared';
import { globContentJSON } from './helper';
import { pluginSwc } from '@rsbuild/plugin-swc';
import type {
  RsbuildConfig,
  RsbuildPlugin,
  CreateRsbuildOptions,
} from '@rsbuild/core';
import type { Page } from 'playwright';

export const getHrefByEntryName = (entryName: string, port: number) => {
  const htmlRoot = new URL(`http://localhost:${port}`);
  const homeUrl = new URL(`${entryName}.html`, htmlRoot);

  return homeUrl.href;
};

export const gotoPage = async (
  page: Page,
  rsbuild: { port: number },
  path = 'index',
) => {
  const url = getHrefByEntryName(path, rsbuild.port);
  return page.goto(url);
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = async () => {};

export const createRsbuild = async (
  rsbuildOptions: CreateRsbuildOptions,
  plugins: RsbuildPlugin[] = [],
) => {
  const { createRsbuild } = await import('@rsbuild/core');

  if (process.env.PROVIDE_TYPE === 'rspack') {
    const rsbuild = await createRsbuild(rsbuildOptions);

    if (plugins) {
      rsbuild.addPlugins(plugins);
    }

    return rsbuild;
  }

  const { webpackProvider } = await import('@rsbuild/webpack');

  rsbuildOptions.rsbuildConfig ||= {};
  rsbuildOptions.rsbuildConfig.provider = webpackProvider;

  const rsbuild = await createRsbuild(rsbuildOptions);

  if (plugins) {
    rsbuild.addPlugins(plugins);
  }

  const swc = pluginSwc();
  if (!rsbuild.isPluginExists(swc.name)) {
    rsbuild.addPlugins([swc]);
  }

  return rsbuild;
};

function isPortAvailable(port: number) {
  try {
    const server = net.createServer().listen(port);
    return new Promise((resolve) => {
      server.on('listening', () => {
        server.close();
        resolve(true);
      });

      server.on('error', () => {
        resolve(false);
      });
    });
  } catch (err) {
    return false;
  }
}

const portMap = new Map();

// Available port ranges: 1024 ～ 65535
// `10080` is not available in macOS CI, `> 50000` get 'permission denied' in Windows.
// so we use `15000` ~ `45000`.
export async function getRandomPort(
  defaultPort = Math.ceil(Math.random() * 30000) + 15000,
) {
  let port = defaultPort;
  while (true) {
    if (!portMap.get(port) && (await isPortAvailable(port))) {
      portMap.set(port, 1);
      return port;
    }
    port++;
  }
}

const updateConfigForTest = async (
  originalConfig: RsbuildConfig,
  cwd: string = process.cwd(),
) => {
  const { loadConfig, mergeRsbuildConfig } = await import('@rsbuild/core');
  const { content: loadedConfig } = await loadConfig({
    cwd,
  });

  const config = mergeRsbuildConfig(loadedConfig, originalConfig);

  // make devPort random to avoid port conflict
  config.server = {
    ...(config.server || {}),
    printUrls: config.server?.printUrls || false,
    port: config.server?.port || (await getRandomPort(config.server?.port)),
  };

  config.dev ??= {};

  config.dev!.progressBar = config.dev!.progressBar || false;

  if (!config.performance?.buildCache) {
    config.performance = {
      ...(config.performance || {}),
      buildCache: false,
    };
  }

  if (config.performance?.printFileSize === undefined) {
    config.performance = {
      ...(config.performance || {}),
      printFileSize: false,
    };
  }

  // disable polyfill to make the tests faster
  if (config.output?.polyfill === undefined) {
    config.output = {
      ...(config.output || {}),
      polyfill: 'off',
    };
  }

  return config;
};

export async function dev({
  plugins,
  ...options
}: CreateRsbuildOptions & {
  plugins?: RsbuildPlugin[];
}) {
  process.env.NODE_ENV = 'development';

  options.rsbuildConfig = await updateConfigForTest(
    options.rsbuildConfig || {},
    options.cwd,
  );

  const rsbuild = await createRsbuild(options, plugins);

  const result = await rsbuild.startDevServer();

  return {
    ...result,
    close: () => result.server.close(),
  };
}

export async function build({
  plugins,
  runServer = false,
  ...options
}: CreateRsbuildOptions & {
  plugins?: RsbuildPlugin[];
  runServer?: boolean;
}) {
  process.env.NODE_ENV = 'production';

  options.rsbuildConfig = await updateConfigForTest(
    options.rsbuildConfig || {},
    options.cwd,
  );

  const rsbuild = await createRsbuild(options, plugins);

  await rsbuild.build();

  const { distPath } = rsbuild.context;

  const {
    port,
    server: { close },
  } = runServer
    ? await rsbuild.preview()
    : { port: 0, server: { close: noop } };

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
