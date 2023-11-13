import fs from 'fs';
import jiti from 'jiti';
import { join } from 'path';
import { findExists } from '@rsbuild/shared';
import type {
  RsbuildEntry,
  RsbuildPlugin,
  RsbuildConfig as BaseRsbuildConfig,
} from '@rsbuild/shared';

export type RsbuildConfig = BaseRsbuildConfig & {
  source?: {
    entries?: RsbuildEntry;
  };
  plugins?: RsbuildPlugin[];
  /**
   * @private only for testing
   */
  provider?: any;
};

export const defineConfig = (config: RsbuildConfig) => config;

const resolveConfigPath = () => {
  const CONFIG_FILES = [
    'rsbuild.config.ts',
    'rsbuild.config.js',
    'rsbuild.config.mjs',
    'rsbuild.config.cjs',
    'rsbuild.config.mts',
    'rsbuild.config.cts',
  ];

  const root = process.cwd();

  for (const file of CONFIG_FILES) {
    const configFile = join(root, file);

    if (fs.existsSync(configFile)) {
      return configFile;
    }
  }

  return null;
};

export async function loadConfig(): Promise<ReturnType<typeof defineConfig>> {
  const configFile = resolveConfigPath();

  if (configFile) {
    const loadConfig = jiti(__filename, {
      esmResolve: true,
      interopDefault: true,
    });
    return loadConfig(configFile);
  }

  return {};
}

export function getDefaultEntries() {
  const cwd = process.cwd();
  const files = ['ts', 'tsx', 'js', 'jsx'].map((ext) =>
    join(cwd, `src/index.${ext}`),
  );

  const entryFile = findExists(files);

  if (entryFile) {
    return {
      index: entryFile,
    };
  }

  throw new Error(
    'Could not find the entry file, please make sure that `src/index.(js|ts|tsx|jsx)` exists, or customize entry through the `source.entries` configuration.',
  );
}
