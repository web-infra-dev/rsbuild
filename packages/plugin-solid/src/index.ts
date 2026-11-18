import path from 'node:path';
import type { RsbuildMode, RsbuildPlugin, Rspack } from '@rsbuild/core';
import type { SolidCompiler, SolidPresetOptions } from './types.js';

export type { SolidCompiler, SolidPresetOptions } from './types.js';

export type PluginSolidOptions = {
  /**
   * JSX compiler backend to use.
   * @default 'native'
   */
  compiler?: SolidCompiler;
  /**
   * Additional file extensions to compile as Solid JSX, including the leading dot.
   * `.mtsx` and `.ctsx` are parsed as TypeScript.
   * @default []
   */
  extensions?: string[];
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

const SOLID_RUNTIME_REQUEST =
  /^(?:solid-js|@solidjs\/(?:web|signals))(?:\/[^?#]*)?(?=[?#]|$)/;
const DEFAULT_SCRIPT_REGEX = /(?:\.jsx|\.tsx)$/i;

export const PLUGIN_SOLID_NAME = 'rsbuild:solid';

function applyProductionRuntime(compiler: Rspack.Compiler): void {
  compiler.hooks.normalModuleFactory.tap(PLUGIN_SOLID_NAME, (factory) => {
    // Rspack has expanded '...' to include the mode and target conditions.
    const resolver = factory.getResolver('normal', {
      dependencyType: 'esm',
      conditionNames: compiler.options.resolve.conditionNames?.map(
        (condition) => (condition === 'development' ? 'production' : condition),
      ),
    });

    factory.hooks.resolve.tap(PLUGIN_SOLID_NAME, (data) => {
      const match = SOLID_RUNTIME_REQUEST.exec(data.request);
      if (match) {
        const [specifier] = match;
        const resolved = resolver.resolveSync({}, data.context, specifier);
        if (resolved) {
          data.request = resolved + data.request.slice(specifier.length);
        }
      }
    });
  });
}

export function pluginSolid(options: PluginSolidOptions = {}): RsbuildPlugin {
  const { compiler = 'native', dev, solid, ssr } = options;
  const extensions = options.extensions ?? [];
  const scriptRegex = extensions.length
    ? new RegExp(
        `(?:\\.jsx|\\.tsx|${extensions
          .map((ext) => ext.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
          .join('|')})$`,
        'i',
      )
    : DEFAULT_SCRIPT_REGEX;
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
            dev !== false &&
            options.refresh?.disabled !== true &&
            !isProd &&
            environmentConfig.dev.hmr &&
            target === 'web';

          if (dev === false && environmentConfig.mode === 'development') {
            chain.plugin('solid-production-runtime').use({
              apply: applyProductionRuntime,
            });
          }

          const solidOptions: SolidPresetOptions = {
            generate: ssr && target === 'node' ? 'ssr' : 'dom',
            hydratable: Boolean(ssr),
            dev: useDevMode,
            ...solid,
          };

          // Solid loads hydration modules from runtime URLs. Preserve native
          // import() instead of generating an empty context dependency.
          chain.module
            .rule('solid-runtime')
            .set('descriptionData', { name: /^@solidjs\/web$/ })
            .parser({ importDynamic: false });

          const jsRule = chain.module.rules.get(CHAIN_ID.RULE.JS);
          const jsMainRule = jsRule.oneOfs.get(CHAIN_ID.ONE_OF.JS_MAIN);
          if (extensions.length) {
            const test = jsRule.get('test');
            jsRule.test(test ? { or: [test, scriptRegex] } : scriptRegex);
            jsRule.include.add(scriptRegex);
            chain.resolve.extensions.merge(extensions);
          }
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
                scriptRegex,
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
              .test(scriptRegex)
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
