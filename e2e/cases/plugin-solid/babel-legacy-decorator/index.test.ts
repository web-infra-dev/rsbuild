import { expect, test } from '@e2e/helper';

test('should support legacy TypeScript decorators with Babel compiler', async ({
  page,
  buildPreview,
}) => {
  await buildPreview();

  await expect(page.locator('#decorator')).toHaveText(
    'legacy decorator works: 0',
  );
});
