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
import { proxyConsole } from './logs';
import { getDistFiles, getRandomPort, gotoPage, noop } from './utils';

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
    resolve: {
      alias: {
        '@assets': join(__dirname, '../assets'),
      },
    },
    server: {
      // make port random to avoid conflict
      port: await getRandomPort(),
    },
    performance: {
      buildCache: false,
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
   * The done of `dev` does not mean the compile is done.
   * If your test relies on the completion of compilation you should `waitFirstCompileDone`
   * @default true
   */
  waitFirstCompileDone?: boolean;
}) {
  process.env.NODE_ENV = 'development';

  const logHelper = proxyConsole();

  options.rsbuildConfig = await updateConfigForTest(
    options.rsbuildConfig || {},
    options.cwd,
  );

  const rsbuild = await createRsbuild(options, plugins);

  const wait = waitFirstCompileDone
    ? new Promise<void>((resolve) => {
        rsbuild.onAfterDevCompile(({ isFirstCompile }) => {
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
    ...logHelper,
    instance: rsbuild,
    getDistFiles: ({ sourceMaps }: { sourceMaps?: boolean } = {}) =>
      getDistFiles(rsbuild.context.distPath, sourceMaps),
    close: async () => {
      await result.server.close();
      logHelper.restore();
    },
  };
}

/**
 * Build the project and return the build result.
 */
export async function build({
  plugins,
  catchBuildError = false,
  runServer = false,
  watch = false,
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
   * @default false
   */
  runServer?: boolean;
  /**
   * Playwright Page instance.
   * This method will automatically run the server and goto the page.
   */
  page?: Page;
  /**
   * Whether to watch files.
   */
  watch?: boolean;
}) {
  process.env.NODE_ENV = 'production';

  const logHelper = proxyConsole();

  options.rsbuildConfig = await updateConfigForTest(
    options.rsbuildConfig || {},
    options.cwd,
  );

  const rsbuild = await createRsbuild(options, plugins);

  let buildError: Error | undefined;
  let closeBuild: () => Promise<void> | undefined;

  try {
    const result = await rsbuild.build({ watch });
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

  const getIndexBundle = async () => {
    const files = await getDistFiles(distPath);
    const [name, content] =
      Object.entries(files).find(
        ([file]) => file.includes('index') && file.endsWith('.js'),
      ) || [];

    assert(name && content);

    return content;
  };

  if (page) {
    await gotoPage(page, { port });
  }

  return {
    ...logHelper,
    distPath,
    port,
    close: async () => {
      await closeBuild?.();
      await server.close();
      logHelper.restore();
    },
    buildError,
    getDistFiles: ({ sourceMaps }: { sourceMaps?: boolean } = {}) =>
      getDistFiles(rsbuild.context.distPath, sourceMaps),
    getIndexBundle,
    instance: rsbuild,
  };
}

export type BuildResult = Awaited<ReturnType<typeof build>>;
