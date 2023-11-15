import { join } from 'path';
import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';
import { pluginSwc } from '@rsbuild/plugin-swc';

const cwd = join(__dirname, 'removeConsole');

const expectConsoleType = async (
  rsbuild: Awaited<ReturnType<typeof build>>,
  consoleType: Record<string, boolean>,
) => {
  const files = await rsbuild.unwrapOutputJSON();
  const indexFile = Object.keys(files).find(
    (name) => name.includes('index.') && name.endsWith('.js'),
  )!;
  const content = files[indexFile];

  Object.entries(consoleType).forEach(([key, value]) => {
    expect(content.includes(`test-console-${key}`)).toEqual(value);
  });
};

test('should remove specified console correctly when using SWC plugin', async () => {
  const rsbuild = await build({
    cwd,
    plugins: [pluginSwc()],
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

test('should remove all console correctly when using SWC plugin', async () => {
  const rsbuild = await build({
    cwd,
    plugins: [pluginSwc()],
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
