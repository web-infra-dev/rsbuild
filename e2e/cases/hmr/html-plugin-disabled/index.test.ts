import { join } from 'node:path';
import { expect, test } from '@e2e/helper';

test('should inject HMR client into each entry when html plugin is disabled', async ({
  devOnly,
}) => {
  const rsbuild = await devOnly({
    config: {
      source: {
        entry: {
          foo: './src/foo.js',
          bar: './src/bar.js',
        },
      },
    },
  });

  const files = rsbuild.getDistFiles();
  const filenames = Object.keys(files);
  const fooJs = filenames.find((name) => name.endsWith('foo.js'));
  const barJs = filenames.find((name) => name.endsWith('bar.js'));

  expect(files[fooJs!].includes('hmr.js')).toBeTruthy();
  expect(files[barJs!].includes('hmr.js')).toBeTruthy();
});

test('should perform HMR when html plugin is disabled', async ({
  page,
  dev,
  editFile,
  copySrcDir,
}) => {
  const tempSrc = await copySrcDir();

  const rsbuild = await dev({
    config: {
      performance: {
        chunkSplit: {
          strategy: 'all-in-one',
        },
      },
      source: {
        entry: {
          index: join(tempSrc, 'index.ts'),
        },
      },
    },
  });

  await page.goto(`http://localhost:${rsbuild.port}/index.html`);

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  await editFile(join(tempSrc, 'App.tsx'), (code) =>
    code.replace('Hello Rsbuild', 'Hello Test'),
  );

  await expect(locator).toHaveText('Hello Test!');
});
