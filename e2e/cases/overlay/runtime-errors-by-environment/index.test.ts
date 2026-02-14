import { expect, test } from '@e2e/helper';

test('should allow to set different dev.client.overlay.runtime for multiple environments', async ({
  dev,
}) => {
  const rsbuild = await dev();

  const files = rsbuild.getDistFiles();
  const filenames = Object.keys(files);

  const fooJs = filenames.find((name) => name.endsWith('foo.js'));
  const barJs = filenames.find((name) => name.endsWith('bar.js'));

  expect(files[fooJs!]).toMatch(/"runtime":\s*true/);
  expect(files[barJs!]).toMatch(/"runtime":\s*false/);
});
