import {
  TS_REGEX,
  castArray,
  mergeChainedOptions,
  applyScriptCondition,
  getBrowserslistWithDefault,
} from '@rsbuild/shared';
import { getBabelUtils } from '@rsbuild/plugin-babel';
import _ from 'lodash';
import { getBabelConfigForWeb } from '@rsbuild/babel-preset/web';
import { getUseBuiltIns } from './babel';
import type { RsbuildPlugin } from '../types';

export const pluginTsLoader = (): RsbuildPlugin => {
  return {
    name: 'rsbuild-webpack:ts-loader',
    setup(api) {
      api.modifyWebpackChain(async (chain, { target, CHAIN_ID }) => {
        const config = api.getNormalizedConfig();
        if (!config.tools.tsLoader) {
          return;
        }

        const { rootPath } = api.context;
        const browserslist = await getBrowserslistWithDefault(
          rootPath,
          config,
          target,
        );

        const baseBabelConfig = getBabelConfigForWeb({
          presetEnv: {
            targets: browserslist,
            useBuiltIns: getUseBuiltIns(config),
          },
        });

        const babelUtils = getBabelUtils(baseBabelConfig);

        const babelLoaderOptions = mergeChainedOptions({
          defaults: baseBabelConfig,
          options: config.tools.babel,
          utils: babelUtils,
        });

        const includes: Array<string | RegExp> = [];
        const excludes: Array<string | RegExp> = [];

        const tsLoaderUtils = {
          addIncludes(items: string | RegExp | (string | RegExp)[]) {
            includes.push(...castArray(items));
          },
          addExcludes(items: string | RegExp | (string | RegExp)[]) {
            excludes.push(...castArray(items));
          },
        };
        const tsLoaderDefaultOptions = {
          compilerOptions: {
            target: 'esnext',
            module: 'esnext',
          },
          transpileOnly: true,
          allowTsInNodeModules: true,
        };

        const tsLoaderOptions = mergeChainedOptions({
          defaults: tsLoaderDefaultOptions,
          // @ts-expect-error ts-loader has incorrect types for compilerOptions
          options: config.tools.tsLoader,
          utils: tsLoaderUtils,
        });
        const rule = chain.module.rule(CHAIN_ID.RULE.TS);

        applyScriptCondition({
          rule,
          config,
          context: api.context,
          includes,
          excludes,
        });

        rule
          .test(TS_REGEX)
          .use(CHAIN_ID.USE.BABEL)
          .loader(require.resolve('babel-loader'))
          .options(babelLoaderOptions)
          .end()
          .use(CHAIN_ID.USE.TS)
          .loader(require.resolve('ts-loader'))
          .options(tsLoaderOptions);
      });
    },
  };
};
