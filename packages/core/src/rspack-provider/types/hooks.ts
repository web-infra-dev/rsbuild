import type { ModifyRspackConfigUtils } from '@rsbuild/shared';
import type { RspackConfig } from '@rsbuild/shared';

export type ModifyRspackConfigFn = (
  config: RspackConfig,
  utils: ModifyRspackConfigUtils,
) => Promise<RspackConfig | void> | RspackConfig | void;
