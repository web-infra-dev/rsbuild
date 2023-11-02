import { ModifyChainUtils, NormalizedConfig } from '../types';

export function isUsingHMR(
  config: NormalizedConfig,
  { isProd, target }: Pick<ModifyChainUtils, 'isProd' | 'target'>,
) {
  return (
    !isProd &&
    target !== 'node' &&
    target !== 'web-worker' &&
    target !== 'service-worker' &&
    config.dev.hmr
  );
}
