import fs from 'node:fs';
import inspector from 'node:inspector';
import path from 'node:path';
import rspack from '@rspack/core';
import { color, isFileExists } from '../helpers';
import { logger } from '../logger';
import type { RsbuildPlugin } from '../types';

const stopProfiler = (output: string, profileSession?: inspector.Session) => {
  if (!profileSession) {
    return;
  }

  profileSession.post('Profiler.stop', (error, param) => {
    if (error) {
      logger.error('Failed to generate JavaScript CPU profile:', error);
      return;
    }
    fs.writeFileSync(output, JSON.stringify(param.profile));
  });
};

// Referenced from Rspack CLI
// https://github.com/web-infra-dev/rspack/blob/v1.3.0/packages/rspack-cli/src/utils/profile.ts
export const pluginRspackProfile = (): RsbuildPlugin => ({
  name: 'rsbuild:rspack-profile',

  async setup(api) {
    if (api.context.bundlerType === 'webpack') {
      return;
    }

    /**
     * RSPACK_PROFILE=ALL
     * RSPACK_PROFILE=TRACE|CPU
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

    const onStart = async () => {
      // Note: Cannot obtain accurate `api.context.distPath` before config initialization
      const profileDir = path.join(api.context.distPath, profileDirName);

      const traceFilePath = path.join(profileDir, 'trace.json');

      if (!(await isFileExists(profileDir))) {
        await fs.promises.mkdir(profileDir, { recursive: true });
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

    api.onExit(() => {
      if (enableProfileTrace) {
        rspack.experiments.globalTrace.cleanup();
      }
      const profileDir = path.join(api.context.distPath, profileDirName);

      const cpuProfilePath = path.join(profileDir, 'jscpuprofile.json');

      stopProfiler(cpuProfilePath, profileSession);

      logger.info(`profile files saved to ${color.cyan(profileDir)}`);
    });
  },
});
