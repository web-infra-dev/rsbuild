import type { StatsCompilation, StatsError } from '@rspack/core';
import color from '../../compiled/picocolors/index.js';

function resolveFileName(stats: StatsError) {
  // Get the real source file path with stats.moduleIdentifier.
  // e.g. moduleIdentifier is "builtin:react-refresh-loader!/Users/x/src/App.jsx"
  if (stats.moduleIdentifier) {
    const regex = /(?:\!|^)([^!]+)$/;
    const matched = stats.moduleIdentifier.match(regex);
    if (matched) {
      const fileName = matched.pop();
      if (fileName) {
        // add default column add lines for linking
        return `File: ${fileName}:1:1\n`;
      }
    }
  }

  // fallback to file or moduleName if moduleIdentifier parse failed
  const file = stats.file || stats.moduleName;
  return file ? `File: ${file}\n` : '';
}

function resolveModuleTrace(stats: StatsError) {
  let traceStr = '';
  if (stats.moduleTrace) {
    for (const trace of stats.moduleTrace) {
      if (trace.originName) {
        // TODO: missing moduleTrace.dependencies[].loc in rspack
        traceStr += `\n @ ${trace.originName}`;
      }
    }
  }

  return traceStr;
}

function hintUnknownFiles(message: string): string {
  const hint = 'You may need an appropriate loader to handle this file type.';

  if (message.indexOf(hint) === -1) {
    return message;
  }

  if (/File: .+\.s(c|a)ss/.test(message)) {
    return message.replace(
      hint,
      `To enable support for Sass, use "${color.yellow('@rsbuild/plugin-sass')}".`,
    );
  }
  if (/File: .+\.less/.test(message)) {
    return message.replace(
      hint,
      `To enable support for Less, use "${color.yellow('@rsbuild/plugin-less')}".`,
    );
  }
  if (/File: .+\.styl(us)?/.test(message)) {
    return message.replace(
      hint,
      `To enable support for Stylus, use "${color.yellow('@rsbuild/plugin-stylus')}".`,
    );
  }

  return message;
}

/**
 * Add node polyfill tip when failed to resolve node built-in modules.
 */
const hintNodePolyfill = (message: string): string => {
  const getTips = (moduleName: string) => {
    const tips = [
      `Tip: "${moduleName}" is a built-in Node.js module. It cannot be imported in client-side code.`,
      `Check if you need to import Node.js module. If needed, you can use "${color.cyan('@rsbuild/plugin-node-polyfill')}" to polyfill it.`,
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

// Cleans up Rspack error messages.
function formatMessage(stats: StatsError | string, verbose?: boolean) {
  let lines: string[] = [];
  let message: string;

  // Stats error object
  if (typeof stats === 'object') {
    const fileName = resolveFileName(stats);
    const mainMessage = stats.message;
    const details =
      verbose && stats.details ? `\nDetails: ${stats.details}\n` : '';
    const stack = verbose && stats.stack ? `\n${stats.stack}` : '';
    const moduleTrace = resolveModuleTrace(stats);

    message = `${fileName}${mainMessage}${details}${stack}${moduleTrace}`;
  } else {
    message = stats;
  }

  // Remove inner error message
  const innerError = '-- inner error --';
  if (!verbose && message.includes(innerError)) {
    message = message.split(innerError)[0];
  }

  message = hintUnknownFiles(message);
  message = hintNodePolyfill(message);

  lines = message.split('\n');

  // Remove duplicated newlines
  lines = lines.filter(
    (line, index, arr) =>
      index === 0 ||
      line.trim() !== '' ||
      line.trim() !== arr[index - 1].trim(),
  );

  // Reassemble the message
  message = lines.join('\n');

  return message.trim();
}

export function formatStatsMessages(
  stats: Pick<StatsCompilation, 'errors' | 'warnings'>,
  verbose?: boolean,
): {
  errors: string[];
  warnings: string[];
} {
  const formattedErrors =
    stats.errors?.map((error) => formatMessage(error, verbose)) || [];
  const formattedWarnings =
    stats.warnings?.map((warning) => formatMessage(warning, verbose)) || [];

  return {
    errors: formattedErrors,
    warnings: formattedWarnings,
  };
}
