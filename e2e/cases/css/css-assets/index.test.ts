import { expect, test } from '@playwright/test';
import { build } from '@e2e/helper';

test('should build correctly', async () => {
  await expect(build({
    cwd: __dirname,
    rsbuildConfig: {},
  })).resolves.toBeDefined();
});
