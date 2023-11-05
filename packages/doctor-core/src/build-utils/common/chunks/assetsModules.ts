import { isEmpty, pick } from 'lodash';
import path from 'path';

import { createLogger } from '@rsbuild/doctor-utils/logger';
import { Plugin } from '@rsbuild/doctor-types';
import type { ModuleGraph } from '@rsbuild/doctor-sdk/graph';
import { ParseBundle } from '@/types';
import { getModulesFromArray } from '../module-graph';

const logger = createLogger();
export type ParsedModuleSizeData = {
  [x: string]: { size: number; sizeConvert: string; content: string };
};
/**
 * The following code is modified based on
 * https://github.com/webpack-contrib/webpack-bundle-analyzer/blob/8a3d3f0f40010f2b41ccd28519eda5a44e13da3e/src/analyzer.js#L20
 *
 * MIT Licensed
 * Author th0r
 * Copyright JS Foundation and other contributors.
 * https://github.com/webpack-contrib/webpack-bundle-analyzer/blob/44bd8d0f9aa3b098e271af220096ea70cc44bc9e/LICENSE
 */
export async function getAssetsModulesData(
  bundleStats: Plugin.StatsCompilation,
  bundleDir: string,
  opts: {
    parseBundle?: ParseBundle;
  },
): Promise<ParsedModuleSizeData | null> {
  const { parseBundle = () => ({}) as ReturnType<ParseBundle> } = opts || {};

  // Sometimes all the information is located in `children` array (e.g. problem in #10)
  if (isEmpty(bundleStats.assets) && !isEmpty(bundleStats.children)) {
    const { children } = bundleStats;
    const _bundleStats = children?.[0];
    if (!children) {
      return {};
    }
    for (let i = 1; i < children.length; i++) {
      children[i]?.assets?.forEach((asset: Plugin.StatsAsset) => {
        _bundleStats?.assets?.push(asset);
      });
    }
  } else if (!isEmpty(bundleStats.children)) {
    // Sometimes if there are additional child chunks produced add them as child assets
    bundleStats?.children?.forEach((child: Plugin.StatsCompilation) => {
      child?.assets?.forEach((asset: Plugin.StatsAsset) => {
        bundleStats?.assets?.push(asset);
      });
    });
  }

  // Trying to parse bundle assets and get real module sizes if `bundleDir` is provided
  let bundlesSources: Record<string, unknown> | null = null;
  let parsedModules: ParsedModuleSizeData | null = null;

  if (bundleDir && bundleStats?.assets) {
    bundlesSources = {};
    parsedModules = {};

    // eslint-disable-next-line no-unsafe-optional-chaining
    for (const statAsset of bundleStats?.assets) {
      const assetFile = path.join(bundleDir, statAsset.name);
      let bundleInfo: ReturnType<ParseBundle>;
      const collectedModules: Plugin.StatsModule[] = [];

      getModulesFromArray(bundleStats.modules ?? [], collectedModules);

      try {
        bundleInfo = await parseBundle(assetFile, collectedModules);
      } catch (err: any) {
        const { code = '', message } = err;
        const msg = code === 'ENOENT' ? 'no such file' : message;
        process.env.DEVTOOLS_NODE_DEV === '1' &&
          logger.warn(`Error parsing bundle asset "${assetFile}": ${msg}`);

        continue;
      }

      bundlesSources[statAsset.name] = pick(bundleInfo, 'src', 'runtimeSrc');
      Object.assign(parsedModules, bundleInfo?.modules || {});
    }

    if (isEmpty(bundlesSources)) {
      bundlesSources = null;
      parsedModules = null;
      process.env.DEVTOOLS_DEV &&
        logger.warn(
          '\nNo bundles were parsed. Analyzer will show only original module sizes from stats file.\n',
        );
    }
  }

  return parsedModules;
}

export function transformAssetsModulesData(
  parsedModulesData: ParsedModuleSizeData,
  moduleGraph: ModuleGraph,
) {
  if (!moduleGraph) return;
  Object.entries(parsedModulesData).forEach(([moduleId, parsedData]) => {
    const module = moduleGraph.getModuleByWebpackId(moduleId ?? '');
    module?.setSize({
      parsedSize: parsedData?.size,
    });
    module?.setSource({ parsedSource: parsedData?.content || '' });
  });
}
