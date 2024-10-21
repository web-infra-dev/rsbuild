import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow plugin to custom resolver', async () => {
  await expect(
    build({
      cwd: __dirname,
    }),
  ).resolves.toBeDefined();
});
