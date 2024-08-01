import { existsSync } from 'fs';
import color from 'picocolors';
import { RsbuildInstance } from 'src';
import { isEmptyDir } from 'src/helpers';
import { StartServerResult } from 'src/server/helper';
import { DevOptions, PreviewOptions } from './commands';
import { init } from './init';
import { BindCLIShortcutsOptions } from './shortcut';

export type RsbuildServer = {
  _rsbuildInstance?: RsbuildInstance;
  _options: DevOptions | PreviewOptions;
  _shortcutsOptions?: BindCLIShortcutsOptions<RsbuildServer>;
  _startServerResult?: StartServerResult;
  restartServer: () => Promise<void>;
};

const restartServer = (server: RsbuildServer) => {
  return async () => {
    await server._startServerResult?.server.close();
    server._rsbuildInstance = await init({ cliOptions: server._options });
    server._rsbuildInstance?.startDevServer();
  };
};

export const _createDevServer = async (
  options: DevOptions | PreviewOptions,
): Promise<RsbuildServer> => {
  const rsbuild = await init({ cliOptions: options });
  const startServerResult = await rsbuild?.startDevServer();
  const server = {
    _rsbuildInstance: rsbuild,
    _options: options,
    _startServerResult: startServerResult,
    restartServer: async () => {},
  };
  server.restartServer = restartServer(server);
  return server;
};

export const _createPreviewServer = async (
  options: DevOptions | PreviewOptions,
): Promise<RsbuildServer> => {
  const rsbuild = await init({ cliOptions: options });
  await rsbuild?.initConfigs();

  if (rsbuild) {
    const { distPath } = rsbuild.context;

    if (!existsSync(distPath)) {
      throw new Error(
        `The output directory ${color.yellow(
          distPath,
        )} does not exist, please build the project before previewing.`,
      );
    }

    if (isEmptyDir(distPath)) {
      throw new Error(
        `The output directory ${color.yellow(
          distPath,
        )} is empty, please build the project before previewing.`,
      );
    }
  }

  const startServerResult = await rsbuild?.preview();
  const server = {
    _rsbuildInstance: rsbuild,
    _options: options,
    _startServerResult: startServerResult,
    restartServer: async () => {},
  };
  server.restartServer = restartServer(server);
  return server;
};
