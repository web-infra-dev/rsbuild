import { expect, gotoPage, test } from '@e2e/helper';
import { getFileContent } from '@rstackjs/test-utils';

const entries = [
  {
    name: 'index',
    message: 'Index entry loaded!',
    otherEntry: 'other',
  },
  {
    name: 'other',
    message: 'Other entry loaded!',
    otherEntry: 'index',
  },
];

test('should load multiple entries with shared chunks in web ESM bundles', async ({
  page,
  runBothServe,
}) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await runBothServe(async ({ mode, result }) => {
    for (const { name, message } of entries) {
      await gotoPage(page, result, name);
      await expect(page.locator('#test')).toHaveText(message);
    }

    if (mode === 'build') {
      const files = result.getDistFiles();

      for (const { name, otherEntry } of entries) {
        const html = getFileContent(files, `${name}.html`);

        expect(html.match(/<script type="module"/g)).toHaveLength(3);
        expect(html).toContain(`/static/js/${name}`);
        expect(html).toContain('/static/js/shared');
        expect(html).toContain('/static/js/runtime');
        expect(html).not.toContain(`/static/js/${otherEntry}`);
      }
    }
  });

  expect(pageErrors).toEqual([]);
});
