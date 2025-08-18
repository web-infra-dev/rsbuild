import assert from 'node:assert';
import { join } from 'node:path';
import { stripVTControlCharacters as stripAnsi } from 'node:util';
import type {
  CreateRsbuildOptions,
  RsbuildConfig,
  RsbuildPlugins,
} from '@rsbuild/core';
import { pluginSwc } from '@rsbuild/plugin-webpack-swc';
import type { Page } from 'playwright';
import {
  getDistFiles,
  getRandomPort,
  gotoPage,
  noop,
  type ProxyConsoleOptions,
  proxyConsole,
} from './helpers';

export const createRsbuild = async (
  rsbuildOptions: CreateRsbuildOptions & { rsbuildConfig?: RsbuildConfig },
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
    resolve: {
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

  const mergedConfig = mergeRsbuildConfig(
    baseConfig,
    loadedConfig,
    originalConfig,
  );

  return mergedConfig;
};

/**
 * Start the dev server and return the server instance.
 */
export async function dev({
  plugins,
  page,
  captureLogs = true,
  waitFirstCompileDone = true,
  ...options
}: CreateRsbuildOptions & {
  plugins?: RsbuildPlugins;
  rsbuildConfig?: RsbuildConfig;
  /**
   * Playwright Page instance.
   * This method will automatically goto the page.
   */
  page?: Page;
  /**
   * Call `proxyConsole` to capture the console logs.
   */
  captureLogs?: ProxyConsoleOptions | boolean;
  /**
   * The done of `dev` does not mean the compile is done.
   * If your test relies on the completion of compilation you should `waitFirstCompileDone`
   * @default true
   */
  waitFirstCompileDone?: boolean;
}) {
  process.env.NODE_ENV = 'development';

  const proxyConsoleResult =
    captureLogs === false
      ? null
      : proxyConsole(captureLogs === true ? {} : captureLogs);

  options.rsbuildConfig = await updateConfigForTest(
    options.rsbuildConfig || {},
    options.cwd,
  );

  const rsbuild = await createRsbuild(options, plugins);

  const wait = waitFirstCompileDone
    ? new Promise<void>((resolve) => {
        rsbuild.onDevCompileDone(({ isFirstCompile }) => {
          if (!isFirstCompile) {
            return;
          }
          resolve();
        });
      })
    : Promise.resolve();

  const result = await rsbuild.startDevServer();

  await wait;

  if (page) {
    await gotoPage(page, result);
  }

  return {
    ...result,
    logs: proxyConsoleResult?.logs || [],
    instance: rsbuild,
    getDistFiles: (ignoreMap?: boolean) =>
      getDistFiles(rsbuild.context.distPath, ignoreMap),
    close: async () => {
      await result.server.close();
      proxyConsoleResult?.restore();
    },
  };
}

/**
 * Build the project and return the build result.
 */
export async function build({
  plugins,
  captureLogs = true,
  catchBuildError = false,
  runServer = false,
  page,
  ...options
}: CreateRsbuildOptions & {
  plugins?: RsbuildPlugins;
  rsbuildConfig?: RsbuildConfig;
  /**
   * Whether to catch the build error.
   * @default false
   */
  catchBuildError?: boolean;
  /**
   * Whether to run the server.
   */
  runServer?: boolean;
  /**
   * Playwright Page instance.
   * This method will automatically run the server and goto the page.
   */
  page?: Page;
  /**
   * Call `proxyConsole` to capture the console logs.
   */
  captureLogs?: ProxyConsoleOptions | boolean;
}) {
  process.env.NODE_ENV = 'production';

  const proxyConsoleResult =
    captureLogs === false
      ? null
      : proxyConsole(captureLogs === true ? {} : captureLogs);

  options.rsbuildConfig = await updateConfigForTest(
    options.rsbuildConfig || {},
    options.cwd,
  );

  const rsbuild = await createRsbuild(options, plugins);

  let buildError: Error | undefined;
  let closeBuild: () => Promise<void> | undefined;

  try {
    const result = await rsbuild.build();
    closeBuild = result.close;
  } catch (error) {
    buildError = error as Error;
    buildError.message = stripAnsi(buildError.message);

    if (!catchBuildError) {
      throw buildError;
    }
  }

  const { distPath } = rsbuild.context;

  let port = 0;
  let server = { close: noop };

  if (runServer || page) {
    const ret = await rsbuild.preview();
    port = ret.port;
    server = ret.server;
  }

  const getIndexFile = async () => {
    const files = await getDistFiles(distPath);
    const [name, content] =
      Object.entries(files).find(
        ([file]) => file.includes('index') && file.endsWith('.js'),
      ) || [];

    assert(name && content);

    return {
      content: content,
      size: content.length / 1024,
    };
  };

  if (page) {
    await gotoPage(page, { port });
  }

  return {
    logs: proxyConsoleResult?.logs || [],
    distPath,
    port,
    close: async () => {
      await closeBuild?.();
      await server.close();
      proxyConsoleResult?.restore();
    },
    buildError,
    getDistFiles: (ignoreMap?: boolean) => getDistFiles(distPath, ignoreMap),
    getIndexFile,
    instance: rsbuild,
  };
}
