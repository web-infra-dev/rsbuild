import type { StatsCompilation } from '@rspack/core';
import color from '../../compiled/picocolors/index.js';
import { logger } from '../logger';
import type { Rspack } from '../types';
import { isMultiCompiler } from './';
import { formatStatsMessages } from './format.js';

function formatErrorMessage(errors: string[]) {
  const title = color.bold(color.red('Build error: '));

  if (!errors.length) {
    return `${title}\n${color.yellow(`For more details, please setting 'stats.errors: true' `)}`;
  }

  const text = `${errors.join('\n\n')}\n`;

  return `${title}\n${text}`;
}

export const getAllStatsErrors = (
  statsData: StatsCompilation,
): Rspack.StatsError[] | undefined => {
  // stats error + childCompiler error
  // only append child errors when stats error does not exist, because some errors will exist in both stats and childCompiler
  if (statsData.errorsCount && statsData.errors?.length === 0) {
    return statsData.children?.reduce<Rspack.StatsError[]>(
      (errors, curr) => errors.concat(curr.errors || []),
      [],
    );
  }

  return statsData.errors;
};

export const getAllStatsWarnings = (
  statsData: StatsCompilation,
): Rspack.StatsError[] | undefined => {
  if (statsData.warningsCount && statsData.warnings?.length === 0) {
    return statsData.children?.reduce<Rspack.StatsError[]>(
      (warnings, curr) => warnings.concat(curr.warnings || []),
      [],
    );
  }

  return statsData.warnings;
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
  statsData: Rspack.StatsCompilation,
  hasErrors: boolean,
): {
  message?: string;
  level?: string;
} {
  // display verbose messages in debug mode
  const verbose = logger.level === 'verbose';

  if (hasErrors) {
    const { errors } = formatStatsMessages(
      {
        errors: getAllStatsErrors(statsData),
        warnings: [],
      },
      verbose,
    );

    return {
      message: formatErrorMessage(errors),
      level: 'error',
    };
  }

  const { warnings } = formatStatsMessages(
    {
      errors: [],
      warnings: getAllStatsWarnings(statsData),
    },
    verbose,
  );

  if (warnings.length) {
    const title = color.bold(color.yellow('Compile warning: \n'));

    return {
      message: `${title}${warnings.join('\n\n')}\n`,
      level: 'warning',
    };
  }

  return {};
}
