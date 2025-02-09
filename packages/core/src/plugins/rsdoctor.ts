import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import type { Configuration } from '@rspack/core';
import { color } from '../helpers';
import { logger } from '../logger';
import type { BundlerPluginInstance, RsbuildPlugin } from '../types';

const require = createRequire(import.meta.url);

type RsdoctorExports = {
  RsdoctorRspackPlugin: { new (): BundlerPluginInstance };
  RsdoctorWebpackPlugin: { new (): BundlerPluginInstance };
};

type MaybeRsdoctorPlugin = Configuration['plugins'] & {
  isRsdoctorPlugin?: boolean;
};

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
      const pluginName = isRspack
        ? 'RsdoctorRspackPlugin'
        : 'RsdoctorWebpackPlugin';

      const isRsdoctorPlugin = (plugin: MaybeRsdoctorPlugin) =>
        plugin?.isRsdoctorPlugin === true ||
        plugin?.constructor?.name === pluginName;

      for (const config of bundlerConfigs) {
        // If user has added the Rsdoctor plugin manually, skip the auto-registration.
        const registered = config.plugins?.some((plugin) =>
          isRsdoctorPlugin(plugin as unknown as MaybeRsdoctorPlugin),
        );

        if (registered) {
          return;
        }
      }

      const packageName = isRspack
        ? '@rsdoctor/rspack-plugin'
        : '@rsdoctor/webpack-plugin';
      let packagePath: string;

      try {
        packagePath = require.resolve(packageName, {
          paths: [api.context.rootPath],
        });
      } catch (err) {
        logger.warn(
          `\`process.env.RSDOCTOR\` enabled, please install ${color.bold(color.yellow(packageName))} package.`,
        );
        return;
      }

      let module: RsdoctorExports;
      try {
        const moduleURL =
          process.platform === 'win32'
            ? pathToFileURL(packagePath).href
            : packagePath;
        module = await import(moduleURL);
      } catch (err) {
        logger.error(
          `\`process.env.RSDOCTOR\` enabled, but failed to load ${color.bold(color.yellow(packageName))} module.`,
        );
        return;
      }

      if (!module || !module[pluginName]) {
        return;
      }

      for (const config of bundlerConfigs) {
        config.plugins ||= [];
        config.plugins.push(new module[pluginName]());
      }

      logger.info(`${color.bold(color.yellow(packageName))} enabled.`);
    });
  },
});
