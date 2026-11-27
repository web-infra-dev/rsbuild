import { join } from 'node:path';
import { expect, test } from '@e2e/helper';

test('should preserve html: false when appending imports to an entry', async ({
  build,
  page,
}) => {
  const rsbuild = await build({
    config: {
      source: {
        // Append to the bar entry description in rsbuild.config.ts.
        entry: { bar: ['./src/foo.js'] },
      },
    },
  });

  const files = rsbuild.getDistFiles();
  const filenames = Object.keys(files);

  expect(filenames.find((item) => item.includes('foo.html'))).toBeTruthy();
  expect(filenames.find((item) => item.includes('bar.html'))).toBeFalsy();

  const messages: string[] = [];
  page.on('console', (message) => messages.push(message.text()));
  await page.addScriptTag({ path: join(rsbuild.distPath, 'bar.js') });
  expect(messages).toEqual(['bar', 'foo']);
});
