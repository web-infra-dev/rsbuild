import { startDevServerPure } from './pureServer.ts';
import { startDevServer } from './server.ts';

const isPure = process.argv[2] === 'pure';

if (isPure) {
  await startDevServerPure(process.cwd());
} else {
  await startDevServer(process.cwd());
}
