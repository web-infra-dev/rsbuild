import { expect, test } from '@e2e/helper';

test('should allow to configure pre-entry', async ({
  page,
  runDevAndBuild,
}) => {
  await runDevAndBuild(async () => {
    await expect(page.innerHTML('#test-el')).resolves.toBe('aaaaa');
    await expect(page.evaluate('window.aa')).resolves.toBe(2);
  });
});
