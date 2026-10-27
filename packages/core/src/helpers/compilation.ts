import type { Compilation } from '@rspack/core';

export function getAssetNames(compilation: Compilation): string[] {
  // `compilation.assets` is a Proxy whose `ownKeys` trap calls this internal
  // method. Calling it directly skips Proxy key validation and the per-asset
  // descriptor lookups performed by `Object.keys`, without reading Sources.
  return compilation.__internal__getAssetFilenames();
}
