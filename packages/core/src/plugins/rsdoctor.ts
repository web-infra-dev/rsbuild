import { color, logger, type BundlerPluginInstance } from '@rsbuild/shared';
import type { RsbuildPlugin } from '../types';

export function pluginRsdoctor(): RsbuildPlugin {
  return {
    name: 'rsbuild:rsdoctor',

    setup(api) {
      api.onBeforeCreateCompiler(async ({ bundlerConfigs }) => {
        if (process.env.RSDOCTOR !== 'true') {
          return;
        }

        const isRspack = api.context.bundlerType === 'rspack';
        const packageName = isRspack
          ? '@rsdoctor/rspack-plugin'
          : '@rsdoctor/webpack-plugin';

        let module: {
          RsdoctorRspackPlugin: { new (): BundlerPluginInstance };
          RsdoctorWebpackPlugin: { new (): BundlerPluginInstance };
        };

        try {
          const path = require.resolve(packageName, {
            paths: [api.context.rootPath],
          });
          module = await import(path);
        } catch (err) {
          logger.warn(
            `\`process.env.RSDOCTOR\` enabled, please install ${color.bold(color.yellow(packageName))} package.`,
          );
          return;
        }

        const pluginName = isRspack
          ? 'RsdoctorRspackPlugin'
          : 'RsdoctorWebpackPlugin';

        if (!module || !module[pluginName]) {
          return;
        }

        let isAutoRegister = false;

        bundlerConfigs.forEach((config) => {
          const registered = config.plugins?.some(
            (plugin) => plugin?.constructor?.name === pluginName,
          );

          if (registered) {
            return;
          }

          config.plugins ||= [];
          config.plugins.push(new module[pluginName]());
          isAutoRegister = true;
        });

        if (isAutoRegister) {
          logger.info(`${color.bold(color.yellow(packageName))} enabled.`);
        }
      });
    },
  };
}
