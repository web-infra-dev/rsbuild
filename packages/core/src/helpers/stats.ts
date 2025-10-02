import color from '../../compiled/picocolors/index.js';
import { logger } from '../logger';
import type { RsbuildStats, Rspack } from '../types';
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

export const hasStatsErrors = (stats: RsbuildStats): boolean =>
  getStatsErrors(stats).length > 0;

export const hasStatsWarnings = (stats: RsbuildStats): boolean =>
  getStatsWarnings(stats).length > 0;

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
): Rspack.StatsOptions {
  if (isMultiCompiler(compiler)) {
    return {
      children: compiler.compilers.map((compiler) =>
        compiler.options ? compiler.options.stats : undefined,
      ),
    } as unknown as Rspack.StatsOptions;
  }

  const { stats } = compiler.options;

  if (typeof stats === 'string') {
    return { preset: stats };
  }
  if (typeof stats === 'object') {
    return stats;
  }

  return {};
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
    const statsErrors = getStatsErrors(stats);
    const errors = statsErrors.map((item) => formatStatsError(item, verbose));
    return {
      message: formatErrorMessage(errors),
      level: 'error',
    };
  }

  const statsWarnings = getStatsWarnings(stats);
  const warnings = statsWarnings.map((item) => formatStatsError(item, verbose));

  if (warnings.length) {
    const title = color.bold(
      color.yellow(
        warnings.length > 1 ? 'Build warnings: \n' : 'Build warning: \n',
      ),
    );

    return {
      message: `${title}${warnings.join('\n\n')}\n`,
      level: 'warning',
    };
  }

  return {};
}
