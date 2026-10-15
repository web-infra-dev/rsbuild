import { expect, test } from '@e2e/helper';

test('should include user-defined fields in import.meta.env', async ({
  page,
  runBothServe,
}) => {
  await runBothServe(
    async () => {
      const result: unknown = JSON.parse(
        await page.locator('body').innerText(),
      );
      expect(result).toMatchObject({
        direct: 'custom',
        destructured: 'custom',
        env: {
          CUSTOM: 'custom',
          COUNT: 3,
          CONFIG: { enabled: true },
          MODE: 'custom-mode',
          PUBLIC_DEFINE_ENV_TEST: 'from-env',
        },
      });
      expect(result).not.toHaveProperty('env.SECRET_DEFINE_ENV_TEST');
    },
    { loadEnv: true },
  );
});
