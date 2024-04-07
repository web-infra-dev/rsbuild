import type { PluginManager } from './plugin';
import type { RsbuildConfig } from './config';
import type { RsbuildContext } from './context';
import type { RsbuildProvider, ProviderInstance } from './provider';
import type { EntryDescription } from '@rspack/core';

export type RsbuildTarget = 'web' | 'node' | 'web-worker' | 'service-worker';

export type RsbuildEntry = Record<string, string | string[] | EntryDescription>;

export type RsbuildMode = 'development' | 'production';

export type CreateRsbuildOptions = {
  /** The root path of current project. */
  cwd?: string;
  /** Configurations of Rsbuild. */
  rsbuildConfig?: RsbuildConfig;
};

export type RsbuildInstance<
  P extends RsbuildProvider | RsbuildProvider<'webpack'> = RsbuildProvider,
> = {
  context: RsbuildContext;

  addPlugins: PluginManager['addPlugins'];
  removePlugins: PluginManager['removePlugins'];
  isPluginExists: PluginManager['isPluginExists'];

  build: ProviderInstance['build'];
  preview: ProviderInstance['preview'];
  initConfigs: ProviderInstance['initConfigs'];
  inspectConfig: ProviderInstance['inspectConfig'];
  createCompiler: ProviderInstance['createCompiler'];
  createDevServer: ProviderInstance['createDevServer'];
  startDevServer: ProviderInstance['startDevServer'];

  getHTMLPaths: Awaited<ReturnType<P>>['pluginAPI']['getHTMLPaths'];
  getRsbuildConfig: Awaited<ReturnType<P>>['pluginAPI']['getRsbuildConfig'];
  getNormalizedConfig: Awaited<
    ReturnType<P>
  >['pluginAPI']['getNormalizedConfig'];

  onBeforeBuild: Awaited<ReturnType<P>>['pluginAPI']['onBeforeBuild'];
  onBeforeCreateCompiler: Awaited<
    ReturnType<P>
  >['pluginAPI']['onBeforeCreateCompiler'];
  onBeforeStartDevServer: Awaited<
    ReturnType<P>
  >['pluginAPI']['onBeforeStartDevServer'];
  onBeforeStartProdServer: Awaited<
    ReturnType<P>
  >['pluginAPI']['onBeforeStartProdServer'];
  onAfterBuild: Awaited<ReturnType<P>>['pluginAPI']['onAfterBuild'];
  onAfterCreateCompiler: Awaited<
    ReturnType<P>
  >['pluginAPI']['onAfterCreateCompiler'];
  onAfterStartDevServer: Awaited<
    ReturnType<P>
  >['pluginAPI']['onAfterStartDevServer'];
  onAfterStartProdServer: Awaited<
    ReturnType<P>
  >['pluginAPI']['onAfterStartProdServer'];
  onCloseDevServer: Awaited<ReturnType<P>>['pluginAPI']['onCloseDevServer'];
  onDevCompileDone: Awaited<ReturnType<P>>['pluginAPI']['onDevCompileDone'];
  onExit: Awaited<ReturnType<P>>['pluginAPI']['onExit'];
};
