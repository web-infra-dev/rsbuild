import type { RsbuildPlugin } from '@rsbuild/core';
import {
  type NormalizedConfig,
  type RsbuildTarget,
  getBrowserslistWithDefault,
} from '@rsbuild/shared';
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
): RsbuildPlugin {
  return {
    name: 'rsbuild:check-syntax',

    setup(api) {
      api.modifyBundlerChain(async (chain, { isDev, target }) => {
        if (isDev || target !== 'web') {
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
