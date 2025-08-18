import { stripVTControlCharacters as stripAnsi } from 'node:util';
import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';
import { pluginReact } from '@rsbuild/plugin-react';

rspackOnlyTest('should validate Rspack config by default', async () => {
  try {
    const rsbuild = await build({
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
    await rsbuild.close();
  } catch (e) {
    expect(e).toBeTruthy();
    expect((e as Error).message).toContain('received object at "entry"');
  }
});

rspackOnlyTest('should warn when passing unrecognized keys', async () => {
  const value = process.env.RSPACK_CONFIG_VALIDATE;
  process.env.RSPACK_CONFIG_VALIDATE = 'loose-unrecognized-keys';

  const rsbuild = await build({
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

  await rsbuild.expectLog(`Unrecognized key(s) "unrecognized" in object`);
  await rsbuild.close();

  process.env.RSPACK_CONFIG_VALIDATE = value;
});

rspackOnlyTest('should allow to override Rspack config validate', async () => {
  const { RSPACK_CONFIG_VALIDATE } = process.env;
  process.env.RSPACK_CONFIG_VALIDATE = 'loose';

  const rsbuild = await build({
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

  await rsbuild.expectLog(
    'Expected array at "entry" or Expected function, received object at "entry"',
  );
  await rsbuild.close();

  process.env.RSPACK_CONFIG_VALIDATE = RSPACK_CONFIG_VALIDATE;
});

rspackOnlyTest(
  'should validate Rspack plugins and recognize Rsbuild plugins',
  async () => {
    try {
      await build({
        cwd: __dirname,
        rsbuildConfig: {
          tools: {
            // @ts-expect-error mock invalid config
            rspack: {
              plugins: [pluginReact()],
            },
          },
        },
      });
    } catch (e) {
      expect(e).toBeTruthy();
      expect(stripAnsi((e as Error).message)).toContain(
        '[rsbuild:plugin] "rsbuild:react" appears to be an Rsbuild plugin. It cannot be used as an Rspack plugin.',
      );
    }
  },
);
