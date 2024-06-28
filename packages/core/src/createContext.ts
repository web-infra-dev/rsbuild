import { isAbsolute, join } from 'node:path';
import type {
  BundlerType,
  NormalizedEnvironmentConfig,
  RsbuildContext,
  RsbuildEntry,
  RsbuildTarget,
} from '@rsbuild/shared';
import browserslist from '@rsbuild/shared/browserslist';
import { withDefaultConfig } from './config';
import { DEFAULT_BROWSERSLIST, ROOT_DIST_DIR } from './constants';
import { getCommonParentPath } from './helpers/path';
import { initHooks } from './initHooks';
import { getHTMLPathByEntry } from './initPlugins';
import { logger } from './logger';
import type {
  CreateRsbuildOptions,
  InternalContext,
  NormalizedConfig,
  RsbuildConfig,
} from './types';

function getAbsolutePath(root: string, filepath: string) {
  return isAbsolute(filepath) ? filepath : join(root, filepath);
}

function getAbsoluteDistPath(
  cwd: string,
  config: RsbuildConfig | NormalizedConfig | NormalizedEnvironmentConfig,
) {
  const dirRoot = config.output?.distPath?.root ?? ROOT_DIST_DIR;
  return getAbsolutePath(cwd, dirRoot);
}

/**
 * Create context by config.
 */
async function createContextByConfig(
  options: Required<CreateRsbuildOptions>,
  bundlerType: BundlerType,
  config: RsbuildConfig = {},
): Promise<RsbuildContext> {
  const { cwd } = options;
  const rootPath = cwd;
  const cachePath = join(rootPath, 'node_modules', '.cache');
  const tsconfigPath = config.source?.tsconfigPath;

  return {
    version: RSBUILD_VERSION,
    rootPath,
    distPath: '',
    cachePath,
    bundlerType,
    tsconfigPath: tsconfigPath
      ? getAbsolutePath(rootPath, tsconfigPath)
      : undefined,
  };
}

// using cache to avoid multiple calls to loadConfig
const browsersListCache = new Map<string, string[]>();

export async function getBrowserslist(path: string): Promise<string[] | null> {
  const env = process.env.NODE_ENV;
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

const hasHTML = (
  config: NormalizedEnvironmentConfig,
  target: RsbuildTarget,
) => {
  const { htmlPlugin } = config.tools as {
    htmlPlugin: boolean | Array<unknown>;
  };
  const pluginDisabled =
    htmlPlugin === false ||
    (Array.isArray(htmlPlugin) && htmlPlugin.includes(false));

  return target === 'web' && !pluginDisabled;
};

const getEnvironmentHTMLPaths = (
  entry: RsbuildEntry,
  config: NormalizedEnvironmentConfig,
) => {
  if (!hasHTML(config, config.output.target)) {
    return {};
  }

  return Object.keys(entry).reduce<Record<string, string>>((prev, key) => {
    prev[key] = getHTMLPathByEntry(key, config);
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

    context.environments[name] = {
      index,
      name,
      distPath: getAbsoluteDistPath(context.rootPath, config),
      entry,
      browserslist,
      htmlPaths,
      tsconfigPath,
      config,
    };
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
  const exposedKeys = [
    'version',
    'rootPath',
    'distPath',
    'devServer',
    'cachePath',
    'configPath',
    'tsconfigPath',
    'bundlerType',
    'environments',
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
  options: Required<CreateRsbuildOptions>,
  userRsbuildConfig: RsbuildConfig,
  bundlerType: BundlerType,
): Promise<InternalContext> {
  const rsbuildConfig = await withDefaultConfig(options.cwd, userRsbuildConfig);
  const context = await createContextByConfig(
    options,
    bundlerType,
    rsbuildConfig,
  );

  return {
    ...context,
    environments: {},
    hooks: initHooks(),
    config: { ...rsbuildConfig },
    originalConfig: userRsbuildConfig,
  };
}
