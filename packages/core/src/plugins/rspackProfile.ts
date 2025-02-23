import fs from 'node:fs';
import inspector from 'node:inspector';
import path from 'node:path';
import rspack from '@rspack/core';
import { logger } from '../logger';
import type { RsbuildPlugin } from '../types';

const stopProfiler = (output: string, profileSession?: inspector.Session) => {
  if (!profileSession) {
    return;
  }

  profileSession.post('Profiler.stop', (error, param) => {
    if (error) {
      logger.error('Failed to generate JS CPU profile:', error);
      return;
    }
    fs.writeFileSync(output, JSON.stringify(param.profile));
  });
};

// Reference rspack-cli
// https://github.com/web-infra-dev/rspack/blob/509abcfc523bc20125459f5d428dc1645751700c/packages/rspack-cli/src/utils/profile.ts
export const pluginRspackProfile = (): RsbuildPlugin => ({
  name: 'rsbuild:rspack-profile',

  async setup(api) {
    if (api.context.bundlerType === 'webpack') {
      return;
    }

    /**
     * RSPACK_PROFILE=ALL
     * RSPACK_PROFILE=TRACE|CPU|LOGGING
     */
    const RSPACK_PROFILE = process.env.RSPACK_PROFILE?.toUpperCase();

    if (!RSPACK_PROFILE) {
      return;
    }

    const timestamp = Date.now();
    const profileDirName = `rspack-profile-${timestamp}`;

    let profileSession: inspector.Session | undefined;

    const enableProfileTrace =
      RSPACK_PROFILE === 'ALL' || RSPACK_PROFILE.includes('TRACE');

    const enableCPUProfile =
      RSPACK_PROFILE === 'ALL' || RSPACK_PROFILE.includes('CPU');

    const enableLogging =
      RSPACK_PROFILE === 'ALL' || RSPACK_PROFILE.includes('LOGGING');

    const onStart = () => {
      // can't get precise api.context.distPath before config init
      const profileDir = path.join(api.context.distPath, profileDirName);

      const traceFilePath = path.join(profileDir, 'trace.json');

      if (!fs.existsSync(profileDir)) {
        fs.mkdirSync(profileDir, { recursive: true });
      }

      if (enableProfileTrace) {
        rspack.experiments.globalTrace.register(
          'trace',
          'chrome',
          traceFilePath,
        );
      }

      if (enableCPUProfile) {
        profileSession = new inspector.Session();
        profileSession.connect();
        profileSession.post('Profiler.enable');
        profileSession.post('Profiler.start');
      }
    };

    api.onBeforeBuild(({ isFirstCompile }) => {
      if (isFirstCompile) {
        onStart();
      }
    });
    api.onBeforeStartDevServer(onStart);

    api.onAfterBuild(async ({ stats }) => {
      const loggingFilePath = path.join(
        api.context.distPath,
        profileDirName,
        'logging.json',
      );

      if (enableLogging && stats) {
        const logging = stats.toJson({
          all: false,
          logging: 'verbose',
          loggingTrace: true,
        });
        fs.writeFileSync(loggingFilePath, JSON.stringify(logging));
      }
    });

    api.onExit(() => {
      if (enableProfileTrace) {
        rspack.experiments.globalTrace.cleanup();
      }
      const profileDir = path.join(api.context.distPath, profileDirName);

      const cpuProfilePath = path.join(profileDir, 'jscpuprofile.json');

      stopProfiler(cpuProfilePath, profileSession);

      logger.info(`saved Rspack profile file to ${profileDir}`);
    });
  },
});
