import { Plugin } from '@rsbuild/doctor-types';
import {
  getAssetsModulesData as transform,
  ParsedModuleSizeData,
} from '@/build-utils/common/chunks';
import { parseBundle } from '../utils';

export async function getAssetsModulesData(
  bundleStats: Plugin.StatsCompilation,
  bundleDir: string,
): Promise<ParsedModuleSizeData | null> {
  return transform(bundleStats, bundleDir, { parseBundle });
}
