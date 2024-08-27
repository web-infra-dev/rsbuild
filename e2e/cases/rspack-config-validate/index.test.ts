import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest('should allow to override rspack config validate', async () => {
  const { RSPACK_CONFIG_VALIDATE } = process.env;
  process.env.RSPACK_CONFIG_VALIDATE = 'strict';

  try {
    await build({
      cwd: __dirname,
    });
  } catch (e) {
    expect(e).toBeTruthy();
    expect((e as Error).message).toContain('Expected object, received number');
  }

  process.env.RSPACK_CONFIG_VALIDATE = RSPACK_CONFIG_VALIDATE;
});
