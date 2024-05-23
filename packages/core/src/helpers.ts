import path from 'node:path';
import {
  type BundlerChain,
  DEFAULT_ASSET_PREFIX,
  type MultiStats,
  type Stats,
  type StatsError,
  addTrailingSlash,
  color,
  isMultiCompiler,
  removeTailingSlash,
} from '@rsbuild/shared';
import { fse } from '@rsbuild/shared';
import type { StatsCompilation, StatsValue } from '@rspack/core';
import { formatStatsMessages } from './client/format';
import { COMPILED_PATH } from './constants';

// depend on native IgnorePlugin
export const rspackMinVersion = '0.6.2';

const compareSemver = (version1: string, version2: string) => {
  const parts1 = version1.split('.').map(Number);
  const parts2 = version2.split('.').map(Number);
  const len = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < len; i++) {
    const item1 = parts1[i] ?? 0;
    const item2 = parts2[i] ?? 0;
    if (item1 > item2) {
      return 1;
    }
    if (item1 < item2) {
      return -1;
    }
  }

  return 0;
};

export const isSatisfyRspackVersion = async (originalVersion: string) => {
  let version = originalVersion;

  // The nightly version of rspack is to append `-canary-abc` to the current version
  if (version.includes('-canary')) {
    version = version.split('-canary')[0];
  }

  if (version && /^[\d\.]+$/.test(version)) {
    return compareSemver(version, rspackMinVersion) >= 0;
  }

  // ignore other unstable versions
  return true;
};

export const getCompiledPath = (packageName: string) =>
  path.join(COMPILED_PATH, packageName);

/**
 * Add node polyfill tip when failed to resolve node built-in modules.
 */
const hintNodePolyfill = (message: string): string => {
  if (!message.includes(`Can't resolve`)) {
    return message;
  }

  const matchArray = message.match(/Can't resolve '(\w+)'/);
  if (!matchArray) {
    return message;
  }

  const moduleName = matchArray[1];
  const nodeModules = [
    'assert',
    'buffer',
    'child_process',
    'cluster',
    'console',
    'constants',
    'crypto',
    'dgram',
    'dns',
    'domain',
    'events',
    'fs',
    'http',
    'https',
    'module',
    'net',
    'os',
    'path',
    'punycode',
    'process',
    'querystring',
    'readline',
    'repl',
    'stream',
    '_stream_duplex',
    '_stream_passthrough',
    '_stream_readable',
    '_stream_transform',
    '_stream_writable',
    'string_decoder',
    'sys',
    'timers',
    'tls',
    'tty',
    'url',
    'util',
    'vm',
    'zlib',
  ];

  if (moduleName && nodeModules.includes(moduleName)) {
    const tips = [
      `Tip: "${moduleName}" is a built-in Node.js module and cannot be imported in client-side code.`,
      `Check if you need to import Node.js module. If needed, you can use "@rsbuild/plugin-node-polyfill".`,
    ];
    return `${message}\n\n${color.yellow(tips.join('\n'))}`;
  }

  return message;
};

function formatErrorMessage(errors: string[]) {
  const messages = errors.map((error) => hintNodePolyfill(error));

  const text = `${messages.join('\n\n')}\n`;
  const isTerserError = text.includes('from Terser');
  const title = color.bold(
    color.red(isTerserError ? 'Minify error: ' : 'Compile error: '),
  );

  if (!errors.length) {
    return `${title}\n${color.yellow(`For more details, please setting 'stats.errors: true' `)}`;
  }

  const tip = color.yellow(
    isTerserError
      ? 'Failed to minify with terser, check for syntax errors.'
      : 'Failed to compile, check the errors for troubleshooting.',
  );

  return `${title}\n${tip}\n${text}`;
}

export const getAllStatsErrors = (statsData: StatsCompilation) => {
  // stats error + childCompiler error
  // only append child errors when stats error does not exist, because some errors will exist in both stats and childCompiler
  if (statsData.errorsCount && statsData.errors?.length === 0) {
    return statsData.children?.reduce<StatsError[]>(
      (errors, curr) => errors.concat(curr.errors || []),
      [],
    );
  }

  return statsData.errors;
};

export const getAllStatsWarnings = (statsData: StatsCompilation) => {
  if (statsData.warningsCount && statsData.warnings?.length === 0) {
    return statsData.children?.reduce<StatsError[]>(
      (warnings, curr) => warnings.concat(curr.warnings || []),
      [],
    );
  }

  return statsData.warnings;
};

export function getStatsOptions(
  compiler: Parameters<typeof isMultiCompiler>[0],
): StatsValue | undefined {
  if (isMultiCompiler(compiler)) {
    return {
      children: compiler.compilers.map((compiler) =>
        compiler.options ? compiler.options.stats : undefined,
      ),
    } as unknown as StatsValue;
  }

  return compiler.options ? (compiler.options.stats as StatsValue) : undefined;
}

export function formatStats(
  stats: Stats | MultiStats,
  options: StatsValue = {},
) {
  const statsData = stats.toJson(
    typeof options === 'object'
      ? {
          preset: 'errors-warnings',
          children: true,
          ...options,
        }
      : options,
  );

  const { errors, warnings } = formatStatsMessages({
    errors: getAllStatsErrors(statsData),
    warnings: getAllStatsWarnings(statsData),
  });

  if (stats.hasErrors()) {
    return {
      message: formatErrorMessage(errors),
      level: 'error',
    };
  }

  if (warnings.length) {
    const title = color.bold(color.yellow('Compile Warning: \n'));

    return {
      message: `${title}${warnings.join('\n\n')}\n`,
      level: 'warning',
    };
  }

  return {};
}

export const formatPublicPath = (publicPath: string, withSlash = true) => {
  // 'auto' is a magic value in Rspack and we should not add trailing slash
  if (publicPath === 'auto') {
    return publicPath;
  }

  return withSlash
    ? addTrailingSlash(publicPath)
    : removeTailingSlash(publicPath);
};

export const getPublicPathFromChain = (
  chain: BundlerChain,
  withSlash = true,
) => {
  const publicPath = chain.output.get('publicPath');

  if (typeof publicPath === 'string') {
    return formatPublicPath(publicPath, withSlash);
  }

  return formatPublicPath(DEFAULT_ASSET_PREFIX, withSlash);
};

/**
 * ensure absolute file path.
 * @param base - Base path to resolve relative from.
 * @param filePath - Absolute or relative file path.
 * @returns Resolved absolute file path.
 */
export const ensureAbsolutePath = (base: string, filePath: string): string =>
  path.isAbsolute(filePath) ? filePath : path.resolve(base, filePath);

export const isFileSync = (filePath: string) => {
  try {
    return fse.statSync(filePath, { throwIfNoEntry: false })?.isFile();
  } catch (_) {
    return false;
  }
};

/**
 * Find first already exists file.
 * @param files - Absolute file paths with extension.
 * @returns The file path if exists, or false if no file exists.
 */
export const findExists = (files: string[]): string | false => {
  for (const file of files) {
    if (isFileSync(file)) {
      return file;
    }
  }
  return false;
};

export async function isFileExists(file: string) {
  return fse.promises
    .access(file, fse.constants.F_OK)
    .then(() => true)
    .catch(() => false);
}
