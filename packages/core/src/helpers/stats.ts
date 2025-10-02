import color from '../../compiled/picocolors/index.js';
import { logger } from '../logger';
import type { ActionType, RsbuildStats, Rspack } from '../types';
import { isMultiCompiler } from './';
import { formatStatsError } from './format';

function formatErrorMessage(errors: string[]) {
  const title = color.bold(
    color.red(errors.length > 1 ? 'Build errors: ' : 'Build error: '),
  );

  if (!errors.length) {
    return `${title}\n${color.yellow(`For more details, please set 'stats.errors: true' `)}`;
  }

  const text = `${errors.join('\n\n')}\n`;

  return `${title}\n${text}`;
}

/**
 * If stats has errors, return stats errors directly
 * If stats has no errors, return child errors, as some errors exist in both
 * stats and childCompiler
 */
export const getStatsErrors = ({
  errors,
  children,
}: RsbuildStats): Rspack.StatsError[] => {
  if (errors !== undefined && errors.length > 0) {
    return errors;
  }

  if (children) {
    return children.reduce<Rspack.StatsError[]>(
      (errors, ret) => (ret.errors ? errors.concat(ret.errors) : errors),
      [],
    );
  }

  return [];
};

export const getStatsWarnings = ({
  warnings,
  children,
}: RsbuildStats): Rspack.StatsError[] => {
  if (warnings !== undefined && warnings.length > 0) {
    return warnings;
  }

  if (children) {
    return children.reduce<Rspack.StatsError[]>(
      (warnings, ret) =>
        ret.warnings ? warnings.concat(ret.warnings) : warnings,
      [],
    );
  }

  return [];
};

export const getAssetsFromStats = (
  stats: Rspack.Stats,
): Rspack.StatsAsset[] => {
  const statsJson = stats.toJson({
    all: false,
    assets: true,
    cachedAssets: true,
    groupAssetsByInfo: false,
    groupAssetsByPath: false,
    groupAssetsByChunk: false,
    groupAssetsByExtension: false,
    groupAssetsByEmitStatus: false,
  });

  return statsJson.assets || [];
};

export function getStatsOptions(
  compiler: Rspack.Compiler | Rspack.MultiCompiler,
  action?: ActionType,
): Rspack.StatsOptions {
  const defaultOptions: Rspack.StatsOptions = {
    all: false,
    // for displaying the build time
    timings: true,
    // for displaying the build errors
    errors: true,
    // for displaying the build warnings
    warnings: true,
    // for displaying the module trace when build failed
    moduleTrace: true,
  };

  if (action === 'dev') {
    // for HMR to compare the hash
    defaultOptions.hash = true;
    // for HMR to compare the entrypoints
    defaultOptions.entrypoints = true;
  }

  if (isMultiCompiler(compiler)) {
    return {
      ...defaultOptions,
      children: compiler.compilers.map((compiler) =>
        compiler.options ? compiler.options.stats : undefined,
      ),
    } as unknown as Rspack.StatsOptions;
  }

  const { stats } = compiler.options;

  if (typeof stats === 'string') {
    return { ...defaultOptions, preset: stats };
  }

  if (typeof stats === 'object') {
    return { ...defaultOptions, ...stats };
  }

  return defaultOptions;
}

export function formatStats(
  stats: RsbuildStats,
  hasErrors: boolean,
): {
  message?: string;
  level?: string;
} {
  // display verbose messages in debug mode
  const verbose = logger.level === 'verbose';

  if (hasErrors) {
    const errors = getStatsErrors(stats);
    const errorMessages = errors.map((item) => formatStatsError(item, verbose));
    return {
      message: formatErrorMessage(errorMessages),
      level: 'error',
    };
  }

  const warnings = getStatsWarnings(stats);
  const warningMessages = warnings.map((item) =>
    formatStatsError(item, verbose),
  );

  if (warningMessages.length) {
    const title = color.bold(
      color.yellow(
        warningMessages.length > 1 ? 'Build warnings: \n' : 'Build warning: \n',
      ),
    );

    return {
      message: `${title}${warningMessages.join('\n\n')}\n`,
      level: 'warning',
    };
  }

  return {};
}
