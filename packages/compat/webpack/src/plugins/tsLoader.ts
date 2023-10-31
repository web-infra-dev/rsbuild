import {
  TS_REGEX,
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
    name: 'plugin-ts-loader',
    setup(api) {
      api.modifyWebpackChain(
        async (chain, { target, CHAIN_ID, getCompiledPath }) => {
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

          const babelLoaderOptions = mergeChainedOptions(
            baseBabelConfig,
            config.tools.babel,
            babelUtils,
          );

          const includes: Array<string | RegExp> = [];
          const excludes: Array<string | RegExp> = [];

          const tsLoaderUtils = {
            addIncludes(items: string | RegExp | (string | RegExp)[]) {
              includes.push(..._.castArray(items));
            },
            addExcludes(items: string | RegExp | (string | RegExp)[]) {
              excludes.push(..._.castArray(items));
            },
          };
          // @ts-expect-error ts-loader has incorrect types for compilerOptions
          const tsLoaderOptions = mergeChainedOptions(
            {
              compilerOptions: {
                target: 'esnext',
                module: 'esnext',
              },
              transpileOnly: true,
              allowTsInNodeModules: true,
            },
            config.tools.tsLoader,
            tsLoaderUtils,
          );
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
            .loader(getCompiledPath('babel-loader'))
            .options(babelLoaderOptions)
            .end()
            .use(CHAIN_ID.USE.TS)
            .loader(require.resolve('ts-loader'))
            .options(tsLoaderOptions);
        },
      );
    },
  };
};
