import { stripVTControlCharacters as stripAnsi } from 'node:util';
import { expect, rspackTest } from '@e2e/helper';
import { pluginReact } from '@rsbuild/plugin-react';

rspackTest('should validate Rspack config by default', async ({ build }) => {
  try {
    await build({
      config: {
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
    expect((e as Error).message).toContain('received object at "entry"');
  }
});

rspackTest('should warn when passing unrecognized keys', async ({ build }) => {
  const value = process.env.RSPACK_CONFIG_VALIDATE;
  process.env.RSPACK_CONFIG_VALIDATE = 'loose-unrecognized-keys';

  const rsbuild = await build({
    config: {
      tools: {
        rspack: {
          // @ts-expect-error mock invalid config
          unrecognized: 1,
        },
      },
    },
  });

  await rsbuild.expectLog(`Unrecognized key(s) "unrecognized" in object`);

  process.env.RSPACK_CONFIG_VALIDATE = value;
});

rspackTest(
  'should allow to override Rspack config validate',
  async ({ build }) => {
    const { RSPACK_CONFIG_VALIDATE } = process.env;
    process.env.RSPACK_CONFIG_VALIDATE = 'loose';

    const rsbuild = await build({
      config: {
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

    process.env.RSPACK_CONFIG_VALIDATE = RSPACK_CONFIG_VALIDATE;
  },
);

rspackTest(
  'should validate Rspack plugins and recognize Rsbuild plugins',
  async ({ build }) => {
    try {
      await build({
        config: {
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
