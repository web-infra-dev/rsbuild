import { build, proxyConsole, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest('should validate rspack config by default', async () => {
  try {
    await build({
      cwd: __dirname,
      rsbuildConfig: {
        tools: {
          // @ts-expect-error mock invalid config
          rspack: {
            entry: 1,
          },
        },
      },
    });
  } catch (e) {
    expect(e).toBeTruthy();
    expect((e as Error).message).toContain('Expected object, received number');
  }
});

rspackOnlyTest('should warn when passing unrecognized keys', async () => {
  const { logs, restore } = proxyConsole();
  await build({
    cwd: __dirname,
    rsbuildConfig: {
      tools: {
        rspack: {
          // @ts-expect-error mock invalid config
          unrecognized: 1,
        },
      },
    },
  });

  expect(
    logs.some((log) =>
      log.includes(`Unrecognized key(s) in object: 'unrecognized'`),
    ),
  );
  restore();
});

rspackOnlyTest('should allow to override rspack config validate', async () => {
  const { RSPACK_CONFIG_VALIDATE } = process.env;
  process.env.RSPACK_CONFIG_VALIDATE = 'loose';

  const { logs, restore } = proxyConsole();

  await build({
    cwd: __dirname,
    rsbuildConfig: {
      tools: {
        // @ts-expect-error mock invalid config
        rspack: {
          entry: 1,
        },
      },
    },
  });

  expect(logs.some((log) => log.includes('Expected object, received number')));

  process.env.RSPACK_CONFIG_VALIDATE = RSPACK_CONFIG_VALIDATE;
  restore();
});
