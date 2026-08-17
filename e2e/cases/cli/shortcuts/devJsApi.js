import { createRsbuild } from '@rsbuild/core';

process.stdin.isTTY = true;
delete process.env.CI;

const rsbuild = await createRsbuild({
  cwd: import.meta.dirname,
  config: {
    dev: {
      cliShortcuts: true,
    },
  },
});

await rsbuild.startDevServer();
