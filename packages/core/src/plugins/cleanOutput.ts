import type { DefaultRsbuildPlugin } from '@rsbuild/shared';

export const pluginCleanOutput = (): DefaultRsbuildPlugin => ({
  name: 'plugin-clean-output',

  setup(api) {
    const clean = async () => {
      const config = api.getNormalizedConfig();

      if (config.output.cleanDistPath) {
        const { emptyDir } = await import('@modern-js/utils');
        const { distPath } = api.context;
        await emptyDir(distPath);
      }
    };

    api.onBeforeBuild(clean);
    api.onBeforeStartDevServer(clean);
  },
});
