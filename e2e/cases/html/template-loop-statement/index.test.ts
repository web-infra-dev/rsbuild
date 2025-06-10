import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should render loop statements correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });
  const files = await rsbuild.getDistFiles();

  const indexHtml =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];

  // Basic for loop
  expect(indexHtml).toContain('<div id="for">');
  expect(indexHtml).toContain('<li>for: Item 1</li>');
  expect(indexHtml).toContain('<li>for: Item 2</li>');
  expect(indexHtml).toContain('<li>for: Item 3</li>');

  // forEach loop
  expect(indexHtml).toContain('<div id="for-each">');
  expect(indexHtml).toContain('<li>for each: Item 1 0</li>');
  expect(indexHtml).toContain('<li>for each: Item 2 1</li>');
  expect(indexHtml).toContain('<li>for each: Item 3 2</li>');

  // for...of loop
  expect(indexHtml).toContain('<div id="for-of">');
  expect(indexHtml).toContain('<li>for of: Item 1</li>');
  expect(indexHtml).toContain('<li>for of: Item 2</li>');
  expect(indexHtml).toContain('<li>for of: Item 3</li>');
});
