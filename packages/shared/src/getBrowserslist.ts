import { getNodeEnv } from './utils';
import browserslist from '../compiled/browserslist';
import { DEFAULT_BROWSERSLIST } from './constants';
import type { RsbuildTarget, OverrideBrowserslist } from './types';

// using cache to avoid multiple calls to loadConfig
const browsersListCache = new Map<string, string[]>();

export async function getBrowserslist(path: string) {
  const env = getNodeEnv();
  const cacheKey = path + env;

  if (browsersListCache.has(cacheKey)) {
    return browsersListCache.get(cacheKey)!;
  }

  const result = browserslist.loadConfig({ path, env });

  if (result) {
    browsersListCache.set(cacheKey, result);
    return result;
  }

  return null;
}

export async function getBrowserslistWithDefault(
  path: string,
  config: { output?: { overrideBrowserslist?: OverrideBrowserslist } },
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

enum ESVersion {
  es5 = 5,
  es2015 = 2015,
  es2016 = 2016,
  es2017 = 2017,
  es2018 = 2018,
}

// the minimal version for [es2015, es2016, es2017, es2018]
const ES_VERSIONS_MAP: Record<string, number[]> = {
  chrome: [51, 52, 57, 64],
  edge: [15, 15, 15, 79],
  safari: [10, 10.3, 11, 16.4],
  firefox: [54, 54, 54, 78],
  opera: [38, 39, 44, 51],
  samsung: [5, 6.2, 6.2, 8.2],
};

const renameBrowser = (name: string) => {
  return name === 'ios_saf' ? 'safari' : name;
};

export function browserslistToESVersion(browsers: string[]) {
  const projectBrowsers = browserslist(browsers, {
    ignoreUnknownVersions: true,
  });

  let esVersion: ESVersion = ESVersion.es2018;

  for (const item of projectBrowsers) {
    const pairs = item.split(' ');

    // skip invalid item
    if (pairs.length < 2) {
      continue;
    }

    const browser = renameBrowser(pairs[0]);
    const version = Number(pairs[1].split('-')[0]);

    // ignore unknown version
    if (Number.isNaN(version)) {
      continue;
    }

    // IE / Android 4.x ~ 5.x only supports es5
    if (browser === 'ie' || (browser === 'android' && Number(version) < 6)) {
      esVersion = ESVersion.es5;
      break;
    }

    // skip unknown browsers
    const versions = ES_VERSIONS_MAP[browser];
    if (!versions) {
      continue;
    }

    if (version < versions[0]) {
      esVersion = Math.min(ESVersion.es5, esVersion);
    } else if (version < versions[1]) {
      esVersion = Math.min(ESVersion.es2015, esVersion);
    } else if (version < versions[2]) {
      esVersion = Math.min(ESVersion.es2016, esVersion);
    } else if (version < versions[3]) {
      esVersion = Math.min(ESVersion.es2017, esVersion);
    }
  }

  return esVersion;
}
