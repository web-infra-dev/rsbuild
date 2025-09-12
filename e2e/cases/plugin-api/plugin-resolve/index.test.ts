import { expect, test } from '@e2e/helper';

test('should allow plugin to custom resolver', async ({ buildOnly }) => {
  await expect(buildOnly()).resolves.toBeDefined();
});
