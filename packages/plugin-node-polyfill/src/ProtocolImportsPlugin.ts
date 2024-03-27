import type { Rspack } from '@rsbuild/core';

export class ProtocolImportsPlugin {
  apply(compiler: Rspack.Compiler) {
    compiler.hooks.normalModuleFactory.tap(
      'NormalModuleReplacementPlugin',
      (nmf) => {
        nmf.hooks.beforeResolve.tap(
          'NormalModuleReplacementPlugin',
          (resource) => {
            // Remove the `node:` prefix
            // see: https://github.com/webpack/webpack/issues/14166
            if (/^node:/.test(resource.request)) {
              resource.request = resource.request.replace(/^node:/, '');
            }
          },
        );
      },
    );
  }
}
