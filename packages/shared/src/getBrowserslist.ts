import browserslist from 'browserslist';
import { DEFAULT_BROWSERSLIST } from './constants';
import type {
  RsbuildTarget,
  SharedRsbuildConfig,
  SharedNormalizedConfig,
} from './types';

// using cache to avoid multiple calls to loadConfig
const browsersListCache = new Map<string, string[]>();

export async function getBrowserslist(path: string) {
  if (browsersListCache.has(path)) {
    return browsersListCache.get(path)!;
  }

  const result = browserslist.loadConfig({ path });

  if (result) {
    browsersListCache.set(path, result);
    return result;
  }

  return null;
}

export async function getBrowserslistWithDefault(
  path: string,
  config: SharedRsbuildConfig | SharedNormalizedConfig,
  target: RsbuildTarget,
): Promise<string[]> {
  const { overrideBrowserslist: overrides = {} } = config?.output || {};

  if (target === 'web' || target === 'web-worker') {
    if (Array.isArray(overrides)) {
      return overrides;
    }
    if (overrides[target]) {
      return overrides[target]!;
    }

    const browserslistrc = await getBrowserslist(path);
    if (browserslistrc) {
      return browserslistrc;
    }
  }

  if (!Array.isArray(overrides) && overrides[target]) {
    return overrides[target]!;
  }

  return DEFAULT_BROWSERSLIST[target];
}
