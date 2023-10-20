import {
  Context,
  RsbuildTarget,
  DEFAULT_BROWSERSLIST,
  getBrowserslistWithDefault,
  DefaultRsbuildPlugin,
  SharedNormalizedConfig,
  CheckSyntaxOptions,
} from '@rsbuild/shared';

export function pluginCheckSyntax(): DefaultRsbuildPlugin {
  return {
    name: 'plugin-check-syntax',

    setup(api) {
      api.modifyBundlerChain(async (chain, { isProd, target }) => {
        const config = api.getNormalizedConfig();
        const { checkSyntax } = config.security;

        if (
          !isProd ||
          ['node', 'web-worker'].includes(target) ||
          !checkSyntax
        ) {
          return;
        }

        const targets = await getCheckTargets(
          api.context,
          config,
          target,
          checkSyntax,
        );
        const { CheckSyntaxPlugin } = await import('@rsbuild/shared');

        chain.plugin(CheckSyntaxPlugin.name).use(CheckSyntaxPlugin, [
          {
            targets,
            rootPath: api.context.rootPath,
            ...(typeof checkSyntax === 'object' ? checkSyntax : {}),
          },
        ]);
      });
    },
  };
}

async function getCheckTargets(
  rsbuildContext: Context,
  rsbuildConfig: SharedNormalizedConfig,
  rsbuildTarget: RsbuildTarget,
  checkSyntax: CheckSyntaxOptions | true,
) {
  const browserslist =
    (await getBrowserslistWithDefault(
      rsbuildContext.rootPath,
      rsbuildConfig,
      rsbuildTarget,
    )) ?? DEFAULT_BROWSERSLIST[rsbuildTarget];
  if (checkSyntax === true) {
    return browserslist;
  }
  return checkSyntax.targets ?? browserslist;
}
