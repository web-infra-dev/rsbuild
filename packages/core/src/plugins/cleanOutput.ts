import type { DefaultRsbuildPlugin } from '@rsbuild/shared';
import { fs } from '@rsbuild/shared/fs-extra';

const emptyDir = async (dir: string) => {
  if (await fs.pathExists(dir)) {
    await fs.emptyDir(dir);
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
