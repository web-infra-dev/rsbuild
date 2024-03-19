import { expect, test } from '@playwright/test';
import { build } from '@e2e/helper';

test('should inject tags correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = await rsbuild.unwrapOutputJSON();

  const indexHtml =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];

  expect(indexHtml).toEqual(
    `<!doctype html><html><head><script src=\"https://www.cdn.com/foo.js\"></script><script src=\"/bar.js\"></script><title>Rsbuild App</title><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><script defer=\"defer\" src=\"/static/js/index.js\"></script><meta name=\"referrer\" content=\"origin\"></head><body><div id=\"root\"></div></body></html>`,
  );
});
