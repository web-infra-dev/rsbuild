import { type ConfigChain, type RsbuildPlugin, logger } from '@rsbuild/core';
import {
  CHAIN_ID,
  NODE_MODULES_REGEX,
  deepmerge,
  fse,
  reduceConfigs,
} from '@rsbuild/shared';
import type ForkTSCheckerPlugin from 'fork-ts-checker-webpack-plugin';

type ForkTsCheckerOptions = NonNullable<
  ConstructorParameters<typeof ForkTSCheckerPlugin>[0]
>;

export type PluginTypeCheckerOptions = {
  /**
   * Whether to enable TypeScript type checking.
   * @default true
   */
  enable?: boolean;
  /**
   * To modify the options of `fork-ts-checker-webpack-plugin`.
   * @see https://github.com/TypeStrong/fork-ts-checker-webpack-plugin#readme
   */
  forkTsCheckerOptions?: ConfigChain<ForkTsCheckerOptions>;
};

export const PLUGIN_TYPE_CHECK_NAME = 'rsbuild:type-check';

export const pluginTypeCheck = (
  options: PluginTypeCheckerOptions = {},
): RsbuildPlugin => {
  return {
    name: PLUGIN_TYPE_CHECK_NAME,

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
            // ignore types errors from node_modules
            exclude: [({ file = '' }) => NODE_MODULES_REGEX.test(file)],
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

        const typeCheckerOptions = reduceConfigs({
          initial: defaultOptions,
          config: forkTsCheckerOptions,
          mergeFn: deepmerge,
        });

        if (isProd) {
          logger.info('Type checker is enabled. It may take some time.');
        }

        chain
          .plugin(CHAIN_ID.PLUGIN.TS_CHECKER)
          .use(ForkTsCheckerWebpackPlugin, [typeCheckerOptions]);
      });
    },
  };
};
