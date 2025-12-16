import type { Rspack } from '@rsbuild/core';
import path from 'node:path';

export class SSREntryPlugin {
  #ssrEntry: string;

  constructor(ssrEntry: string) {
    this.#ssrEntry = ssrEntry;
  }

  apply(compiler: Rspack.Compiler): void {
    const normalResolver = compiler.resolverFactory.get('normal');
    const resolvedSSREntry = path.isAbsolute(this.#ssrEntry)
        ? this.#ssrEntry
        : normalResolver.resolveSync({}, compiler.context, this.#ssrEntry);

    if (!resolvedSSREntry) {
      throw new Error(`Can't resolve '${this.#ssrEntry}' in '${compiler.context}'`);
    }

    compiler.options.module.rules.push({
      resource: resolvedSSREntry,
      layer: 'server-side-rendering',
    })
  }
}
