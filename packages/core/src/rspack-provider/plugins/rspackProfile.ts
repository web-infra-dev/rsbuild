import type { RsbuildPlugin } from '../types';
import path from 'path';
import {
  experimental_registerGlobalTrace as registerGlobalTrace,
  experimental_cleanupGlobalTrace as cleanupGlobalTrace,
} from '@rspack/core';
import inspector from 'inspector';
import { fse } from '@rsbuild/shared';
import { logger } from '@rsbuild/shared';

export const stopProfiler = (
  output: string,
  profileSession?: inspector.Session,
) => {
  if (!profileSession) {
    return;
  }
  profileSession.post('Profiler.stop', (error, param) => {
    if (error) {
      logger.error('Failed to generate JS CPU profile:', error);
      return;
    }
    fse.writeFileSync(output, JSON.stringify(param.profile));
  });
};

// Reference rspack-cli
// https://github.com/modern-js-dev/rspack/blob/509abcfc523bc20125459f5d428dc1645751700c/packages/rspack-cli/src/utils/profile.ts
export const pluginRspackProfile = (): RsbuildPlugin => ({
  name: 'plugin-rspack-profile',

  setup(api) {
    /**
     * RSPACK_PROFILE=ALL
     * RSPACK_PROFILE=TRACE|CPU|LOGGING
     */
    const RSPACK_PROFILE = process.env.RSPACK_PROFILE?.toUpperCase();

    if (!RSPACK_PROFILE) {
      return;
    }

    const timestamp = Date.now();
    const profileDir = path.join(
      api.context.distPath,
      `rspack-profile-${timestamp}`,
    );

    let profileSession: inspector.Session | undefined;

    const enableProfileTrace =
      RSPACK_PROFILE === 'ALL' || RSPACK_PROFILE.includes('TRACE');

    const enableCPUProfile =
      RSPACK_PROFILE === 'ALL' || RSPACK_PROFILE.includes('CPU');

    const enableLogging =
      RSPACK_PROFILE === 'ALL' || RSPACK_PROFILE.includes('LOGGING');

    const traceFilePath = path.join(profileDir, 'trace.json');
    const cpuProfilePath = path.join(profileDir, 'jscpuprofile.json');
    const loggingFilePath = path.join(profileDir, 'logging.json');

    const onStart = () => {
      fse.ensureDirSync(profileDir);

      if (enableProfileTrace) {
        registerGlobalTrace('trace', 'chrome', traceFilePath);
      }

      if (enableCPUProfile) {
        profileSession = new inspector.Session();
        profileSession.connect();
        profileSession.post('Profiler.enable');
        profileSession.post('Profiler.start');
      }
    };

    api.onBeforeBuild(onStart);
    api.onBeforeStartDevServer(onStart);

    api.onAfterBuild(async ({ stats }) => {
      if (enableLogging && stats) {
        const logging = stats.toJson({
          all: false,
          logging: 'verbose',
          loggingTrace: true,
        });
        fse.writeFileSync(loggingFilePath, JSON.stringify(logging));
      }
    });

    api.onExit(() => {
      enableProfileTrace && cleanupGlobalTrace();

      stopProfiler(cpuProfilePath, profileSession);

      logger.info(`Saved Rspack profile file to ${profileDir}`);
    });
  },
});
