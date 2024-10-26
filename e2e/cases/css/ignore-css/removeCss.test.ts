import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should ignore CSS content when build node target', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      output: {
        target: 'node',
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find((file) => file.endsWith('.js'))!];

  // preserve CSS Modules mapping
  expect(content.includes('"title-class":')).toBeTruthy();
  // remove CSS content
  expect(content.includes('.title-class')).toBeFalsy();
  expect(content.includes('.header-class')).toBeFalsy();
});

test('should ignore CSS content when build web-worker target', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      output: {
        target: 'web-worker',
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find((file) => file.endsWith('.js'))!];

  // preserve CSS Modules mapping
  expect(content.includes('"title-class":')).toBeTruthy();
  // remove CSS content
  expect(content.includes('.title-class')).toBeFalsy();
  expect(content.includes('.header-class')).toBeFalsy();
});
