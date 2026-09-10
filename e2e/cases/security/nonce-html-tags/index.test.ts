import { expect, test } from '@e2e/helper';

// Browsers hide nonce attribute values; read the DOM property instead.
const getNonces = (elements: Element[]) =>
  Object.fromEntries(
    elements.map((element) => [
      element.id,
      element.hasAttribute('nonce') ? (element as HTMLElement).nonce : null,
    ]),
  );

test('should apply nonce to html.tags', async ({ page, runBothServe }) => {
  await runBothServe(
    async () => {
      await expect(page.locator('#root')).toHaveText('Import map loaded');
      expect(await page.locator('head [id]').evaluateAll(getNonces)).toEqual({
        'import-map': 'TEST_NONCE',
        'inline-style': 'TEST_NONCE',
        'script-preload': 'TEST_NONCE',
        'callback-added': 'TEST_NONCE',
        explicit: 'CUSTOM_NONCE',
        disabled: null,
        removed: null,
      });
    },
    {
      config: {
        security: { nonce: 'TEST_NONCE' },
        server: {
          headers: {
            'Content-Security-Policy':
              "script-src 'self' 'nonce-TEST_NONCE'; style-src 'self' 'nonce-TEST_NONCE'",
          },
        },
      },
    },
  );
});

test('should not add nonce to html.tags when not configured', async ({
  page,
  runBothServe,
}) => {
  await runBothServe(async () => {
    await expect(page.locator('#root')).toHaveText('Import map loaded');
    expect(await page.locator('head [id]').evaluateAll(getNonces)).toEqual({
      'import-map': null,
      'inline-style': null,
      'script-preload': null,
      'callback-added': null,
      explicit: 'CUSTOM_NONCE',
      disabled: null,
      removed: null,
    });
  });
});
