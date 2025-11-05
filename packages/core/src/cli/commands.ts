import cac, { type CAC, type Command } from 'cac';
import { color } from '../helpers';
import type { ConfigLoader } from '../loadConfig';
import { logger } from '../logger';
import { RSPACK_BUILD_ERROR } from '../provider/build';
import { onBeforeRestartServer } from '../restart';
import type { LogLevel, RsbuildMode } from '../types';
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
  logLevel?: LogLevel;
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
    .option('--base <base>', 'Set the base path of the server')
    .option(
      '-c, --config <config>',
      'Set the configuration file (relative or absolute path)',
    )
    .option(
      '--config-loader <loader>',
      'Set the config file loader (auto | jiti | native)',
      {
        default: 'auto',
      },
    )
    .option('--env-dir <dir>', 'Set the directory for loading `.env` files')
    .option(
      '--env-mode <mode>',
      'Set the env mode to load the `.env.[mode]` file',
    )
    .option('--environment <name>', 'Set the environment name(s) to build', {
      type: [String],
      default: [],
    })
    .option(
      '--log-level <level>',
      'Set the log level (info | warn | error | silent)',
    )
    .option(
      '-m, --mode <mode>',
      'Set the build mode (development | production | none)',
    )
    .option(
      '-r, --root <root>',
      'Set the project root directory (absolute path or relative to cwd)',
    )
    .option('--no-env', 'Disable loading of `.env` files');
};

const applyServerOptions = (command: Command) => {
  command
    .option('-o, --open [url]', 'Open the page in browser on startup')
    .option('--port <port>', 'Set the port number for the server')
    .option('--host <host>', 'Set the host that the server listens to');
};

export function setupCommands(): void {
  const cli = cac('rsbuild');

  cli.version(RSBUILD_VERSION);

  // Apply common options to all commands
  applyCommonOptions(cli);

  const devDescription = `Start the dev server ${color.dim('(default if no command is given)')}`;
  const devCommand = cli.command('', devDescription).alias('dev');
  const buildCommand = cli.command('build', 'Build the app for production');
  const previewCommand = cli.command(
    'preview',
    'Preview the production build locally',
  );
  const inspectCommand = cli.command(
    'inspect',
    'Inspect the Rspack and Rsbuild configs',
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
    .option(
      '-w, --watch',
      'Enable watch mode to automatically rebuild on file changes',
    )
    .action(async (options: BuildOptions) => {
      try {
        if (!options.watch) {
          process.env.RSPACK_UNSAFE_FAST_DROP = 'true';
        }

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
    .option('--output <output>', 'Set the output path for inspection results')
    .option('--verbose', 'Show complete function definitions in output')
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

  cli.help((sections) => {
    // remove the default version log as we already log it in greeting
    sections.shift();

    for (const section of sections) {
      if (section.title === 'Usage') {
        section.body = section.body.replace(
          '$ rsbuild',
          color.green(`$ rsbuild [command] [options]`),
        );
      }

      // Fix the dev command name
      if (section.title === 'Commands') {
        section.body = section.body.replace(
          `         ${devDescription}`,
          `dev      ${devDescription}`,
        );
      }

      // Simplify the help output for sub-commands
      if (section.title?.startsWith('For more info')) {
        section.title = color.dim('  For details on a sub-command, run');
        section.body = color.dim('  $ rsbuild <command> -h');
      } else {
        section.title = color.cyan(section.title);
      }
    }
  });

  cli.parse();
}
