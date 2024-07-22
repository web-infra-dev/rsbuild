import type { Configuration } from '@rspack/core';
import color from 'picocolors';
import { logger } from '../logger';
import type { BundlerPluginInstance, RsbuildPlugin } from '../types';

type RsdoctorExports = {
  RsdoctorRspackPlugin: { new (): BundlerPluginInstance };
  RsdoctorWebpackPlugin: { new (): BundlerPluginInstance };
};

type MaybeRsdoctorPlugin = Configuration['plugins'] & { isRsdoctorPlugin?: boolean };

export const pluginRsdoctor = (): RsbuildPlugin => ({
  name: 'rsbuild:rsdoctor',

  setup(api) {
    api.onBeforeCreateCompiler(async ({ bundlerConfigs }) => {
      // If Rsdoctor isn't enabled, skip this plugin.
      if (process.env.RSDOCTOR !== 'true') {
        return;
      }

      // Add Rsdoctor plugin to start analysis.
      const isRspack = api.context.bundlerType === 'rspack';
      const packageName = isRspack
        ? '@rsdoctor/rspack-plugin'
        : '@rsdoctor/webpack-plugin';

      let module: RsdoctorExports;

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

      const isRsdoctorPlugin = (plugin: MaybeRsdoctorPlugin) =>  plugin?.isRsdoctorPlugin === true || plugin?.constructor?.name === pluginName;

      for (const config of bundlerConfigs) {
        // If user has added the Rsdoctor plugin to the config file, it will return.
        const registered = config.plugins?.some(          
          (plugin) => isRsdoctorPlugin(plugin as unknown as MaybeRsdoctorPlugin),
        );

        if (registered) {
          return;
        }

        config.plugins ||= [];
        config.plugins.push(new module[pluginName]());
        isAutoRegister = true;
      }

      if (isAutoRegister) {
        logger.info(`${color.bold(color.yellow(packageName))} enabled.`);
      }
    });
  },
});
