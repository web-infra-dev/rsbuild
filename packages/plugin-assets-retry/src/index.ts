import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  EnvironmentContext,
  NormalizedEnvironmentConfig,
  RsbuildPlugin,
} from '@rsbuild/core';
import { ensureAssetPrefix } from '@rsbuild/core';
import serialize from 'serialize-javascript';
import { AsyncChunkRetryPlugin } from './AsyncChunkRetryPlugin.js';
import type { PluginAssetsRetryOptions } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export type { PluginAssetsRetryOptions };

export const PLUGIN_ASSETS_RETRY_NAME = 'rsbuild:assets-retry';

function getRuntimeOptions(userOptions: PluginAssetsRetryOptions) {
  const defaultOptions: RuntimeRetryOptions = {
    max: 3,
    type: ['link', 'script', 'img'],
    domain: [],
    crossOrigin: false,
    delay: 0,
  };

  const result: RuntimeRetryOptions = {
    ...defaultOptions,
    ...userOptions,
  };

  // Normalize config
  if (!Array.isArray(result.type) || result.type.length === 0) {
    result.type = defaultOptions.type;
  }
  if (!Array.isArray(result.domain) || result.domain.length === 0) {
    result.domain = defaultOptions.domain;
  }
  if (Array.isArray(result.domain)) {
    result.domain = result.domain.filter(Boolean);
  }

  return result;
}

async function getRetryCode(
  options: PluginAssetsRetryOptions,
): Promise<string> {
  const filename = 'initialChunkRetry';
  const { minify, inlineScript: _, ...restOptions } = options;

  const runtimeFilePath = path.join(
    __dirname,
    'runtime',
    minify ? `${filename}.min.js` : `${filename}.js`,
  );
  const runtimeCode = await fs.promises.readFile(runtimeFilePath, 'utf-8');
  const runtimeOptions = getRuntimeOptions(restOptions);

  return `(function(){${runtimeCode}})()`.replace(
    '__RUNTIME_GLOBALS_OPTIONS__',
    serialize(runtimeOptions),
  );
}

export const pluginAssetsRetry = (
  userOptions: PluginAssetsRetryOptions = {},
): RsbuildPlugin => ({
  name: PLUGIN_ASSETS_RETRY_NAME,
  setup(api) {
    const { inlineScript = true } = userOptions;

    const getScriptPath = (environment: EnvironmentContext) => {
      const distDir = environment.config.output.distPath.js;
      return path.posix.join(distDir, `assets-retry.${RSBUILD_VERSION}.js`);
    };

    const formatOptions = (config: NormalizedEnvironmentConfig) => {
      const options = { ...userOptions };

      // options.crossOrigin should be same as html.crossorigin by default
      if (options.crossOrigin === undefined) {
        options.crossOrigin = config.html.crossorigin;
      }

      if (options.minify === undefined) {
        const minify =
          typeof config.output.minify === 'boolean'
            ? config.output.minify
            : config.output.minify?.js;
        options.minify = minify && config.mode === 'production';
      }

      return options;
    };

    if (inlineScript) {
      api.modifyHTMLTags(async ({ headTags, bodyTags }, { environment }) => {
        const code = await getRetryCode(formatOptions(environment.config));

        headTags.unshift({
          tag: 'script',
          attrs: {},
          children: code,
        });

        return { headTags, bodyTags };
      });
    } else {
      api.modifyHTMLTags(
        async ({ headTags, bodyTags }, { assetPrefix, environment }) => {
          const scriptPath = getScriptPath(environment);
          const url = ensureAssetPrefix(scriptPath, assetPrefix);

          headTags.unshift({
            tag: 'script',
            attrs: {
              src: url,
            },
          });

          return { headTags, bodyTags };
        },
      );

      api.processAssets(
        { stage: 'additional' },
        async ({ sources, compilation, environment }) => {
          const scriptPath = getScriptPath(environment);
          const code = await getRetryCode(formatOptions(environment.config));
          compilation.emitAsset(scriptPath, new sources.RawSource(code));
        },
      );
    }

    api.modifyBundlerChain(async (chain, { environment }) => {
      const { config, htmlPaths } = environment;

      if (!userOptions || Object.keys(htmlPaths).length === 0) {
        return;
      }

      const options = formatOptions(config);
      const isRspack = api.context.bundlerType === 'rspack';

      chain
        .plugin('async-chunk-retry')
        .use(AsyncChunkRetryPlugin, [{ ...options, isRspack }]);
    });
  },
});
