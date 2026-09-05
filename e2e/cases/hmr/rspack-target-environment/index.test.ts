import { expect, test } from '@e2e/helper';
import type { Rspack } from '@rsbuild/core';
import { findFile } from '@rstackjs/test-utils';

const targetCases = [
  {
    target: 'browserslist:last 2 node versions',
    injectHMRClient: false,
  },
  { target: 'webworker', injectHMRClient: false },
  { target: 'electron-main', injectHMRClient: false },
  { target: 'electron-preload', injectHMRClient: false },
  { target: 'electron-renderer', injectHMRClient: true },
  { target: 'nwjs', injectHMRClient: false },
] satisfies {
  target: NonNullable<Rspack.Configuration['target']>;
  injectHMRClient: boolean;
}[];

for (const { target, injectHMRClient } of targetCases) {
  test(`should ${injectHMRClient ? '' : 'not '}inject HMR client when Rspack target is ${target}`, async ({
    devOnly,
  }) => {
    const rsbuild = await devOnly({
      config: {
        tools: {
          htmlPlugin: false,
          rspack: (config) => {
            config.target = target;
            return config;
          },
        },
      },
    });

    const files = rsbuild.getDistFiles();
    const indexJs = findFile(files, 'index.js');

    expect(files[indexJs].includes('hmr.js')).toBe(injectHMRClient);
  });
}
