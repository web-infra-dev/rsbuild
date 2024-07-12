import { build, normalizeNewlines } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should inject tags with function usage correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = await rsbuild.unwrapOutputJSON();

  const indexHtml =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];

  expect(normalizeNewlines(indexHtml)).toEqual(
    `<!doctype html><html><head><script src="/foo.js"></script><script src="/bar.js"></script><script src="/baz.js"></script><title>Rsbuild App</title><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script defer src="/static/js/index.js"></script></head><body><div id="root"></div></body></html>`,
  );
});
