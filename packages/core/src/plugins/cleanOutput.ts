import { sep } from 'node:path';
import type { EnvironmentContext } from '@rsbuild/shared';
import color from 'picocolors';
import { emptyDir } from '../helpers';
import { logger } from '../logger';
import type { RsbuildPlugin } from '../types';

const addTrailingSep = (dir: string) => (dir.endsWith(sep) ? dir : dir + sep);

const isStrictSubdir = (parent: string, child: string) => {
  const parentDir = addTrailingSep(parent);
  const childDir = addTrailingSep(child);
  return parentDir !== childDir && childDir.startsWith(parentDir);
};

export const pluginCleanOutput = (): RsbuildPlugin => ({
  name: 'rsbuild:clean-output',

  setup(api) {
    const clean = async (environment: EnvironmentContext) => {
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
        await emptyDir(distPath);
      }
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

      await Promise.all(environments.map((e) => clean(e)));
    };

    api.onBeforeBuild(cleanAll);
    api.onBeforeStartDevServer(cleanAll);
  },
});
