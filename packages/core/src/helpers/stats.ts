import type { StatsCompilation } from '@rspack/core';
import color from '../../compiled/picocolors/index.js';
import { formatStatsMessages } from '../client/format';
import { logger } from '../logger';
import type { Rspack } from '../types';
import { isMultiCompiler } from './';

/**
 * Add node polyfill tip when failed to resolve node built-in modules.
 */
const hintNodePolyfill = (message: string): string => {
  const getTips = (moduleName: string) => {
    const tips = [
      `Tip: "${moduleName}" is a built-in Node.js module. It cannot be imported in client-side code.`,
      `Check if you need to import Node.js module. If needed, you can use ${color.cyan('@rsbuild/plugin-node-polyfill')}.`,
    ];

    return `${message}\n\n${color.yellow(tips.join('\n'))}`;
  };

  const isNodeProtocolError = message.includes(
    'need an additional plugin to handle "node:" URIs',
  );
  if (isNodeProtocolError) {
    return getTips('node:*');
  }

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
    return getTips(moduleName);
  }

  return message;
};

function formatErrorMessage(errors: string[]) {
  const messages = errors.map((error) => hintNodePolyfill(error));
  const text = `${messages.join('\n\n')}\n`;
  const title = color.bold(color.red('Compile error: '));

  if (!errors.length) {
    return `${title}\n${color.yellow(`For more details, please setting 'stats.errors: true' `)}`;
  }

  const tip = color.yellow(
    'Failed to compile, check the errors for troubleshooting.',
  );

  return `${title}\n${tip}\n${text}`;
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
    const title = color.bold(color.yellow('Compile Warning: \n'));

    return {
      message: `${title}${warnings.join('\n\n')}\n`,
      level: 'warning',
    };
  }

  return {};
}
