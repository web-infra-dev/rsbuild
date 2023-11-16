import type { AsyncSeriesHook } from 'tapable';
import { DoctorManifestWithShardingFiles } from '../manifest';

/**
 * sdk hooks map
 */
export interface Hooks {
  afterSaveManifest: AsyncSeriesHook<
    [
      {
        manifestWithShardingFiles: DoctorManifestWithShardingFiles;
        manifestDiskPath: string;
      },
    ]
  >;
}
