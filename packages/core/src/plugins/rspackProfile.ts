import fs from 'node:fs';
import path from 'node:path';
import rspack from '@rspack/core';
import { color, isFileExists } from '../helpers';
import { logger } from '../logger';
import type { RsbuildPlugin } from '../types';

// Referenced from Rspack CLI
// https://github.com/web-infra-dev/rspack/blob/v1.3.9/packages/rspack-cli/src/utils/profile.ts
export const pluginRspackProfile = (): RsbuildPlugin => ({
  name: 'rsbuild:rspack-profile',

  async setup(api) {
    if (api.context.bundlerType === 'webpack') {
      return;
    }

    /**
     * RSPACK_PROFILE=ALL
     * RSPACK_PROFILE=TRACE
     */
    const RSPACK_PROFILE = process.env.RSPACK_PROFILE?.toUpperCase();

    if (!RSPACK_PROFILE) {
      return;
    }

    const timestamp = Date.now();
    const profileDirName = `rspack-profile-${timestamp}`;

    const enableProfileTrace =
      RSPACK_PROFILE === 'ALL' || RSPACK_PROFILE.includes('TRACE');

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
      logger.info(`profile file saved to ${color.cyan(profileDir)}`);
    });
  },
});
