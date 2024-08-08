import assert from 'node:assert';
import fs from 'node:fs';
import net from 'node:net';
import { join } from 'node:path';
import { URL } from 'node:url';
import type {
  CreateRsbuildOptions,
  RsbuildConfig,
  RsbuildPlugins,
} from '@rsbuild/core';
import { pluginSwc } from '@rsbuild/plugin-swc';
import type { Page } from 'playwright';
import { globContentJSON } from './helper';

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

const noop = async () => {};

export const createRsbuild = async (
  rsbuildOptions: CreateRsbuildOptions,
  plugins: RsbuildPlugins = [],
) => {
  const { createRsbuild } = await import('@rsbuild/core');

  rsbuildOptions.rsbuildConfig ||= {};
  rsbuildOptions.rsbuildConfig.plugins = [
    ...(rsbuildOptions.rsbuildConfig.plugins || []),
    ...(plugins || []),
  ];

  if (process.env.PROVIDE_TYPE === 'rspack') {
    const rsbuild = await createRsbuild(rsbuildOptions);

    return rsbuild;
  }

  const { webpackProvider } = await import('@rsbuild/webpack');

  rsbuildOptions.rsbuildConfig.provider = webpackProvider;

  const rsbuild = await createRsbuild(rsbuildOptions);

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

  const baseConfig: RsbuildConfig = {
    dev: {
      progressBar: false,
    },
    source: {
      alias: {
        '@assets': join(__dirname, '../assets'),
      },
    },
    server: {
      // make port random to avoid conflict
      port: await getRandomPort(),
      printUrls: false,
    },
    performance: {
      buildCache: false,
      printFileSize: false,
    },
  };

  return mergeRsbuildConfig(baseConfig, loadedConfig, originalConfig);
};

const unwrapOutputJSON = async (distPath: string, ignoreMap = true) => {
  return globContentJSON(distPath, {
    absolute: true,
    ignore: ignoreMap ? [join(distPath, '/**/*.map')] : [],
  });
};

export async function dev({
  plugins,
  ...options
}: CreateRsbuildOptions & {
  plugins?: RsbuildPlugins;
}) {
  process.env.NODE_ENV = 'development';

  options.rsbuildConfig = await updateConfigForTest(
    options.rsbuildConfig || {},
    options.cwd,
  );

  const rsbuild = await createRsbuild(options, plugins);

  rsbuild.addPlugins([
    {
      // fix hmr problem temporary (only appears in rsbuild repo, because css-loader is not in node_modules/ )
      // https://github.com/web-infra-dev/rspack/issues/5723
      name: 'fix-react-refresh-in-rsbuild',
      setup(api) {
        api.modifyBundlerChain({
          order: 'post',
          handler: (chain, { CHAIN_ID }) => {
            if (chain.plugins.has(CHAIN_ID.PLUGIN.REACT_FAST_REFRESH)) {
              chain.plugin(CHAIN_ID.PLUGIN.REACT_FAST_REFRESH).tap((config) => {
                config[0].exclude = [/node_modules/, /css-loader/];
                return config;
              });
            }
          },
        });
      },
    },
  ]);

  const result = await rsbuild.startDevServer();

  return {
    ...result,
    instance: rsbuild,
    unwrapOutputJSON: (ignoreMap?: boolean) =>
      unwrapOutputJSON(rsbuild.context.distPath, ignoreMap),
    close: () => result.server.close(),
  };
}

export async function build({
  plugins,
  runServer = false,
  ...options
}: CreateRsbuildOptions & {
  plugins?: RsbuildPlugins;
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

  const clean = async () =>
    fs.promises.rm(distPath, { force: true, recursive: true });

  const getIndexFile = async () => {
    const files = await unwrapOutputJSON(distPath);
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
    unwrapOutputJSON: (ignoreMap?: boolean) =>
      unwrapOutputJSON(distPath, ignoreMap),
    getIndexFile,
    providerType: process.env.PROVIDE_TYPE || 'rspack',
    instance: rsbuild,
  };
}
