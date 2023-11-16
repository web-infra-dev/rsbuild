import { join } from 'path';
import { fse, logger } from '@rsbuild/shared';
import { program } from '../../compiled/commander';
import type { RsbuildInstance, RsbuildMode } from '..';

export type InspectOptions = {
  env: RsbuildMode;
  output: string;
  verbose?: boolean;
};

export type DevOptions = {
  open?: boolean;
};

export function setupProgram(rsbuild: RsbuildInstance) {
  const pkgJson = join(__dirname, '../../package.json');
  const { version } = fse.readJSONSync(pkgJson);

  program.name('rsbuild').usage('<command> [options]').version(version);

  program
    .command('dev')
    .option(`--open`, 'open the page in browser on startup')
    .description('starting the dev server')
    .action(async (options: DevOptions) => {
      try {
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
    .description('build the app for production')
    .action(async () => {
      try {
        await rsbuild.build();
      } catch (err) {
        logger.error('Failed to build, please check logs.');
        logger.error(err);
        process.exit(1);
      }
    });

  program
    .command('preview')
    .description('preview the production build locally')
    .action(async () => {
      try {
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
    .action(async (options: InspectOptions) => {
      try {
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
