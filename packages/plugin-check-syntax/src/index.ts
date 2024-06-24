import type { RsbuildPlugin } from '@rsbuild/core';
import type { CheckSyntaxOptions } from './types';

export type PluginCheckSyntaxOptions = CheckSyntaxOptions;

export const PLUGIN_CHECK_SYNTAX_NAME = 'rsbuild:check-syntax';

export function pluginCheckSyntax(
  options: PluginCheckSyntaxOptions = {},
): RsbuildPlugin {
  return {
    name: PLUGIN_CHECK_SYNTAX_NAME,

    setup(api) {
      api.modifyBundlerChain(async (chain, { isDev, target, environment }) => {
        if (isDev || target !== 'web') {
          return;
        }

        const { rootPath } = api.context;

        const targets =
          options.targets ?? api.context.environments[environment].browserslist;

        const { CheckSyntaxPlugin } = await import('./CheckSyntaxPlugin');

        chain.plugin(CheckSyntaxPlugin.name).use(CheckSyntaxPlugin, [
          {
            targets,
            rootPath,
            ...(typeof options === 'object' ? options : {}),
          },
        ]);
      });
    },
  };
}
