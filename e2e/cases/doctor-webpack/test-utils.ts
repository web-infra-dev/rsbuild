import { DoctorWebpackPluginOptions } from '@rsbuild/doctor-core/types';
import { RsbuildDoctorWebpackPlugin } from '@rsbuild/doctor-webpack-plugin';
import { Linter } from '@rsbuild/doctor-types';
import { File } from '@rsbuild/doctor-utils/build';
import { tmpdir } from 'os';
import path from 'path';

export function createRsbuildDoctorPlugin<T extends Linter.ExtendRuleData[]>(
  options: DoctorWebpackPluginOptions<T> = {},
) {
  const plugin = new RsbuildDoctorWebpackPlugin({
    ...options,
    disableClientServer:
      typeof options.disableClientServer === 'boolean'
        ? options.disableClientServer
        : true,
  });

  const outdir = path.resolve(
    tmpdir(),
    `./${Date.now()}/web_doctor_webpack_plugin_test`,
  );

  plugin.sdk.hooks.afterSaveManifest.tapPromise(
    { name: 'REMOVE_TMP_DIR', stage: -9999 },
    async () => {
      plugin.sdk.setOutputDir(outdir);
      try {
        await File.fse.remove(plugin.sdk.outputDir);
      } catch (e) {
        console.error(e);
      }
    },
  );

  return plugin;
}
