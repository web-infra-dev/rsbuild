import { expect, test } from '@e2e/helper';
import type { Rspack } from '@rsbuild/core';

const statsOptions = {
  all: false,
  chunks: true,
  chunkModules: true,
  dependentModules: true,
  nestedModules: true,
  orphanModules: true,
} satisfies Rspack.StatsOptions;

const getModuleNames = (modules: Rspack.StatsModule[]): string[] =>
  modules.flatMap((module) => {
    if (module.modules?.length) {
      return getModuleNames(module.modules);
    }

    const name = module.name || module.identifier;
    return name ? [name] : [];
  });

const normalizeModuleName = (name: string) => {
  if (name.startsWith('./')) {
    return name;
  }

  const resource = name.split('!').at(-1)?.replaceAll('\\', '/');
  const [, relativePath] =
    resource?.match(/\/default-node\/((?:node_modules|src)\/.*)$/) || [];
  return relativePath ? `./${relativePath}` : name;
};

const normalizeChunks = (stats: Rspack.StatsCompilation | undefined) =>
  stats?.chunks
    ?.map(({ files = [], modules = [] }) => ({
      files: [...files].sort(),
      modules: getModuleNames(modules)
        .map(normalizeModuleName)
        .filter(
          (name) =>
            name.startsWith('./src/') || name.includes('single-use-dependency'),
        )
        .sort(),
    }))
    .sort((a, b) => a.files[0].localeCompare(b.files[0]));

test('should extract shared modules without extracting single-use dependencies when target is "node"', async ({
  build,
  copyNodeModules,
}) => {
  await copyNodeModules();

  const rsbuild = await build();
  const stats = rsbuild.stats?.toJson(statsOptions);

  expect(normalizeChunks(stats)).toMatchSnapshot();
});

test('should extract single-use dependencies when preset is "per-package"', async ({
  build,
  copyNodeModules,
}) => {
  await copyNodeModules();

  const rsbuild = await build({
    config: {
      splitChunks: {
        preset: 'per-package',
      },
    },
  });
  const stats = rsbuild.stats?.toJson(statsOptions);

  expect(normalizeChunks(stats)).toMatchSnapshot();
});
