import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow to override mode', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
  });

  const files = await rsbuild.unwrapOutputJSON(false);

  // should have no filename hash in development mode
  const indexFile = Object.keys(files).find((key) =>
    key.endsWith('static/js/index.js'),
  )!;

  // should replace `process.env.NODE_ENV` with `'development'`
  expect(files[indexFile]).toContain('this is development mode!');

  // should not remove comments
  expect(files[indexFile]).toContain('// this is a comment');

  // should have JavaScript source map
  const indexSourceMap = Object.keys(files).find((key) =>
    key.endsWith('static/js/index.js.map'),
  );
  expect(indexSourceMap).toBeTruthy();
});
