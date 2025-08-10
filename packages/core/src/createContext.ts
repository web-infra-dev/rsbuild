import { join } from 'node:path';
import { loadConfig } from 'browserslist-load-config';
import { DEFAULT_BROWSERSLIST, ROOT_DIST_DIR } from './constants';
import { withDefaultConfig } from './defaultConfig';
import { hash } from './helpers';
import { ensureAbsolutePath, getCommonParentPath } from './helpers/path';
import { initHooks } from './hooks';
import { getHTMLPathByEntry } from './initPlugins';
import { logger } from './logger';
import type {
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
  return ensureAbsolutePath(cwd, dirRoot);
}

// using cache to avoid multiple calls to loadConfig
const browsersListCache = new Map<string, string[]>();

export function getBrowserslist(path: string): string[] | null {
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

export function getBrowserslistByEnvironment(
  path: string,
  config: NormalizedEnvironmentConfig,
): string[] {
  const { target, overrideBrowserslist } = config.output;

  if (Array.isArray(overrideBrowserslist)) {
    return overrideBrowserslist;
  }

  // Read project browserslist config when target is `web-like`
  if (target === 'web' || target === 'web-worker') {
    const browserslistrc = getBrowserslist(path);
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
    const browserslist = getBrowserslistByEnvironment(context.rootPath, config);

    const { entry = {}, tsconfigPath } = config.source;
    const htmlPaths = getEnvironmentHTMLPaths(entry, config);
    const webSocketToken =
      context.action === 'dev' ? await hash(context.rootPath + name) : '';

    const environmentContext: EnvironmentContext = {
      index,
      name,
      distPath: getAbsoluteDistPath(context.rootPath, config),
      entry,
      browserslist,
      htmlPaths,
      tsconfigPath,
      config,
      webSocketToken,
    };

    // EnvironmentContext is readonly.
    context.environments[name] = new Proxy(environmentContext, {
      get(target, prop: keyof EnvironmentContext) {
        return target[prop];
      },
      set(target, prop: keyof EnvironmentContext, newValue) {
        if (prop === 'manifest') {
          target[prop] = newValue;
        } else {
          logger.error(
            `EnvironmentContext is readonly, you can not assign to the "environment.${prop}" prop.`,
          );
        }
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
  const exposedKeys: (keyof RsbuildContext)[] = [
    'action',
    'version',
    'rootPath',
    'distPath',
    'devServer',
    'cachePath',
    'callerName',
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
): Promise<InternalContext> {
  const { cwd } = options;
  const rootPath = userConfig.root
    ? ensureAbsolutePath(cwd, userConfig.root)
    : cwd;
  const rsbuildConfig = await withDefaultConfig(rootPath, userConfig);
  const cachePath = join(rootPath, 'node_modules', '.cache');

  const specifiedEnvironments =
    options.environment && options.environment.length > 0
      ? options.environment
      : undefined;

  const bundlerType = userConfig.provider ? 'webpack' : 'rspack';

  return {
    version: RSBUILD_VERSION,
    rootPath,
    distPath: '',
    cachePath,
    callerName: options.callerName,
    bundlerType,
    environments: {},
    hooks: initHooks(),
    config: { ...rsbuildConfig },
    originalConfig: userConfig,
    specifiedEnvironments,
  };
}
