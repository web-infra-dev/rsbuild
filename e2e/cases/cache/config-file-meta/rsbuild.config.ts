import type { RsbuildConfig } from '@rsbuild/core';
import { loadConfig, withConfigMeta } from '@rstackjs/load-config';

export default async () => {
  const { content, filePath, dependencies } = await loadConfig<RsbuildConfig>({
    cwd: import.meta.dirname,
    path: 'app.config.mts',
    fresh: true,
  });

  return withConfigMeta(content, { filePath, dependencies });
};
