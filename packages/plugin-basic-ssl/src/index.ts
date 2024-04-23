import type { RsbuildPlugin } from '@rsbuild/core';

import { resolveHttpsConfig } from './util';

export const PLUGIN_BASIC_SSL_NAME = 'rsbuild:basic-ssl';

export function pluginBasicSsl(): RsbuildPlugin {
  return {
    name: PLUGIN_BASIC_SSL_NAME,
    setup(api) {
      api.modifyRsbuildConfig((config) => {
        if (config.server?.https) {
          config.server.https = resolveHttpsConfig(config.server.https);
        }
      });
    },
  };
}
