import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should escape template parameters correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      html: {
        templateParameters: {
          text: '<div>escape me</div>',
        },
      },
    },
  });
  const files = rsbuild.getDistFiles();

  const fooHtml =
    files[Object.keys(files).find((file) => file.endsWith('foo.html'))!];
  expect(fooHtml).toContain('&lt;div&gt;escape me&lt;/div&gt;');

  const barHtml =
    files[Object.keys(files).find((file) => file.endsWith('bar.html'))!];
  expect(barHtml).toContain('<div>escape me</div>');
});

test('should allow to passing undefined to template parameters', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      html: {
        templateParameters: {
          text: undefined,
        },
      },
    },
  });

  const files = rsbuild.getDistFiles();

  const fooHtml =
    files[Object.keys(files).find((file) => file.endsWith('foo.html'))!];
  expect(fooHtml).toContain('<div id="test"></div>');

  const barHtml =
    files[Object.keys(files).find((file) => file.endsWith('bar.html'))!];
  expect(barHtml).toContain('<div id="test"></div>');

  expect(rsbuild.buildError).toBeFalsy();
  await rsbuild.close();
});
