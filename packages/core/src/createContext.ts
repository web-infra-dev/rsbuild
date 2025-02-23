import { join } from 'node:path';
import { loadConfig } from 'browserslist-load-config';
import { withDefaultConfig } from './config';
import { DEFAULT_BROWSERSLIST, ROOT_DIST_DIR } from './constants';
import { getAbsolutePath, getCommonParentPath } from './helpers/path';
import { initHooks } from './hooks';
import { getHTMLPathByEntry } from './initPlugins';
import { logger } from './logger';
import type {
  BundlerType,
  EnvironmentContext,
  InternalContext,
  NormalizedConfig,
  NormalizedEnvironmentConfig,
  ResolvedCreateRsbuildOptions,
  RsbuildConfig,
  RsbuildContext,
  RsbuildEntry,
} from './types';

function getAbsoluteDistPath(
  cwd: string,
  config: RsbuildConfig | NormalizedConfig | NormalizedEnvironmentConfig,
) {
  const dirRoot = config.output?.distPath?.root ?? ROOT_DIST_DIR;
  return getAbsolutePath(cwd, dirRoot);
}

// using cache to avoid multiple calls to loadConfig
const browsersListCache = new Map<string, string[]>();

export async function getBrowserslist(path: string): Promise<string[] | null> {
  const env = process.env.NODE_ENV;
  const cacheKey = path + env;

  if (browsersListCache.has(cacheKey)) {
    return browsersListCache.get(cacheKey)!;
  }

  const result = loadConfig({ path, env });

  if (result) {
    browsersListCache.set(cacheKey, result);
    return result;
  }

  return null;
}

export async function getBrowserslistByEnvironment(
  path: string,
  config: NormalizedEnvironmentConfig,
): Promise<string[]> {
  const { target, overrideBrowserslist } = config.output;

  if (Array.isArray(overrideBrowserslist)) {
    return overrideBrowserslist;
  }

  // Read project browserslist config when target is `web-like`
  if (target === 'web' || target === 'web-worker') {
    const browserslistrc = await getBrowserslist(path);
    if (browserslistrc) {
      return browserslistrc;
    }
  }

  return DEFAULT_BROWSERSLIST[target];
}

const getEnvironmentHTMLPaths = (
  entry: RsbuildEntry,
  config: NormalizedEnvironmentConfig,
) => {
  if (config.output.target !== 'web' || config.tools.htmlPlugin === false) {
    return {};
  }

  return Object.keys(entry).reduce<Record<string, string>>((prev, key) => {
    const entryValue = entry[key];

    // Should not generate HTML file for the entry if `html` is false
    if (
      typeof entryValue === 'string' ||
      Array.isArray(entryValue) ||
      entryValue.html !== false
    ) {
      prev[key] = getHTMLPathByEntry(key, config);
    }

    return prev;
  }, {});
};

export async function updateEnvironmentContext(
  context: InternalContext,
  configs: Record<string, NormalizedEnvironmentConfig>,
): Promise<void> {
  context.environments ||= {};

  for (const [index, [name, config]] of Object.entries(configs).entries()) {
    const tsconfigPath = config.source.tsconfigPath
      ? getAbsolutePath(context.rootPath, config.source.tsconfigPath)
      : undefined;

    const browserslist = await getBrowserslistByEnvironment(
      context.rootPath,
      config,
    );

    const entry = config.source.entry ?? {};
    const htmlPaths = getEnvironmentHTMLPaths(entry, config);

    const environmentContext = {
      index,
      name,
      distPath: getAbsoluteDistPath(context.rootPath, config),
      entry,
      browserslist,
      htmlPaths,
      tsconfigPath,
      config,
    };

    // EnvironmentContext is readonly.
    context.environments[name] = new Proxy(environmentContext, {
      get(target, prop: keyof EnvironmentContext) {
        return target[prop];
      },
      set(_, prop: keyof EnvironmentContext) {
        logger.error(
          `EnvironmentContext is readonly, you can not assign to the "environment.${prop}" prop.`,
        );
        return true;
      },
    });
  }
}

export function updateContextByNormalizedConfig(
  context: InternalContext,
): void {
  // Try to get the parent dist path from all environments
  const distPaths = Object.values(context.environments).map(
    (item) => item.distPath,
  );
  context.distPath = getCommonParentPath(distPaths);
}

export function createPublicContext(
  context: RsbuildContext,
): Readonly<RsbuildContext> {
  const exposedKeys: Array<keyof RsbuildContext> = [
    'version',
    'rootPath',
    'distPath',
    'devServer',
    'cachePath',
    'bundlerType',
  ];

  // Using Proxy to get the current value of context.
  return new Proxy(context, {
    get(target, prop: keyof RsbuildContext) {
      if (exposedKeys.includes(prop)) {
        return target[prop];
      }
      return undefined;
    },
    set(_, prop: keyof RsbuildContext) {
      logger.error(
        `Context is readonly, you can not assign to the "context.${prop}" prop.`,
      );
      return true;
    },
  });
}

/**
 * Generate the actual context used in the build,
 * which can have a lot of overhead and take some side effects.
 */
export async function createContext(
  options: ResolvedCreateRsbuildOptions,
  userConfig: RsbuildConfig,
  bundlerType: BundlerType,
): Promise<InternalContext> {
  const { cwd } = options;
  const rootPath = userConfig.root
    ? getAbsolutePath(cwd, userConfig.root)
    : cwd;
  const rsbuildConfig = await withDefaultConfig(rootPath, userConfig);
  const cachePath = join(rootPath, 'node_modules', '.cache');

  const specifiedEnvironments =
    options.environment && options.environment.length > 0
      ? options.environment
      : undefined;

  return {
    version: RSBUILD_VERSION,
    rootPath,
    distPath: '',
    cachePath,
    bundlerType,
    environments: {},
    hooks: initHooks(),
    config: { ...rsbuildConfig },
    originalConfig: userConfig,
    specifiedEnvironments,
  };
}
