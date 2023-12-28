import type { Compiler, Compilation } from '@rspack/core';

export class RemoveCssSourcemapPlugin {
  name: string;

  constructor() {
    this.name = 'RemoveCssSourcemapPlugin';
  }

  apply(compiler: Compiler) {
    compiler.hooks.compilation.tap(this.name, (compilation: Compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: this.name,
          stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
        },
        () => {
          Object.keys(compilation.assets).forEach((name) => {
            if (name.endsWith('.css.map')) {
              compilation.deleteAsset(name);
            }
          });
        },
      );
    });
  }
}
