import type { BuildResult } from '@e2e/helper';
import { expect, test } from '@e2e/helper';

const cwd = __dirname;

const expectConsoleType = async (
  rsbuild: Awaited<BuildResult>,
  consoleType: Record<string, boolean>,
) => {
  const files = rsbuild.getDistFiles();
  const indexFile = Object.keys(files).find(
    (name) => name.includes('index.') && name.endsWith('.js'),
  )!;
  const content = files[indexFile];

  for (const [key, value] of Object.entries(consoleType)) {
    expect(content.includes(`test-console-${key}`)).toEqual(value);
  }
};

test('should remove specified console correctly', async ({ build }) => {
  const rsbuild = await build({
    cwd,
    rsbuildConfig: {
      performance: {
        removeConsole: ['log', 'warn'],
      },
    },
  });

  await expectConsoleType(rsbuild, {
    log: false,
    warn: false,
    debug: true,
    error: true,
  });
});

test('should remove all console correctly', async ({ build }) => {
  const rsbuild = await build({
    cwd,
    rsbuildConfig: {
      performance: {
        removeConsole: true,
      },
    },
  });

  await expectConsoleType(rsbuild, {
    log: false,
    warn: false,
    debug: false,
    error: false,
  });
});
