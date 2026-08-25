import { expect, test } from '@e2e/helper';

test('should inject HMR client into each entry when target is browserslist', async ({
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
