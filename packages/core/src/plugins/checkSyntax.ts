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
  builderContext: Context,
  builderConfig: SharedNormalizedConfig,
  builderTarget: RsbuildTarget,
  checkSyntax: CheckSyntaxOptions | true,
) {
  const browserslist =
    (await getBrowserslistWithDefault(
      builderContext.rootPath,
      builderConfig,
      builderTarget,
    )) ?? DEFAULT_BROWSERSLIST[builderTarget];
  if (checkSyntax === true) {
    return browserslist;
  }
  return checkSyntax.targets ?? browserslist;
}
