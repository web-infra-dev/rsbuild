import { expect, test } from '@e2e/helper';
import type { Page } from 'playwright';

const expectTagOrder = async (page: Page) => {
  await expect(page.locator('#root')).toHaveText('Hello Rsbuild!');
  expect(
    await page
      .locator('head > [id]')
      .evaluateAll((tags) => tags.map((tag) => tag.id)),
  ).toEqual(['first-map', 'meta', 'second-map', 'preload']);
  expect(
    await page
      .locator('body > [id]')
      .evaluateAll((tags) => tags.map((tag) => tag.id)),
  ).toEqual(['root', 'body-map', 'body-module']);
};

test('should move import maps before module scripts and preloads', async ({
  page,
  runBothServe,
}) => {
  await runBothServe(() => expectTagOrder(page));
});

test('should move import maps with the native HTML plugin', async ({
  page,
  runBothServe,
}) => {
  await runBothServe(() => expectTagOrder(page), {
    config: { html: { implementation: 'native' } },
  });
});
