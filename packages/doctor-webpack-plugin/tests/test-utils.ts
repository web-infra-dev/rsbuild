import { DoctorWebpackPluginOptions } from '@rsbuild/doctor-core/types';
import { Linter } from '@rsbuild/doctor-types';
import { File } from '@rsbuild/doctor-utils/build';
import { tmpdir } from 'os';
import path from 'path';
import { RsbuildDoctorWebpackPlugin } from '../src';

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
  plugin.sdk.setOutputDir(outdir);

  plugin.sdk.hooks.afterSaveManifest.tapPromise('REMOVE_TMP_DIR', async () => {
    await File.fse.remove(plugin.sdk.outputDir);
  });

  return plugin;
}
