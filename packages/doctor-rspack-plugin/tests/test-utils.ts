import { DoctorRspackPluginOptions } from '@rsbuild/doctor-core/types';
import { Linter } from '@rsbuild/doctor-types';
import { File } from '@rsbuild/doctor-utils/build';
import { tmpdir } from 'os';
import path from 'path';
import { RsbuildDoctorRspackPlugin } from '../src';

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
  plugin.sdk.setOutputDir(outdir);

  plugin.sdk.hooks.afterSaveManifest.tapPromise('REMOVE_TMP_DIR', async () => {
    await File.fse.remove(plugin.sdk.outputDir);
  });

  return plugin;
}
