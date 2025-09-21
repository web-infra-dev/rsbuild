import path from 'node:path';
import { expect, readDirContents, rspackTest } from '@e2e/helper';
import { removeSync } from 'fs-extra';

const clean = () => {
  removeSync(path.join(__dirname, 'dist'));
};

rspackTest('should run inspect command correctly', async ({ execCliSync }) => {
  clean();

  execCliSync('inspect');

  const files = await readDirContents(path.join(__dirname, 'dist/.rsbuild'));
  const fileNames = Object.keys(files);

  const rsbuildConfig = fileNames.find((item) =>
    item.includes('rsbuild.config.mjs'),
  );
  expect(rsbuildConfig).toBeTruthy();
  expect(files[rsbuildConfig!]).toContain("'rsbuild:basic'");
  expect(files[rsbuildConfig!]).toContain('hmr: true');
  expect(files[rsbuildConfig!]).toContain('plugins:');

  const rspackConfig = fileNames.find((item) =>
    item.includes('rspack.config.web.mjs'),
  );
  expect(rspackConfig).toBeTruthy();
  expect(files[rspackConfig!]).toContain("mode: 'development'");
});

rspackTest(
  'should run inspect command with mode option correctly',
  async ({ execCliSync }) => {
    clean();

    execCliSync('inspect --mode production');

    const files = await readDirContents(path.join(__dirname, 'dist/.rsbuild'));
    const fileNames = Object.keys(files);

    const rsbuildConfig = fileNames.find((item) =>
      item.includes('rsbuild.config.mjs'),
    );
    expect(rsbuildConfig).toBeTruthy();

    const rspackConfig = fileNames.find((item) =>
      item.includes('rspack.config.web.mjs'),
    );
    expect(rspackConfig).toBeTruthy();
    expect(files[rspackConfig!]).toContain("mode: 'production'");
  },
);

rspackTest(
  'should run inspect command with output option correctly',
  async ({ execCliSync }) => {
    clean();

    execCliSync('inspect --output foo');

    const outputs = await readDirContents(path.join(__dirname, 'dist/foo'));
    const outputFiles = Object.keys(outputs);

    expect(
      outputFiles.find((item) => item.includes('rsbuild.config.mjs')),
    ).toBeTruthy();
    expect(
      outputFiles.find((item) => item.includes('rspack.config.web.mjs')),
    ).toBeTruthy();
  },
);
