import type { Rspack } from '@rsbuild/core';

/**
 * this plugin is a quick fix for issue https://github.com/web-infra-dev/rsbuild/issues/2093
 */
export class VueLoader15PitchFixPlugin implements Rspack.RspackPluginInstance {
  readonly name = 'VueLoader15PitchFixPlugin';

  apply(compiler: Rspack.Compiler): void {
    const { NormalModule } = compiler.webpack;
    compiler.hooks.compilation.tap(this.name, (compilation) => {
      const isExpCssOn = compilation.compiler.options?.experiments?.css;
      // the related issue only happens when experiments.css is on
      if (!isExpCssOn) return;

      NormalModule.getCompilationHooks(compilation).loader.tap(
        this.name,
        (loaderContext) => {
          if (
            // the related issue only happens for <style>
            /[?&]type=style/.test(loaderContext.resourceQuery) &&
            // the fix should be applied before `pitch` phase completed.
            // once `pitch` phase completed, vue-loader will remove its pitcher loader.
            /[\\/]vue-loader[\\/]lib[\\/]loaders[\\/]pitcher/.test(
              loaderContext.loaders?.[0]?.path || '',
            )
          ) {
            const seen = new Set<string>();
            const loaders = [];
            // deduplicate loaders
            for (const loader of loaderContext.loaders || []) {
              const identifier =
                typeof loader === 'string'
                  ? loader
                  : loader.path + loader.query;

              if (!seen.has(identifier)) {
                seen.add(identifier);
                loaders.push(loader);
              }
            }

            loaderContext.loaders = loaders;
          }
        },
      );
    });
  }
}
