import { Manifest, Plugin } from '@rsbuild/doctor-types';
import { Utils as BuildUtils } from '@/build-utils/build';
import { interceptPluginHook } from '../utils';
import { InternalBasePlugin } from './base';

export class InternalPluginsPlugin<
  T extends Plugin.BaseCompiler,
> extends InternalBasePlugin<T> {
  public readonly name = 'plugins';

  public apply(compiler: T) {
    compiler.hooks.afterPlugins.tap(this.tapPostOptions, this.afterPlugins);
    compiler.hooks.compilation.tap(this.tapPostOptions, this.compilation);
  }

  public afterPlugins = (compiler: Plugin.BaseCompiler) => {
    if (compiler.isChild()) return;

    // intercept compiler hooks
    BuildUtils.interceptCompilerHooks(compiler, (name, hook) =>
      interceptPluginHook(this.sdk, name, hook),
    );

    // add plugins page to client
    this.sdk.addClientRoutes([
      Manifest.DoctorManifestClientRoutes.WebpackPlugins,
    ]);
  };

  public compilation = (compilation: Plugin.BaseCompilation): void => {
    if (compilation.compiler.isChild()) return;

    // intercept compilation hooks
    BuildUtils.interceptCompilationHooks(compilation, (name, hook) =>
      interceptPluginHook(this.sdk, name, hook),
    );
  };
}
