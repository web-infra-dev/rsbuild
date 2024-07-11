import { build, proxyConsole, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest('should resolve ts paths correctly in SCSS file', async () => {
  const { restore } = proxyConsole();
  try {
    const rsbuild = await build({
      cwd: __dirname,
    });

    const files = await rsbuild.unwrapOutputJSON();

    const content =
      files[Object.keys(files).find((file) => file.endsWith('.css'))!];

    expect(content).toContain('background-image:url(/static/image/icon');
  } finally {
    restore();
  }
});
