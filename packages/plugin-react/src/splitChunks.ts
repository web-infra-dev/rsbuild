import { createDependenciesRegExp } from '@rsbuild/core/plugins/splitChunks';
import type { RsbuildPluginAPI } from '@rsbuild/core';
import {
  isProd,
  isPackageInstalled,
  isPlainObject,
  type CacheGroup,
  type SplitChunks,
} from '@rsbuild/shared';

export async function splitByExperience(rootPath: string): Promise<CacheGroup> {
  const experienceCacheGroup: CacheGroup = {};

  const packageRegExps: Record<string, RegExp> = {
    react: createDependenciesRegExp(
      'react',
      'react-dom',
      'scheduler',
      ...(isProd()
        ? []
        : ['react-refresh', '@pmmmwh/react-refresh-webpack-plugin']),
    ),
    router: createDependenciesRegExp(
      'react-router',
      'react-router-dom',
      '@remix-run/router',
      'history',
    ),
  };

  // Detect if the package is installed in current project
  // If installed, add the package to cache group
  if (isPackageInstalled('antd', rootPath)) {
    packageRegExps.antd = createDependenciesRegExp('antd');
  }
  if (isPackageInstalled('@arco-design/web-react', rootPath)) {
    packageRegExps.arco = createDependenciesRegExp(/@?arco-design/);
  }
  if (isPackageInstalled('@douyinfe/semi-ui', rootPath)) {
    packageRegExps.semi = createDependenciesRegExp(
      /@(ies|douyinfe)[\\/]semi-.*/,
    );
  }

  Object.entries(packageRegExps).forEach(([name, test]) => {
    const key = `lib-${name}`;

    experienceCacheGroup[key] = {
      test,
      priority: 0,
      name: key,
      reuseExistingChunk: true,
    };
  });

  return experienceCacheGroup;
}

export const applySplitChunksRule = (api: RsbuildPluginAPI) => {
  api.modifyBundlerChain(async (chain) => {
    const config = api.getNormalizedConfig();
    const { chunkSplit } = config.performance || {};

    if (chunkSplit?.strategy !== 'split-by-experience') {
      return;
    }

    const currentConfig = chain.optimization.splitChunks.values();

    if (isPlainObject(currentConfig)) {
      const extraGroups = await splitByExperience(api.context.rootPath);
      chain.optimization.splitChunks({
        ...currentConfig,
        cacheGroups: {
          ...(currentConfig as SplitChunks).cacheGroups,
          ...extraGroups,
        },
      });
    }
  });
};
