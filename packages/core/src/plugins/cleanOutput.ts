import { sep } from 'node:path';
import { fse, color, logger } from '@rsbuild/shared';
import type { RsbuildPlugin } from '../types';

const emptyDir = async (dir: string) => {
  if (await fse.pathExists(dir)) {
    await fse.emptyDir(dir);
  }
};

const addTrailingSep = (dir: string) => (dir.endsWith(sep) ? dir : dir + sep);

const isStrictSubdir = (parent: string, child: string) => {
  const parentDir = addTrailingSep(parent);
  const childDir = addTrailingSep(child);
  return parentDir !== childDir && childDir.startsWith(parentDir);
};

export const pluginCleanOutput = (): RsbuildPlugin => ({
  name: 'rsbuild:clean-output',

  setup(api) {
    const clean = async () => {
      const { distPath, rootPath } = api.context;
      const config = api.getNormalizedConfig();

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

    api.onBeforeBuild(clean);
    api.onBeforeStartDevServer(clean);
  },
});
