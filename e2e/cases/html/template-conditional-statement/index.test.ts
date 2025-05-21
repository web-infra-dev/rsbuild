import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should render conditional statement correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });
  const files = await rsbuild.getDistFiles();

  const indexHtml =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];

  // Basic if statement (showBasic: true)
  expect(indexHtml).toContain('Basic if true');

  // if/else statement (condition: false)
  expect(indexHtml).toContain('Condition false');
  expect(indexHtml).not.toContain('Condition true');

  // if/else if/else statement (value: 7)
  expect(indexHtml).toContain('Value > 5');
  expect(indexHtml).not.toContain('Value > 10');
  expect(indexHtml).not.toContain('Value ≤ 5');

  // Nested if statements (outer: true, inner: true)
  expect(indexHtml).toContain('Outer true');
  expect(indexHtml).toContain('Inner true');

  // Conditional expression (showResult: true, result: 'Success!')
  expect(indexHtml).toContain('Result: Success');
  expect(indexHtml).not.toContain('Result: N/A');
});
