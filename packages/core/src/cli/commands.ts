import { join } from 'path';
import { logger } from '@rsbuild/shared';
import { program } from '../../compiled/commander';
import { loadConfig } from './config';
import { createRsbuild } from '../createRsbuild';
import type { RsbuildMode } from '..';

export type CommonOptions = {
  config?: string;
};

export type InspectOptions = CommonOptions & {
  env: RsbuildMode;
  output: string;
  verbose?: boolean;
};

export type DevOptions = CommonOptions & {
  open?: boolean;
};

let commonOpts: CommonOptions = {};

export async function init(options?: CommonOptions) {
  if (options) {
    commonOpts = options;
  }

  const config = await loadConfig(commonOpts.config);
  return await createRsbuild({
    rsbuildConfig: config,
    provider: config.provider,
  });
}

export function runCli() {
  program.name('rsbuild').usage('<command> [options]').version(RSBUILD_VERSION);

  program
    .command('dev')
    .option(`--open`, 'open the page in browser on startup')
    .option(
      '-c --config <config>',
      'specify the configuration file, can be a relative or absolute path',
    )
    .description('starting the dev server')
    .action(async (options: DevOptions) => {
      try {
        const rsbuild = await init(options);
        await rsbuild.startDevServer({
          open: options.open,
        });
      } catch (err) {
        logger.error('Failed to start dev server, please check logs.');
        logger.error(err);
        process.exit(1);
      }
    });

  program
    .command('build')
    .option(
      '-c --config <config>',
      'specify the configuration file, can be a relative or absolute path',
    )
    .description('build the app for production')
    .action(async (options: CommonOptions) => {
      try {
        const rsbuild = await init(options);
        await rsbuild.build();
      } catch (err) {
        logger.error('Failed to build, please check logs.');
        logger.error(err);
        process.exit(1);
      }
    });

  program
    .command('preview')
    .option(
      '-c --config <config>',
      'specify the configuration file, can be a relative or absolute path',
    )
    .description('preview the production build locally')
    .action(async (options: CommonOptions) => {
      try {
        const rsbuild = await init(options);
        await rsbuild.preview();
      } catch (err) {
        logger.error('Failed to start preview server, please check logs.');
        logger.error(err);
        process.exit(1);
      }
    });

  program
    .command('inspect')
    .description('inspect the Rspack and Rsbuild configs')
    .option(`--env <env>`, 'specify env mode', 'development')
    .option('--output <output>', 'specify inspect content output path', '/')
    .option('--verbose', 'show full function definitions in output')
    .option(
      '-c --config <config>',
      'specify the configuration file, can be a relative or absolute path',
    )
    .action(async (options: InspectOptions) => {
      try {
        const rsbuild = await init(options);
        await rsbuild.inspectConfig({
          env: options.env,
          verbose: options.verbose,
          outputPath: join(rsbuild.context.distPath, options.output),
          writeToDisk: true,
        });
      } catch (err) {
        logger.error('Failed to inspect config, please check logs.');
        logger.error(err);
        process.exit(1);
      }
    });

  program.parse();
}
