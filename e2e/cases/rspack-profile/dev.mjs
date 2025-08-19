import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRsbuild } from '@rsbuild/core';

process.stdin.isTTY = true;
delete process.env.CI;

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: {
      dev: {
        cliShortcuts: true,
      },
      output: {
        distPath: {
          root: 'dist-dev',
        },
      },
    },
  });

  rsbuild.onAfterDevCompile(() => {
    process.exit(0);
  });

  await rsbuild.startDevServer();
}

await main();
