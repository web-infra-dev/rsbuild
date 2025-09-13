import path from 'node:path';
import { expect, rspackTest } from '@e2e/helper';

rspackTest(
  'should compile CSS Modules composes correctly',
  async ({ build }) => {
    const rsbuild = await build();
    const files = rsbuild.getDistFiles();

    const content =
      files[Object.keys(files).find((file) => file.endsWith('.css'))!];

    expect(content).toMatch(
      /.*\{color:#ff0;background:red\}.*\{background:#00f\}/,
    );
  },
);

rspackTest(
  'should compile CSS Modules composes with external correctly',
  async ({ build }) => {
    const rsbuild = await build({
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
