import type { WebpackChain, NormalizedConfig, BundlerChain } from './types';
import { createVirtualModule } from './utils';

/** Add core-js-entry to every entry. */
export function addCoreJsEntry({
  chain,
  config,
  isServer,
  isServiceWorker,
}: {
  chain: BundlerChain | WebpackChain;
  config: NormalizedConfig;
  isServer: boolean;
  isServiceWorker: boolean;
}) {
  const isEnable =
    config.output.polyfill === 'entry' && !isServer && !isServiceWorker;

  if (isEnable) {
    const entryPoints = Object.keys(chain.entryPoints.entries() || {});
    const coreJsEntry = createVirtualModule('import "core-js";');

    for (const name of entryPoints) {
      chain.entry(name).prepend(coreJsEntry);
    }
  }
}
