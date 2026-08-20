import { expect, test } from '@e2e/helper';

test('should extract shared modules without extracting single-use dependencies when target is "node"', async ({
  build,
  copyNodeModules,
}) => {
  await copyNodeModules();

  const rsbuild = await build();
  const stats = rsbuild.stats?.toJson({
    all: false,
    chunks: true,
    chunkModules: true,
  });
  const chunks = stats?.chunks
    ?.map(({ files = [], modules = [] }) => ({
      files: [...files].sort(),
      modules: modules
        .map(({ name }) => name)
        .filter((name) => name?.startsWith('./src/'))
        .sort(),
    }))
    .sort((a, b) => a.files[0].localeCompare(b.files[0]));

  expect(chunks).toMatchSnapshot();
});
