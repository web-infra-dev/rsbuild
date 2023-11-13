import type { DefaultRsbuildPlugin } from '@rsbuild/shared';
import { fse } from '@rsbuild/shared';

const emptyDir = async (dir: string) => {
  if (await fse.pathExists(dir)) {
    await fse.emptyDir(dir);
  }
};

export const pluginCleanOutput = (): DefaultRsbuildPlugin => ({
  name: 'plugin-clean-output',

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
