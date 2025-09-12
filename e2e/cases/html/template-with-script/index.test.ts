import { expect, test } from '@e2e/helper';

// see: https://github.com/rspack-contrib/html-rspack-plugin/issues/14
test('should compile template with es template correctly', async ({
  buildOnly,
}) => {
  const rsbuild = await buildOnly();
  const files = rsbuild.getDistFiles();

  const indexHtml =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];
  // biome-ignore lint/suspicious/noTemplateCurlyInString: should ignore string
  expect(indexHtml).toContain("const baseUrl = match ? `${match[0]}/` : '/'");
});
