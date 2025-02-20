import { build, dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow to set development mode when building', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      mode: 'development',
    },
  });

  const files = await rsbuild.unwrapOutputJSON(false);

  // should not have filename hash in development mode
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

test('should allow to set none mode when building', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      mode: 'none',
    },
  });

  const files = await rsbuild.unwrapOutputJSON(false);

  // should not have filename hash in none mode
  const indexFile = Object.keys(files).find((key) =>
    key.endsWith('static/js/index.js'),
  )!;

  expect(files[indexFile]).toContain('this is none mode!');

  // should not remove comments
  expect(files[indexFile]).toContain('// this is a comment');
});

test('should allow to set production mode when starting dev server', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
    rsbuildConfig: {
      mode: 'production',
      dev: {
        writeToDisk: true,
      },
    },
  });

  const files = await rsbuild.unwrapOutputJSON(false);

  // should have filename hash in production mode
  const indexFile = Object.keys(files).find((key) =>
    key.match(/static\/js\/index\.\w+\.js/),
  )!;

  // should replace `process.env.NODE_ENV` with `'production'`
  expect(files[indexFile]).toContain('this is production mode!');

  // should remove comments
  expect(files[indexFile]).not.toContain('// this is a comment');

  // should not have JavaScript source map
  const indexSourceMap = Object.keys(files).find((key) =>
    key.endsWith('.js.map'),
  );
  expect(indexSourceMap).toBeFalsy();

  await rsbuild.close();
});
