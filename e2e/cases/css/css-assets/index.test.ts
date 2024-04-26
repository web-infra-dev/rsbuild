import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should build correctly', async () => {
  await expect(build({
    cwd: __dirname,
    rsbuildConfig: {},
  })).resolves.toBeDefined();
});
