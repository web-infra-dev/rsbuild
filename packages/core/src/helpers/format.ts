import type { StatsCompilation, StatsError } from '@rspack/core';
import color from '../../compiled/picocolors/index.js';

const formatFileName = (fileName: string) => {
  // add default column add lines for linking
  return /:\d+:\d+/.test(fileName)
    ? `File: ${color.cyan(fileName)}\n`
    : `File: ${color.cyan(`${fileName}:1:1`)}\n`;
};

function resolveFileName(stats: StatsError) {
  if (stats.moduleName) {
    return formatFileName(stats.moduleName);
  }

  // Get the real source file path with stats.moduleIdentifier.
  // e.g. moduleIdentifier is "builtin:react-refresh-loader!/Users/x/src/App.jsx"
  if (stats.moduleIdentifier) {
    const regex = /(?:!|^)([^!]+)$/;
    const matched = stats.moduleIdentifier.match(regex);
    if (matched) {
      const fileName = matched.pop();
      if (fileName) {
        return formatFileName(fileName);
      }
    }
  }

  // fallback to file if moduleIdentifier parse failed
  const file = stats.file;
  return file ? formatFileName(file) : '';
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

  const createPluginHint = (packageName: string, keyword: string) => {
    return `To enable support for ${keyword}, use "${color.yellow(
      `@rsbuild/plugin-${packageName}`,
    )}" ${color.dim(
      `(https://npmjs.com/package/@rsbuild/plugin-${packageName})`,
    )}.`;
  };

  const recommendPlugins = [
    {
      test: /File: .+\.s(c|a)ss/,
      hint: createPluginHint('sass', 'Sass'),
    },
    {
      test: /File: .+\.less/,
      hint: createPluginHint('less', 'Less'),
    },
    {
      test: /File: .+\.styl(us)?/,
      hint: createPluginHint('stylus', 'Stylus'),
    },
    {
      test: /File: .+\.vue?/,
      hint: createPluginHint('vue', 'Vue'),
    },
    {
      test: /File: .+\.svelte?/,
      hint: createPluginHint('svelte', 'Svelte'),
    },
    {
      test: /File: .+\.mdx/,
      hint: createPluginHint('mdx', 'MDX'),
    },
    {
      test: /File: .+\.toml/,
      hint: createPluginHint('toml', 'TOML'),
    },
    {
      test: /File: .+\.yaml/,
      hint: createPluginHint('yaml', 'YAML'),
    },
  ];

  for (const plugin of recommendPlugins) {
    if (plugin.test.test(message)) {
      return message.replace(hint, plugin.hint);
    }
  }

  return message;
}

/**
 * Add node polyfill tip when failed to resolve node built-in modules.
 */
const hintNodePolyfill = (message: string): string => {
  const getTips = (moduleName: string) => {
    const tips = [
      `Error: "${moduleName}" is a built-in Node.js module and cannot be imported in client-side code.\n`,
      'Solution: Check if you need to import Node.js module.',
      '  - If not needed, remove the import.',
      `  - If needed, use "${color.yellow('@rsbuild/plugin-node-polyfill')}" to polyfill it. (See ${color.yellow('https://npmjs.com/package/@rsbuild/plugin-node-polyfill')})`,
    ];

    return `${message}\n\n${color.red(tips.join('\n'))}`;
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
