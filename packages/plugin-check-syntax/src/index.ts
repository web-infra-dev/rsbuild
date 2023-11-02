import {
  getBrowserslistWithDefault,
  type RsbuildTarget,
  type RsbuildPlugin,
  type NormalizedConfig,
} from '@rsbuild/shared';
import type { RsbuildPluginAPI } from '@rsbuild/core/rspack-provider';
import type { CheckSyntaxOptions } from './types';

export type PluginCheckSyntaxOptions = CheckSyntaxOptions;

async function getTargets(
  rootPath: string,
  rsbuildConfig: NormalizedConfig,
  rsbuildTarget: RsbuildTarget,
  checkSyntax: CheckSyntaxOptions,
) {
  return (
    checkSyntax.targets ??
    (await getBrowserslistWithDefault(rootPath, rsbuildConfig, rsbuildTarget))
  );
}

export function pluginCheckSyntax(
  options: PluginCheckSyntaxOptions = {},
): RsbuildPlugin<RsbuildPluginAPI> {
  return {
    name: 'plugin-check-syntax',

    setup(api) {
      api.modifyBundlerChain(async (chain, { isProd, target }) => {
        if (!isProd || target !== 'web') {
          return;
        }

        const { rootPath } = api.context;
        const rsbuildConfig = api.getNormalizedConfig();

        const targets = await getTargets(
          rootPath,
          rsbuildConfig,
          target,
          options,
        );
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
