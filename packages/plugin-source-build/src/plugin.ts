import fs from 'node:fs';
import path from 'node:path';
import type { RsbuildPlugin } from '@rsbuild/core';
import type { Project } from './project';
import {
  type ExtraMonorepoStrategies,
  filterByField,
  getDependentProjects,
} from './project-utils';
import type { TsConfig } from './types';

export const PLUGIN_SOURCE_BUILD_NAME = 'rsbuild:source-build';

export const getSourceInclude = async (options: {
  projects: Project[];
  sourceField: string;
}): Promise<string[]> => {
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

      let projects: Project[] | undefined;

      api.modifyEnvironmentConfig(async (config) => {
        projects =
          projects ||
          (await getDependentProjects(projectName || projectRootPath, {
            cwd: projectRootPath,
            recursive: true,
            filter: filterByField(sourceField, true),
            extraMonorepoStrategies,
          }));

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

            // `conditionNames` is not affected by `resolvePriority`.
            // The priority is controlled by the order of fields declared in `exports`.
            rule.resolve.conditionNames.add('...').add(sourceField);
          }
        }
      });

      const getReferences = async (
        tsconfigPath: string,
        rspackReferences?: string[] | 'auto',
      ): Promise<string[]> => {
        const { default: json5 } = await import('json5');

        const references = new Set<string>();

        for (const project of projects || []) {
          const filePath = path.join(project.dir, 'tsconfig.json');
          if (fs.existsSync(filePath)) {
            references.add(filePath);
          }
        }

        // Add references in the current project's tsconfig.json
        const tsconfig = json5.parse<TsConfig>(
          fs.readFileSync(tsconfigPath, 'utf-8'),
        );

        const userReferences = [
          ...(Array.isArray(rspackReferences) ? rspackReferences : []),
          ...(tsconfig.references
            ? tsconfig.references.map((item) => item.path).filter(Boolean)
            : []),
        ];

        if (userReferences.length) {
          const baseDir = path.dirname(tsconfigPath);
          for (const item of userReferences) {
            if (!item) {
              continue;
            }

            const absolutePath = path.isAbsolute(item)
              ? item
              : path.join(baseDir, item);

            references.add(absolutePath);
          }
        }

        // avoid self reference, it will break the resolver
        references.delete(tsconfigPath);

        return Array.from(references);
      };

      if (api.context.bundlerType === 'rspack') {
        api.modifyRspackConfig(async (config, { environment }) => {
          const { tsconfigPath } = environment;
          if (!tsconfigPath) {
            return;
          }

          config.resolve ||= {};

          const { tsConfig = { configFile: tsconfigPath } } = config.resolve;

          const configObject =
            typeof tsConfig === 'string' ? { configFile: tsConfig } : tsConfig;

          const references = await getReferences(
            tsconfigPath,
            configObject.references,
          );

          config.resolve.tsConfig = {
            configFile: configObject?.configFile || tsconfigPath,
            references: references,
          };
        });
      } else {
        api.modifyBundlerChain(async (chain, { CHAIN_ID, environment }) => {
          const { TS_CONFIG_PATHS } = CHAIN_ID.RESOLVE_PLUGIN;
          const { tsconfigPath } = environment;

          if (!chain.resolve.plugins.has(TS_CONFIG_PATHS) || !tsconfigPath) {
            return;
          }

          const references = await getReferences(tsconfigPath);

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
