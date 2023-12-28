import fs from 'fs';
import path from 'path';
import { setConfig, TS_CONFIG_FILE } from '@rsbuild/shared';
import type { RsbuildPlugin } from '@rsbuild/core';
import {
  filterByField,
  getDependentProjects,
  type Project,
  type ExtraMonorepoStrategies,
} from '@rsbuild/monorepo-utils';

export const pluginName = 'rsbuild:source-build';

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
): RsbuildPlugin {
  const {
    projectName,
    sourceField = 'source',
    extraMonorepoStrategies,
  } = options ?? {};

  return {
    name: pluginName,

    pre: [
      'rsbuild:babel',
      'uni-builder:babel',
      'uni-builder:ts-loader',
      'rsbuild-webpack:swc',
    ],

    setup(api) {
      const projectRootPath = api.context.rootPath;

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

      api.modifyBundlerChain((chain, { CHAIN_ID }) => {
        [CHAIN_ID.RULE.TS, CHAIN_ID.RULE.JS].forEach((ruleId) => {
          if (chain.module.rules.get(ruleId)) {
            const rule = chain.module.rule(ruleId);

            // https://rspack.dev/config/resolve
            // when source is not exist, other mainFields will effect. // source > webpack default mainFields.
            rule.resolve.mainFields.merge([sourceField, '...']);

            // bundler-chain do not support resolve.conditionNames
            rule.resolve.merge({
              conditionNames: ['...', sourceField],
            });
          }
        });
      });

      const getReferences = () =>
        projects
          .map((project) => path.join(project.dir, TS_CONFIG_FILE))
          .filter((filePath) => fs.existsSync(filePath));

      if (api.context.bundlerType === 'rspack') {
        api.modifyRspackConfig((config) => {
          setConfig(config, 'resolve.tsConfig.references', getReferences());
        });
      } else {
        api.modifyBundlerChain((chain, { CHAIN_ID }) => {
          const { TS_CONFIG_PATHS } = CHAIN_ID.RESOLVE_PLUGIN;

          if (!chain.resolve.plugins.has(TS_CONFIG_PATHS)) {
            return;
          }

          // set references config
          // https://github.com/dividab/tsconfig-paths-webpack-plugin#options
          chain.resolve.plugin(TS_CONFIG_PATHS).tap((options) =>
            options.map((option) => ({
              ...option,
              references: getReferences(),
            })),
          );
        });
      }
    },
  };
}
