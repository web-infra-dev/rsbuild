import { join } from 'path';

import {
  findExists,
  isFileExists,
  TS_CONFIG_FILE,
  mergeRsbuildConfig,
  getDefaultDevConfig,
  getDefaultServerConfig,
  getDefaultHtmlConfig,
  getDefaultToolsConfig,
  getDefaultOutputConfig,
  getDefaultSourceConfig,
  getDefaultSecurityConfig,
  getDefaultPerformanceConfig,
  type RsbuildEntry,
  type RsbuildConfig,
  type NormalizedConfig,
} from '@rsbuild/shared';

const createDefaultConfig = (): RsbuildConfig => ({
  dev: getDefaultDevConfig(),
  server: getDefaultServerConfig(),
  html: getDefaultHtmlConfig(),
  source: getDefaultSourceConfig(),
  output: getDefaultOutputConfig(),
  tools: getDefaultToolsConfig(),
  security: getDefaultSecurityConfig(),
  performance: getDefaultPerformanceConfig(),
});

function getDefaultEntry(root: string): RsbuildEntry {
  const files = [
    // Most projects are using typescript now.
    // So we put `.ts` as the first one to improve performance.
    'ts',
    'js',
    'tsx',
    'jsx',
    '.mjs',
    '.cjs',
  ].map((ext) => join(root, `src/index.${ext}`));

  const entryFile = findExists(files);

  if (entryFile) {
    return {
      index: entryFile,
    };
  }

  return {};
}

export const withDefaultConfig = async (
  rootPath: string,
  config: RsbuildConfig,
) => {
  const merged = mergeRsbuildConfig(createDefaultConfig(), config);

  merged.source ||= {};

  if (!merged.source.entry) {
    merged.source.entry = getDefaultEntry(rootPath);
  }

  if (!merged.source.tsconfigPath) {
    const tsconfigPath = join(rootPath, TS_CONFIG_FILE);

    if (await isFileExists(tsconfigPath)) {
      merged.source.tsconfigPath = tsconfigPath;
    }
  }

  return merged;
};

/** #__PURE__
 * 1. May used by multiple plugins.
 * 2. Object value that should not be empty.
 * 3. Meaningful and can be filled by constant value.
 */
export const normalizeConfig = (config: RsbuildConfig): NormalizedConfig =>
  mergeRsbuildConfig(createDefaultConfig(), config) as NormalizedConfig;
