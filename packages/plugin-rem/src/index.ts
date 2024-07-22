import path from 'node:path';
import {
  type PostCSSPlugin,
  type RsbuildPlugin,
  ensureAssetPrefix,
  logger,
} from '@rsbuild/core';
import deepmerge from 'deepmerge';
import { DEFAULT_OPTIONS, getRootPixelCode } from './helpers';
import type { PluginRemOptions, PxToRemOptions } from './types';

export type { PluginRemOptions };

export const PLUGIN_REM_NAME = 'rsbuild:rem';

export const pluginRem = (
  userOptions: PluginRemOptions = {},
): RsbuildPlugin => ({
  name: PLUGIN_REM_NAME,

  setup(api) {
    const options = {
      ...DEFAULT_OPTIONS,
      ...userOptions,
    };

    let scriptPath: string | undefined;
    let runtimeCode: string | undefined;

    const getScriptPath = (distDir: string) => {
      if (!scriptPath) {
        scriptPath = path.posix.join(
          distDir,
          `convert-rem.${RSBUILD_VERSION}.js`,
        );
      }

      return scriptPath;
    };

    const getRuntimeCode = async () => {
      if (!runtimeCode) {
        const isCompress = process.env.NODE_ENV === 'production';
        runtimeCode = await getRootPixelCode(options, isCompress);
      }
      return runtimeCode;
    };

    const getPostCSSPlugin = async () => {
      const { default: pxToRemPlugin } = (await import(
        '../compiled/postcss-pxtorem/index.js'
      )) as {
        default: (_opts: PxToRemOptions) => PostCSSPlugin;
      };

      return pxToRemPlugin({
        rootValue: options.rootFontSize,
        unitPrecision: 5,
        propList: ['*'],
        ...(options.pxtorem ? deepmerge({}, options.pxtorem) : {}),
      });
    };

    api.modifyRsbuildConfig(async (config, { mergeRsbuildConfig }) => {
      const remPlugin = await getPostCSSPlugin();
      return mergeRsbuildConfig(config, {
        tools: {
          postcss(_, { addPlugins }) {
            addPlugins(remPlugin);
          },
        },
      });
    });

    api.processAssets(
      { stage: 'additional' },
      async ({ compilation, environment, sources }) => {
        const { config } = environment;

        if (
          config.output.target !== 'web' ||
          !options.enableRuntime ||
          options.inlineRuntime
        ) {
          return;
        }

        const code = await getRuntimeCode();
        const scriptPath = getScriptPath(config.output.distPath.js);
        compilation.emitAsset(scriptPath, new sources.RawSource(code));
      },
    );

    api.modifyHTMLTags(
      async (
        { headTags, bodyTags },
        { environment, filename, assetPrefix },
      ) => {
        const entries = Object.keys(environment.entry);
        const { config } = environment;

        const isExclude = options.excludeEntries.find((item: string) => {
          if (!entries.includes(item)) {
            logger.error(`convertToRem: can't find the entryName: ${item}`);
            return false;
          }

          const reg = new RegExp(`(/${item}/index.html)|(/${item}.html)`, 'gi');
          return reg.test(filename);
        });

        if (isExclude) {
          return { headTags, bodyTags };
        }

        const scriptTag = {
          tag: 'script',
          attrs: {},
        };

        let injectPosition = 0;
        // should inject rem runtime code after meta tags
        headTags.forEach((tag, index) => {
          if (tag.tag === 'meta') {
            injectPosition = index + 1;
          }
        });

        if (options.inlineRuntime) {
          headTags.splice(injectPosition, 0, {
            ...scriptTag,
            children: await getRuntimeCode(),
          });
        } else {
          const url = ensureAssetPrefix(
            getScriptPath(config.output.distPath.js),
            assetPrefix,
          );

          const attrs: Record<string, string> = {
            ...scriptTag.attrs,
            src: url,
          };

          if (config.html.scriptLoading === 'defer') {
            attrs.defer = '';
          }
          if (config.html.scriptLoading === 'module') {
            attrs.type = 'module';
          }

          headTags.splice(injectPosition, 0, {
            ...scriptTag,
            attrs,
          });
        }

        return {
          headTags,
          bodyTags,
        };
      },
    );
  },
});
