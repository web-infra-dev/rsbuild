import { DoctorRspackPluginOptions } from '@rsbuild/doctor-core/types';
import { RsbuildDoctorRspackPlugin } from '@rsbuild/doctor-rspack-plugin';
import { Linter } from '@rsbuild/doctor-types';
import { File } from '@rsbuild/doctor-utils/build';
import { tmpdir } from 'os';
import path from 'path';

export function createDoctorPlugin<T extends Linter.ExtendRuleData[]>(
  options: DoctorRspackPluginOptions<T>,
) {
  const plugin = new RsbuildDoctorRspackPlugin({
    ...options,
    disableClientServer:
      typeof options.disableClientServer === 'boolean'
        ? options.disableClientServer
        : true,
  });

  const outdir = path.resolve(
    tmpdir(),
    `./${Date.now()}/rsbuild_doctor_rspack_plugin_test`,
  );

  plugin.sdk.hooks.afterSaveManifest.tapPromise('REMOVE_TMP_DIR', async () => {
    plugin.sdk.setOutputDir(outdir);
    try {
      await File.fse.remove(plugin.sdk.outputDir);
    } catch (e) {
      console.error(e);
    }
  });

  return plugin;
}
