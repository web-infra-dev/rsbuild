import { join, sep } from 'node:path';
import color from 'picocolors';
import { RSBUILD_OUTPUTS_PATH } from '../constants';
import { emptyDir } from '../helpers';
import { logger } from '../logger';
import type { EnvironmentContext, RsbuildPlugin } from '../types';

const addTrailingSep = (dir: string) => (dir.endsWith(sep) ? dir : dir + sep);

const isStrictSubdir = (parent: string, child: string) => {
  const parentDir = addTrailingSep(parent);
  const childDir = addTrailingSep(child);
  return parentDir !== childDir && childDir.startsWith(parentDir);
};

export const dedupeCleanPaths = (paths: string[]): string[] => {
  return paths
    .sort((p1, p2) => (p2.length > p1.length ? -1 : 1))
    .reduce<string[]>((prev, curr) => {
      const isSub = prev.find((p) => curr.startsWith(p) || curr === p);
      if (isSub) {
        return prev;
      }

      return prev.concat(curr);
    }, []);
};

export const pluginCleanOutput = (): RsbuildPlugin => ({
  name: 'rsbuild:clean-output',

  setup(api) {
    // should clean rsbuild outputs, such as inspect files
    const getRsbuildCleanPath = () => {
      const { rootPath, distPath } = api.context;
      const config = api.getNormalizedConfig();
      const cleanPath = join(distPath, RSBUILD_OUTPUTS_PATH);

      const { cleanDistPath } = config.output;

      if (cleanDistPath && isStrictSubdir(rootPath, cleanPath)) {
        return cleanPath;
      }
      return undefined;
    };

    const getCleanPath = (environment: EnvironmentContext) => {
      const { rootPath } = api.context;
      const { config, distPath } = environment;

      let { cleanDistPath } = config.output;

      // only enable cleanDistPath when the dist path is a subdir of root path
      if (cleanDistPath === undefined) {
        cleanDistPath = isStrictSubdir(rootPath, distPath);

        if (!cleanDistPath) {
          logger.warn(
            'The dist path is not a subdir of root path, Rsbuild will not empty it.',
          );
          logger.warn(
            `Please set ${color.yellow('`output.cleanDistPath`')} config manually.`,
          );
          logger.warn(`Current root path: ${color.dim(rootPath)}`);
          logger.warn(`Current dist path: ${color.dim(distPath)}`);
        }
      }

      if (cleanDistPath) {
        return distPath;
      }
      return undefined;
    };

    const cleanAll = async (params: {
      environments: Record<string, EnvironmentContext>;
    }) => {
      const environments = Object.values(params.environments).reduce<
        Array<EnvironmentContext>
      >((total, curr) => {
        if (!total.find((t) => t.distPath === curr.distPath)) {
          total.push(curr);
        }
        return total;
      }, []);

      const cleanPaths = environments
        .map((e) => getCleanPath(e))
        .concat(getRsbuildCleanPath())
        .filter((p): p is string => !!p);

      await Promise.all(dedupeCleanPaths(cleanPaths).map((p) => emptyDir(p)));
    };

    api.onBeforeBuild(async ({ isFirstCompile, environments }) => {
      if (isFirstCompile) {
        await cleanAll({ environments });
      }
    });
    api.onBeforeStartDevServer(cleanAll);
  },
});
