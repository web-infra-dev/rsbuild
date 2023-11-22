import { fse } from '@rsbuild/shared';
import type { RsbuildPlugin } from '../types';

const emptyDir = async (dir: string) => {
  if (await fse.pathExists(dir)) {
    await fse.emptyDir(dir);
  }
};

export const pluginCleanOutput = (): RsbuildPlugin => ({
  name: 'rsbuild:clean-output',

  setup(api) {
    const clean = async () => {
      const config = api.getNormalizedConfig();

      if (config.output.cleanDistPath) {
        const { distPath } = api.context;
        await emptyDir(distPath);
      }
    };

    api.onBeforeBuild(clean);
    api.onBeforeStartDevServer(clean);
  },
});
