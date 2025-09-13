import { expect, rspackTest, test } from '@e2e/helper';

test('should allow to set development mode when building', async ({
  build,
}) => {
  const rsbuild = await build({
    rsbuildConfig: {
      mode: 'development',
    },
  });

  const files = rsbuild.getDistFiles({ sourceMaps: true });

  // should not have filename hash in dev
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

test('should allow to set none mode when building', async ({ build }) => {
  const rsbuild = await build({
    rsbuildConfig: {
      mode: 'none',
    },
  });

  const files = rsbuild.getDistFiles({ sourceMaps: true });

  // should not have filename hash in none mode
  const indexFile = Object.keys(files).find((key) =>
    key.endsWith('static/js/index.js'),
  )!;

  expect(files[indexFile]).toContain('this is none mode!');

  // should not remove comments
  expect(files[indexFile]).toContain('// this is a comment');
});

rspackTest(
  'should allow to set production mode when starting dev server',
  async ({ dev }) => {
    const rsbuild = await dev({
      rsbuildConfig: {
        mode: 'production',
      },
    });

    const files = rsbuild.getDistFiles({ sourceMaps: true });

    // should have filename hash in build
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
  },
);
