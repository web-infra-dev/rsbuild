import { join } from 'path';
import { fs } from '@rsbuild/shared/fs-extra';
import { program } from 'commander';
import type { RsbuildInstance } from '..';

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

  program.parse();
}
