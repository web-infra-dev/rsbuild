import { startDevServer } from './server.mjs';
import { startDevServerPure } from './pureServer.mjs';

const isPure = process.argv[2] === 'pure';

if (isPure) {
  startDevServerPure(process.cwd());
} else {
  startDevServer(process.cwd());
}
