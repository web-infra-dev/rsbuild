import path from 'node:path';
import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest('should compile CSS Modules composes correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });
  const files = await rsbuild.getDistFiles();

  const content =
    files[Object.keys(files).find((file) => file.endsWith('.css'))!];

  expect(content).toMatch(
    /.*\{color:#ff0;background:red\}.*\{background:#00f\}/,
  );
});

rspackOnlyTest(
  'should compile CSS Modules composes with external correctly',
  async () => {
    const rsbuild = await build({
      cwd: __dirname,
      rsbuildConfig: {
        source: {
          entry: { external: path.resolve(__dirname, './src/external.js') },
        },
      },
    });
    const files = await rsbuild.getDistFiles();

    const content =
      files[Object.keys(files).find((file) => file.endsWith('.css'))!];

    expect(content).toMatch(
      /.*\{color:#000;background:#0ff\}.*\{background:green\}/,
    );
  },
);
