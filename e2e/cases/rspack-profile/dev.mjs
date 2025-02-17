import { createRsbuild } from '@rsbuild/core';

process.stdin.isTTY = true;
delete process.env.CI;

async function main() {
  const rsbuild = await createRsbuild({
    cwd: import.meta.dirname,
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

  await rsbuild.startDevServer();
}

await main();
