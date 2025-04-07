import cac, { type CAC, type Command } from 'cac';
import type { ConfigLoader } from '../config';
import { logger } from '../logger';
import { RSPACK_BUILD_ERROR } from '../provider/build';
import { onBeforeRestartServer } from '../restart';
import type { RsbuildMode } from '../types';
import { init } from './init';

export type CommonOptions = {
  base?: string;
  root?: string;
  mode?: RsbuildMode;
  config?: string;
  configLoader?: ConfigLoader;
  env?: boolean;
  envDir?: string;
  envMode?: string;
  open?: boolean | string;
  host?: string;
  port?: number;
  environment?: string[];
};

export type BuildOptions = CommonOptions & {
  watch?: boolean;
};

export type InspectOptions = CommonOptions & {
  mode: RsbuildMode;
  output: string;
  verbose?: boolean;
};

export type DevOptions = CommonOptions;

export type PreviewOptions = CommonOptions;

const applyCommonOptions = (cli: CAC) => {
  cli
    .option('--base <base>', 'specify the base path of the server')
    .option(
      '-c, --config <config>',
      'specify the configuration file, can be a relative or absolute path',
    )
    .option(
      '--config-loader <loader>',
      'specify the loader to load the config file, can be `jiti` or `native`',
      {
        default: 'jiti',
      },
    )
    .option(
      '-r, --root <root>',
      'specify the project root directory, can be an absolute path or a path relative to cwd',
    )
    .option(
      '-m, --mode <mode>',
      'specify the build mode, can be `development`, `production` or `none`',
    )
    .option(
      '--env-mode <mode>',
      'specify the env mode to load the `.env.[mode]` file',
    )
    .option(
      '--environment <name>',
      'specify the name of environment to build',
      {
        type: [String],
        default: [],
      },
    )
    .option('--env-dir <dir>', 'specify the directory to load `.env` files')
    .option('--no-env', 'Disable loading `.env` files');
};

const applyServerOptions = (command: Command) => {
  command
    .option('-o, --open [url]', 'open the page in browser on startup')
    .option('--port <port>', 'specify a port number for server to listen')
    .option('--host <host>', 'specify the host that the server listens to');
};

export function setupCommands(): void {
  const cli = cac('rsbuild');

  cli.help();
  cli.version(RSBUILD_VERSION);

  // Apply common options to all commands
  applyCommonOptions(cli);

  // Allow to run `rsbuild` without any sub-command to trigger dev
  const devCommand = cli.command('', 'starting the dev server').alias('dev');
  const buildCommand = cli.command('build', 'build the app for production');
  const previewCommand = cli.command(
    'preview',
    'preview the production build locally',
  );
  const inspectCommand = cli.command(
    'inspect',
    'inspect the Rspack and Rsbuild configs',
  );

  applyServerOptions(devCommand);
  applyServerOptions(previewCommand);

  devCommand.action(async (options: DevOptions) => {
    try {
      const rsbuild = await init({ cliOptions: options });
      await rsbuild?.startDevServer();
    } catch (err) {
      logger.error('Failed to start dev server.');
      logger.error(err);
      process.exit(1);
    }
  });

  buildCommand
    .option('-w, --watch', 'turn on watch mode, watch for changes and rebuild')
    .action(async (options: BuildOptions) => {
      try {
        const rsbuild = await init({
          cliOptions: options,
          isBuildWatch: options.watch,
        });
        const buildInstance = await rsbuild?.build({
          watch: options.watch,
        });

        if (buildInstance) {
          if (options.watch) {
            onBeforeRestartServer(buildInstance.close);
          } else {
            await buildInstance.close();
          }
        }
      } catch (err) {
        const isRspackError =
          err instanceof Error && err.message === RSPACK_BUILD_ERROR;
        if (!isRspackError) {
          logger.error('Failed to build.');
        }

        logger.error(err);
        process.exit(1);
      }
    });

  previewCommand.action(async (options: PreviewOptions) => {
    try {
      const rsbuild = await init({ cliOptions: options });
      await rsbuild?.preview();
    } catch (err) {
      logger.error('Failed to start preview server.');
      logger.error(err);
      process.exit(1);
    }
  });

  inspectCommand
    .option('--output <output>', 'specify inspect content output path')
    .option('--verbose', 'show full function definitions in output')
    .action(async (options: InspectOptions) => {
      try {
        const rsbuild = await init({ cliOptions: options });
        await rsbuild?.inspectConfig({
          verbose: options.verbose,
          outputPath: options.output,
          writeToDisk: true,
        });
      } catch (err) {
        logger.error('Failed to inspect config.');
        logger.error(err);
        process.exit(1);
      }
    });

  cli.parse();
}
