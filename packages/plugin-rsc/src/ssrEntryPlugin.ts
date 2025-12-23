import path from 'node:path';
import type { Rspack } from '@rsbuild/core';
import { rspack } from '@rsbuild/core';

const { RSC_LAYERS_NAMES } = rspack.experiments;

export class SsrEntryPlugin {
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
      throw new Error(
        `Can't resolve '${this.#ssrEntry}' in '${compiler.context}'`,
      );
    }

    compiler.options.module.rules.push({
      resource: resolvedSSREntry,
      layer: RSC_LAYERS_NAMES.serverSideRendering,
    });

    compiler.options.module.rules.push({
      issuerLayer: RSC_LAYERS_NAMES.reactServerComponents,
      exclude: resolvedSSREntry,
      resolve: {
        conditionNames: ['react-server', '...'],
      },
    });
  }
}
