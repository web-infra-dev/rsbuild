import { expect, test } from '@e2e/helper';

test('should include user-defined fields in import.meta.env', async ({
  page,
  runBothServe,
}) => {
  await runBothServe(
    async ({ mode }) => {
      const fields = {
        CUSTOM: 'custom',
        COUNT: 3,
        CONFIG: { enabled: true },
        MODE: 'custom-mode',
        PUBLIC_DEFINE_ENV_TEST: 'from-env',
      };
      const result: unknown = JSON.parse(
        await page.locator('body').innerText(),
      );
      expect(result).toMatchObject({
        direct: 'custom',
        destructured: fields,
        spread: {
          ...fields,
          DEV: mode === 'dev',
          PROD: mode === 'build',
          SSR: false,
        },
        keys: expect.arrayContaining(Object.keys(fields)),
        dynamic: 'custom',
      });
      expect(result).not.toHaveProperty('spread.SECRET_DEFINE_ENV_TEST');
    },
    { loadEnv: true },
  );
});
