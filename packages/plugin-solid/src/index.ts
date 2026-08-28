import path from 'node:path';
import type { RsbuildMode, RsbuildPlugin } from '@rsbuild/core';
import { DEFAULT_SOLID_SCRIPT_REGEX } from './helpers.js';
import type { SolidCompiler, SolidPresetOptions } from './types.js';

export type { SolidCompiler, SolidPresetOptions } from './types.js';

const SOLID_BUILT_INS = [
  'For',
  'Show',
  'Switch',
  'Match',
  'Loading',
  'Reveal',
  'Portal',
  'Repeat',
  'Dynamic',
  'Errored',
];
export type PluginSolidOptions = {
  /**
   * JSX compiler backend to use.
   * @default 'native'
   */
  compiler?: SolidCompiler;
  /**
   * Whether to enable Solid's development runtime and compiler transforms.
   * @default `true` in development mode, `false` in production mode
   */
  dev?: boolean;
  /**
   * Whether to generate output for Solid SSR.
   * @default false
   */
  ssr?: boolean;
  /**
   * Configure Solid Refresh for HMR in development mode.
   */
  refresh?: {
    /**
     * Whether to disable Solid Refresh while keeping Rsbuild HMR enabled.
     * @default false
     */
    disabled?: boolean;
    /**
     * Whether to emit per-component metadata so edits only remount components
     * whose code changed.
     * @default true
     */
    granular?: boolean;
  };
  /**
   * Options passed to the selected JSX compiler.
   * `solid.dev` overrides compiler transforms without changing runtime resolution.
   */
  solid?: SolidPresetOptions;
};

export const PLUGIN_SOLID_NAME = 'rsbuild:solid';

export function pluginSolid(options: PluginSolidOptions = {}): RsbuildPlugin {
  const { compiler = 'native', dev, solid, ssr } = options;
  const isDevModeEnabled = (mode: RsbuildMode) => dev ?? mode === 'development';

  return {
    name: PLUGIN_SOLID_NAME,

    setup(api) {
      api.modifyEnvironmentConfig((config) => {
        const conditionNames = config.resolve.conditionNames ?? ['...'];
        const useDevMode = isDevModeEnabled(config.mode);

        // Prefer Solid-specific exports while preserving user conditions or Rspack defaults.
        config.resolve.conditionNames = [
          ...new Set([
            'solid',
            ...(useDevMode ? ['development'] : []),
            ...conditionNames,
          ]),
        ];
      });

      api.modifyBundlerChain(
        (chain, { CHAIN_ID, environment, isProd, target }) => {
          const environmentConfig = environment.config;
          const useDevMode = isDevModeEnabled(environmentConfig.mode);
          const usingHMR =
            options.refresh?.disabled !== true &&
            !isProd &&
            environmentConfig.dev.hmr &&
            target === 'web';

          const defaultPresetOptions: SolidPresetOptions = {
            moduleName: '@solidjs/web',
            builtIns: SOLID_BUILT_INS,
            contextToCustomElements: true,
            wrapConditionals: true,
            generate: 'dom',
            hydratable: false,
            dev: useDevMode,
            ...(ssr
              ? target === 'node'
                ? { generate: 'ssr', hydratable: true }
                : { generate: 'dom', hydratable: true }
              : {}),
          };
          const solidOptions = {
            ...defaultPresetOptions,
            ...solid,
          };

          const jsRule = chain.module.rules.get(CHAIN_ID.RULE.JS);
          const jsMainRule = jsRule.oneOfs.get(CHAIN_ID.ONE_OF.JS_MAIN);
          const solidRules = [
            { rule: jsMainRule },
            {
              rule: chain.module.rules.get(CHAIN_ID.RULE.JS_DATA_URI),
              transformFilename: 'data-uri.jsx',
            },
          ];

          for (const { rule, transformFilename } of solidRules) {
            const solidUse = rule.use('solid');

            // Rspack executes loaders in reverse declaration order. Position the
            // Solid loader so transforms run as: user Babel -> Solid JSX -> SWC.
            if (rule.uses.has(CHAIN_ID.USE.BABEL)) {
              solidUse.before(CHAIN_ID.USE.BABEL);
            } else {
              solidUse.after(CHAIN_ID.USE.SWC);
            }

            solidUse
              .loader(path.join(import.meta.dirname, 'solidLoader.mjs'))
              .options({
                compiler,
                decoratorVersion: environmentConfig.source.decorators.version,
                solid: solidOptions,
                ...(transformFilename ? { transformFilename } : {}),
              });
          }

          if (usingHMR) {
            const refreshRule = chain.module
              .rule('solid-refresh')
              .after(CHAIN_ID.RULE.JS)
              .enforce('pre')
              .test(DEFAULT_SOLID_SCRIPT_REGEX)
              .dependency({ not: 'url' })
              .resourceQuery({ not: /[?&]raw(?:&|=|$)/ })
              .with({ type: { not: 'text' } });

            refreshRule.include.merge(jsRule.include.values());
            refreshRule.exclude.merge(jsRule.exclude.values());

            const refreshUse = refreshRule
              .use('solid-refresh')
              .loader(path.join(import.meta.dirname, 'refreshLoader.mjs'));

            if (typeof options.refresh?.granular === 'boolean') {
              refreshUse.options({
                granular: options.refresh.granular,
              });
            }
          }
        },
      );
    },
  };
}
