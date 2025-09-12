import path from 'node:path';
import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should compile CSS Modules composes correctly',
  async ({ buildOnly }) => {
    const rsbuild = await buildOnly();
    const files = rsbuild.getDistFiles();

    const content =
      files[Object.keys(files).find((file) => file.endsWith('.css'))!];

    expect(content).toMatch(
      /.*\{color:#ff0;background:red\}.*\{background:#00f\}/,
    );
  },
);

rspackOnlyTest(
  'should compile CSS Modules composes with external correctly',
  async ({ buildOnly }) => {
    const rsbuild = await buildOnly({
      rsbuildConfig: {
        source: {
          entry: { external: path.resolve(__dirname, './src/external.js') },
        },
      },
    });
    const files = rsbuild.getDistFiles();

    const content =
      files[Object.keys(files).find((file) => file.endsWith('.css'))!];

    expect(content).toMatch(
      /.*\{color:#000;background:#0ff\}.*\{background:green\}/,
    );
  },
);
