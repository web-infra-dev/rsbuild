import { join } from 'path';
import { fs } from '@rsbuild/shared/fs-extra';
import { program } from 'commander';
import type { RsbuildInstance, RsbuildMode } from '..';

export type InspectOptions = {
  env: RsbuildMode;
  output: string;
  verbose?: boolean;
};

export function setupProgram(rsbuild: RsbuildInstance) {
  const pkgJson = join(__dirname, '../../package.json');
  const { version } = fs.readJSONSync(pkgJson);

  program.name('rsbuild').usage('<command> [options]').version(version);

  program
    .command('dev')
    .description('starting the dev server')
    .action(async () => {
      await rsbuild.startDevServer();
    });

  program
    .command('build')
    .description('build the app for production')
    .action(async () => {
      await rsbuild.build();
    });

  program
    .command('serve')
    .description('preview the production build locally')
    .action(async () => {
      await rsbuild.serve();
    });

  program
    .command('inspect')
    .description('inspect the Rspack and Rsbuild configs')
    .option(`--env <env>`, 'specify env mode', 'development')
    .option('--output <output>', 'specify inspect content output path', '/')
    .option('--verbose', 'show full function definitions in output')
    .action(async (options: InspectOptions) => {
      rsbuild.inspectConfig({
        env: options.env,
        verbose: options.verbose,
        outputPath: join(rsbuild.context.distPath, options.output),
        writeToDisk: true,
      });
    });

  program.parse();
}
