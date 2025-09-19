import { expect, test } from '@e2e/helper';
import type { ManifestData } from '@rsbuild/core';

// https://github.com/web-infra-dev/rsbuild/issues/6187
test('should generate manifest with initial chunks in correct order', async ({
  build,
}) => {
  const rsbuild = await build();

  const files = rsbuild.getDistFiles();
  const manifestContent =
    files[Object.keys(files).find((file) => file.endsWith('manifest.json'))!];
  const manifest: ManifestData = JSON.parse(manifestContent);

  for (const entryData of Object.values(manifest.entries)) {
    const htmlFileName = entryData.html![0];
    const htmlContent =
      files[Object.keys(files).find((file) => file.endsWith(htmlFileName))!];
    expect(htmlContent).toBeDefined();

    const scriptMatches = htmlContent.match(/<script[^>]*src="([^"]+)"/g) || [];
    const htmlScriptOrder = scriptMatches
      .map((match) => {
        const srcMatch = match.match(/src="([^"]+)"/);
        return srcMatch ? srcMatch[1] : '';
      })
      .filter(Boolean);

    const linkMatches =
      htmlContent.match(/<link[^>]*href="([^"]+)"[^>]*rel="stylesheet"/g) || [];
    const htmlCssOrder = linkMatches
      .map((match) => {
        const hrefMatch = match.match(/href="([^"]+)"/);
        return hrefMatch ? hrefMatch[1] : '';
      })
      .filter(Boolean);

    expect(entryData.initial?.js).toEqual(htmlScriptOrder);
    expect(entryData.initial?.css).toEqual(htmlCssOrder);
  }
});
