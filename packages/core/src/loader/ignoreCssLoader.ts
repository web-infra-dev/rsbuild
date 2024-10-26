import type { LoaderContext } from '@rspack/core';

export default function (this: LoaderContext<unknown>, source: string): string {
  this?.cacheable(true);

  // if the source code include '___CSS_LOADER_EXPORT___'
  // It is not a CSS Modules file because exportOnlyLocals is enabled,
  // so we don't need to preserve it.
  if (source.includes('___CSS_LOADER_EXPORT___')) {
    return '';
  }

  // Preserve CSS Modules export for SSR.
  return source;
}
