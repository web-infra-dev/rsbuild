import fs from 'node:fs';
import path from 'node:path';
import { TS_CONFIG_FILE, fse } from '@rsbuild/shared';
import type { RsbuildPlugin } from '@rsbuild/core';
import {
  filterByField,
  getDependentProjects,
  type Project,
  type ExtraMonorepoStrategies,
} from '@rsbuild/monorepo-utils';

export const PLUGIN_SOURCE_BUILD_NAME = 'rsbuild:source-build';

export const getSourceInclude = async (options: {
  projects: Project[];
  sourceField: string;
}) => {
  const { projects, sourceField } = options;

  const includes = [];
  for (const project of projects) {
    includes.push(
      ...project.getSourceEntryPaths({ field: sourceField, exports: true }),
    );
  }

  return includes;
};

export interface PluginSourceBuildOptions {
  /**
   * Used to configure the resolve field of the source code files.
   * @default 'source''
   */
  sourceField?: string;
  /**
   * Whether to read source code or output code first.
   * @default 'source'
   */
  resolvePriority?: 'source' | 'output';
  projectName?: string;
  extraMonorepoStrategies?: ExtraMonorepoStrategies;
}

export function pluginSourceBuild(
  options?: PluginSourceBuildOptions,
): RsbuildPlugin {
  const {
    projectName,
    sourceField = 'source',
    resolvePriority = 'source',
    extraMonorepoStrategies,
  } = options ?? {};

  return {
    name: PLUGIN_SOURCE_BUILD_NAME,

    setup(api) {
      const projectRootPath = api.context.rootPath;

      let projects: Project[] = [];

      api.modifyRsbuildConfig(async (config) => {
        projects = await getDependentProjects(projectName || projectRootPath, {
          cwd: projectRootPath,
          recursive: true,
          filter: filterByField(sourceField, true),
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
        for (const ruleId of [CHAIN_ID.RULE.TS, CHAIN_ID.RULE.JS]) {
          if (chain.module.rules.get(ruleId)) {
            const rule = chain.module.rule(ruleId);

            // https://rspack.dev/config/resolve
            // when source is not exist, other mainFields will effect. // source > Rspack default mainFields.
            rule.resolve.mainFields.merge(
              resolvePriority === 'source'
                ? [sourceField, '...']
                : ['...', sourceField],
            );

            // bundler-chain do not support resolve.conditionNames yet
            rule.resolve.merge({
              // `conditionNames` is not affected by `resolvePriority`.
              // The priority is controlled by the order of fields declared in `exports`.
              conditionNames: ['...', sourceField],
            });
          }
        }
      });

      const getReferences = async (): Promise<string[]> => {
        const refers = projects
          .map((project) => path.join(project.dir, TS_CONFIG_FILE))
          .filter((filePath) => fs.existsSync(filePath));

        // merge with user references
        if (api.context.tsconfigPath) {
          const { default: json5 } = await import('@rsbuild/shared/json5');
          const { references } = json5.parse(
            fse.readFileSync(api.context.tsconfigPath, 'utf-8'),
          );

          return Array.isArray(references)
            ? references
                .map((r) => r.path)
                .filter(Boolean)
                .concat(refers)
            : refers;
        }

        return refers;
      };

      if (api.context.bundlerType === 'rspack') {
        api.modifyRspackConfig(async (config) => {
          if (!api.context.tsconfigPath) {
            return;
          }

          config.resolve ||= {};
          config.resolve.tsConfig = {
            ...config.resolve.tsConfig,
            configFile: api.context.tsconfigPath,
            references: await getReferences(),
          };
        });
      } else {
        api.modifyBundlerChain(async (chain, { CHAIN_ID }) => {
          const { TS_CONFIG_PATHS } = CHAIN_ID.RESOLVE_PLUGIN;

          if (!chain.resolve.plugins.has(TS_CONFIG_PATHS)) {
            return;
          }

          const references = await getReferences();

          // set references config
          // https://github.com/dividab/tsconfig-paths-webpack-plugin#options
          chain.resolve.plugin(TS_CONFIG_PATHS).tap((options) =>
            options.map((option) => ({
              ...option,
              references,
            })),
          );
        });
      }
    },
  };
}
