import type { RsbuildPlugin } from '@rsbuild/core';
import { SCRIPT_REGEX } from '@rsbuild/shared';
import { cloneDeep } from 'lodash';
import { applyUserBabelConfig, type BabelConfig } from './helper';
import type { PluginBabelOptions } from './types';

/**
 * The `@babel/preset-typescript` default options.
 */
export const DEFAULT_BABEL_PRESET_TYPESCRIPT_OPTIONS = {
  allowNamespaces: true,
  allExtensions: true,
  allowDeclareFields: true,
  // aligns Babel's behavior with TypeScript's default behavior.
  // https://babeljs.io/docs/en/babel-preset-typescript#optimizeconstenums
  optimizeConstEnums: true,
  isTSX: true,
};

export const pluginBabel = (
  options: PluginBabelOptions = {},
): RsbuildPlugin => ({
  name: 'rsbuild:babel',

  setup(api) {
    api.modifyBundlerChain(async (chain, { CHAIN_ID, isProd }) => {
      const getBabelOptions = () => {
        // 1. Create babel utils function about include/exclude,
        const includes: Array<string | RegExp> = [];
        const excludes: Array<string | RegExp> = [];

        const babelUtils = {
          addIncludes(items: string | RegExp | Array<string | RegExp>) {
            if (Array.isArray(items)) {
              includes.push(...items);
            } else {
              includes.push(items);
            }
          },
          addExcludes(items: string | RegExp | Array<string | RegExp>) {
            if (Array.isArray(items)) {
              excludes.push(...items);
            } else {
              excludes.push(items);
            }
          },
        };

        const baseConfig = {
          plugins: [],
          presets: [
            // TODO: only apply preset-typescript for ts file (isTSX & allExtensions false)
            [
              require.resolve('@babel/preset-typescript'),
              DEFAULT_BABEL_PRESET_TYPESCRIPT_OPTIONS,
            ],
          ],
        };

        const userBabelConfig = applyUserBabelConfig(
          cloneDeep(baseConfig),
          options,
          babelUtils,
        );

        const babelOptions: BabelConfig = {
          babelrc: false,
          configFile: false,
          compact: isProd,
          ...userBabelConfig,
        };

        return {
          babelOptions,
          includes,
          excludes,
        };
      };

      const { babelOptions, includes = [], excludes = [] } = getBabelOptions();

      // already set source.include / exclude in plugin-swc
      const rule = chain.module.rule(CHAIN_ID.RULE.JS);

      includes.forEach((condition) => {
        rule.include.add(condition);
      });

      excludes.forEach((condition) => {
        rule.exclude.add(condition);
      });

      rule
        .test(SCRIPT_REGEX)
        .use(CHAIN_ID.USE.BABEL)
        .after(CHAIN_ID.USE.SWC)
        .loader(require.resolve('babel-loader'))
        .options(babelOptions);
    });
  },
});
