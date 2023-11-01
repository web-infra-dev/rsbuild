import path from 'path';
import { fs } from '@rsbuild/shared/fs-extra';
import { TS_CONFIG_FILE } from '@rsbuild/shared';
import type { RsbuildPlugin, RsbuildPluginAPI } from '@rsbuild/core';
import type { RsbuildPluginAPI as RsbuildWebpackPluginAPI } from '@rsbuild/webpack';
import {
  filterByField,
  getDependentProjects,
  type Project,
  type ExtraMonorepoStrategies,
} from '@rsbuild/monorepo-utils';

export const pluginName = 'plugin-source-build';

export const getSourceInclude = async (options: {
  projects: Project[];
  sourceField: string;
}) => {
  const { projects, sourceField } = options;

  const includes = [];
  for (const project of projects) {
    includes.push(...project.getSourceEntryPaths({ field: sourceField }));
  }

  return includes;
};

export interface PluginSourceBuildOptions {
  projectName?: string;
  sourceField?: string;
  extraMonorepoStrategies?: ExtraMonorepoStrategies;
}

export function pluginSourceBuild(
  options?: PluginSourceBuildOptions,
): RsbuildPlugin<RsbuildPluginAPI> {
  const {
    projectName,
    sourceField = 'source',
    extraMonorepoStrategies,
  } = options ?? {};

  return {
    name: pluginName,

    async setup(api) {
      const projectRootPath = api.context.rootPath;

      // TODO: when rspack support tsconfig paths functionality, this comment will remove
      // if (api.context.bundlerType === 'rspack') {
      //   (api as RspackBuilderPluginAPI).modifyRspackConfig(async config => {
      //     // when support chain.resolve.conditionNames API, remove this logic
      //     setConfig(config, 'resolve.conditionNames', [
      //       '...', // Special syntax: retain the original value
      //       sourceField,
      //       ...(config.resolve?.conditionNames ?? []),
      //     ]);
      //   });
      // }

      let projects: Project[] = [];

      api.modifyRsbuildConfig(async (config) => {
        projects = await getDependentProjects(projectName || projectRootPath, {
          cwd: projectRootPath,
          recursive: true,
          filter: filterByField(sourceField),
          extraMonorepoStrategies,
        });

        const includes = await getSourceInclude({
          projects,
          sourceField,
        });

        config.source = config.source ?? {};
        config.source.include = [...(config.source.include ?? []), ...includes];
      });

      if (api.context.bundlerType === 'webpack') {
        (api as unknown as RsbuildWebpackPluginAPI).modifyWebpackChain(
          (chain, { CHAIN_ID }) => {
            const {
              tools: { tsLoader },
            } = (
              api as unknown as RsbuildWebpackPluginAPI
            ).getNormalizedConfig();

            const useTsLoader = Boolean(tsLoader);
            // webpack.js.org/configuration/module/#ruleresolve
            chain.module
              .rule(useTsLoader ? CHAIN_ID.RULE.TS : CHAIN_ID.RULE.JS)
              // source > webpack default mainFiedls.
              // when source is not exist, other mainFields will effect.
              .resolve.mainFields.merge([sourceField, '...']);

            // webpack chain not support resolve.conditionNames
            chain.module
              .rule(useTsLoader ? CHAIN_ID.RULE.TS : CHAIN_ID.RULE.JS)
              .resolve.merge({
                conditionNames: ['...', sourceField],
              });

            const { TS_CONFIG_PATHS } = CHAIN_ID.RESOLVE_PLUGIN;

            // set references config
            // https://github.com/dividab/tsconfig-paths-webpack-plugin#options
            if (chain.resolve.plugins.has(TS_CONFIG_PATHS)) {
              chain.resolve.plugin(TS_CONFIG_PATHS).tap((options) => {
                const references = projects
                  .map((project) => path.join(project.dir, TS_CONFIG_FILE))
                  .filter((filePath) => fs.existsSync(filePath));

                return options.map((option) => ({
                  ...option,
                  references,
                }));
              });
            }
          },
        );
      }
    },
  };
}
