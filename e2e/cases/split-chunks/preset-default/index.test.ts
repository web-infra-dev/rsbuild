import { basename } from 'node:path';
import { expect, test } from '@e2e/helper';

test('should apply default preset as expected', async ({ build }) => {
  const rsbuild = await build();
  const files = rsbuild.getDistFiles();
  const jsFiles = Object.keys(files)
    .filter((name) => name.endsWith('.js'))
    .map((name) => basename(name));

  expect(jsFiles.length).toEqual(4);
  expect(jsFiles.find((file) => file.includes('lib-polyfill'))).toBeTruthy();
  expect(jsFiles.find((file) => file.includes('lib-react'))).toBeTruthy();
  expect(jsFiles.find((file) => file.includes('lib-router'))).toBeTruthy();
});
