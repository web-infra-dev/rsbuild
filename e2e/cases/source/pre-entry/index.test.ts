import { expect, test } from '@e2e/helper';

test('should allow to configure pre-entry in development', async ({
  dev,
  page,
}) => {
  await dev();
  await expect(page.innerHTML('#test-el')).resolves.toBe('aaaaa');
  await expect(page.evaluate('window.aa')).resolves.toBe(2);
});

test('should allow to configure pre-entry in production build', async ({
  page,
  buildPreview,
}) => {
  await buildPreview();
  await expect(page.innerHTML('#test-el')).resolves.toBe('aaaaa');
  await expect(page.evaluate('window.aa')).resolves.toBe(2);
});
