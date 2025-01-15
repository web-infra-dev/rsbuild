import { join, sep } from 'node:path';
import { RSBUILD_OUTPUTS_PATH } from '../constants';
import { color, emptyDir } from '../helpers';
import { logger } from '../logger';
import type {
  CleanDistPath,
  CleanDistPathObject,
  EnvironmentContext,
  RsbuildPlugin,
} from '../types';

const addTrailingSep = (dir: string) => (dir.endsWith(sep) ? dir : dir + sep);

const isStrictSubdir = (parent: string, child: string) => {
  const parentDir = addTrailingSep(parent);
  const childDir = addTrailingSep(child);
  return parentDir !== childDir && childDir.startsWith(parentDir);
};

const normalizeCleanDistPath = (
  userOptions: CleanDistPath,
): CleanDistPathObject => {
  const defaultOptions: CleanDistPathObject = {
    enable: 'auto',
  };

  if (typeof userOptions === 'boolean' || userOptions === 'auto') {
    return {
      ...defaultOptions,
      enable: userOptions,
    };
  }

  return {
    ...defaultOptions,
    ...userOptions,
  };
};

type PathInfo = {
  path: string;
  keep?: RegExp[];
};

export const pluginCleanOutput = (): RsbuildPlugin => ({
  name: 'rsbuild:clean-output',

  setup(api) {
    // clean Rsbuild outputs files, such as the inspected config files
    const getRsbuildOutputPath = (): PathInfo | undefined => {
      const { rootPath, distPath } = api.context;
      const config = api.getNormalizedConfig();
      const targetPath = join(distPath, RSBUILD_OUTPUTS_PATH);
      const { enable } = normalizeCleanDistPath(config.output.cleanDistPath);

      if (
        enable === true ||
        (enable === 'auto' && isStrictSubdir(rootPath, targetPath))
      ) {
        return {
          path: targetPath,
        };
      }
      return undefined;
    };

    const getPathInfo = (
      environment: EnvironmentContext,
    ): PathInfo | undefined => {
      const { rootPath } = api.context;
      const { config, distPath } = environment;
      const { enable, keep } = normalizeCleanDistPath(
        config.output.cleanDistPath,
      );

      // only enable cleanDistPath when the dist path is a subdir of root path
      if (enable === 'auto') {
        if (isStrictSubdir(rootPath, distPath)) {
          return {
            path: distPath,
            keep,
          };
        }

        logger.warn(
          'The dist path is not a subdir of root path, Rsbuild will not empty it.',
        );
        logger.warn(
          `Please set ${color.yellow('`output.cleanDistPath`')} config manually.`,
        );
        logger.warn(`Current root path: ${color.dim(rootPath)}`);
        logger.warn(`Current dist path: ${color.dim(distPath)}`);
        return undefined;
      }

      if (enable === true) {
        return {
          path: distPath,
          keep,
        };
      }

      return undefined;
    };

    const cleanAll = async (params: {
      environments: Record<string, EnvironmentContext>;
    }) => {
      // dedupe environments by distPath
      const environments = Object.values(params.environments).reduce<
        EnvironmentContext[]
      >((result, curr) => {
        if (!result.find((item) => item.distPath === curr.distPath)) {
          result.push(curr);
        }
        return result;
      }, []);

      const pathInfos: PathInfo[] = [
        ...environments.map(getPathInfo),
        getRsbuildOutputPath(),
      ].filter((pathInfo): pathInfo is PathInfo => !!pathInfo);

      // Use `for...of` to handle nested directories correctly
      for (const pathInfo of pathInfos) {
        await emptyDir(pathInfo.path, pathInfo.keep);
      }
    };

    api.onBeforeBuild(async ({ isFirstCompile, environments }) => {
      if (isFirstCompile) {
        await cleanAll({ environments });
      }
    });
    api.onBeforeStartDevServer(cleanAll);
  },
});
