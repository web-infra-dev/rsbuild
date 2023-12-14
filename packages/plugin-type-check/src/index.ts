import { logger, type RsbuildPlugin } from '@rsbuild/core';
import {
  fse,
  CHAIN_ID,
  deepmerge,
  mergeChainedOptions,
  type ChainedConfig,
} from '@rsbuild/shared';
import type ForkTSCheckerPlugin from 'fork-ts-checker-webpack-plugin';

type ForkTsCheckerOptions = ConstructorParameters<
  typeof ForkTSCheckerPlugin
>[0];

export type PluginTypeCheckerOptions = {
  enable?: boolean;
  forkTsCheckerOptions?: ChainedConfig<ForkTsCheckerOptions>;
};

export const pluginTypeCheck = (
  options: PluginTypeCheckerOptions = {},
): RsbuildPlugin => {
  return {
    name: 'rsbuild:type-check',

    setup(api) {
      api.modifyBundlerChain(async (chain, { target, isProd }) => {
        const { enable = true, forkTsCheckerOptions } = options;

        if (!api.context.tsconfigPath || enable === false) {
          return;
        }

        // If there is multiple target, only apply type checker to the first target
        // to avoid multiple type checker running at the same time
        if (target !== api.context.targets[0]) {
          return;
        }

        // use typescript of user project
        let typescriptPath: string;
        try {
          typescriptPath = require.resolve('typescript', {
            paths: [api.context.rootPath],
          });
        } catch (err) {
          logger.warn(
            '"typescript" is not found in current project, Type checker will not work.',
          );
          return;
        }

        const { default: ForkTsCheckerWebpackPlugin } = await import(
          'fork-ts-checker-webpack-plugin'
        );

        const { default: json5 } = await import('@rsbuild/shared/json5');
        const { references } = json5.parse(
          fse.readFileSync(api.context.tsconfigPath, 'utf-8'),
        );
        const useReference = Array.isArray(references) && references.length > 0;

        const defaultOptions: ForkTsCheckerOptions = {
          typescript: {
            // set 'readonly' to avoid emitting tsbuildinfo,
            // as the generated tsbuildinfo will break fork-ts-checker
            mode: 'readonly',
            // enable build when using project reference
            build: useReference,
            // avoid OOM issue
            memoryLimit: 8192,
            // use tsconfig of user project
            configFile: api.context.tsconfigPath,
            // use typescript of user project
            typescriptPath,
          },
          issue: {
            exclude: [
              { file: '**/*.(spec|test).ts' },
              { file: '**/node_modules/**/*' },
            ],
          },
          logger: {
            log() {
              // do nothing
              // we only want to display error messages
            },
            error(message: string) {
              console.error(message.replace(/ERROR/g, 'Type Error'));
            },
          },
        };

        const typeCheckerOptions = mergeChainedOptions({
          defaults: defaultOptions,
          options: forkTsCheckerOptions,
          mergeFn: deepmerge,
        });

        if (api.context.bundlerType === 'rspack' && isProd) {
          logger.info('Ts checker running...');
          logger.info(
            'Ts checker is running slowly and will block builds until it is complete, please be patient and wait.',
          );
        }

        chain
          .plugin(CHAIN_ID.PLUGIN.TS_CHECKER)
          .use(ForkTsCheckerWebpackPlugin, [typeCheckerOptions]);
      });
    },
  };
};
