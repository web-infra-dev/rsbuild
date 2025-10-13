import { logger } from '../logger';
import type { ActionType, RsbuildStats, Rspack } from '../types';
import { isMultiCompiler } from './compiler';
import { formatStatsError } from './format';
import { color } from './vendors';

function formatErrorMessage(errors: string[]) {
  if (!errors.length) {
    return `Build failed. No errors reported since Rspack's "stats.errors" is disabled.`;
  }

  const title = color.bold(
    color.red(errors.length > 1 ? 'Build errors: ' : 'Build error: '),
  );
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

export const getStatsAssetsOptions = (): Rspack.StatsOptions => ({
  assets: true,
  cachedAssets: true,
  groupAssetsByInfo: false,
  groupAssetsByPath: false,
  groupAssetsByChunk: false,
  groupAssetsByExtension: false,
  groupAssetsByEmitStatus: false,
});

export const getAssetsFromStats = (
  stats: Rspack.Stats,
): Rspack.StatsAsset[] => {
  const statsJson = stats.toJson({
    all: false,
    ...getStatsAssetsOptions(),
  });
  return statsJson.assets || [];
};

function getStatsOptions(
  compiler: Rspack.Compiler | Rspack.MultiCompiler,
  action?: ActionType,
): Rspack.StatsOptions {
  let defaultOptions: Rspack.StatsOptions = {
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
    defaultOptions = {
      ...defaultOptions,
      // for HMR to compare the hash
      hash: true,
      // for HMR to compare the entrypoints
      entrypoints: true,
    };
  } else if (action === 'build') {
    defaultOptions = {
      ...defaultOptions,
      ...getStatsAssetsOptions(),
    };
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

export function getRsbuildStats(
  statsInstance: Rspack.Stats | Rspack.MultiStats,
  compiler: Rspack.Compiler | Rspack.MultiCompiler,
  action?: ActionType,
): RsbuildStats {
  const statsOptions = getStatsOptions(compiler, action);
  return statsInstance.toJson(statsOptions) as RsbuildStats;
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
