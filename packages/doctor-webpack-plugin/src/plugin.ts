import {
  Chunks as ChunksBuildUtils,
  ModuleGraph as ModuleGraphBuildUtils,
  Types,
} from '@rsbuild/doctor-core/build-utils';
import { Chunks as ChunkUtils } from '@rsbuild/doctor-core/common-utils';
import {
  InternalErrorReporterPlugin,
  InternalLoaderPlugin,
  InternalPluginsPlugin,
  InternalProgressPlugin,
  InternalSummaryPlugin,
  makeRulesSerializable,
  normalizeUserConfig,
  setSDK,
} from '@rsbuild/doctor-core/plugins';
import type {
  DoctorPluginInstance,
  DoctorPluginOptionsNormalized,
  DoctorWebpackPluginOptions,
} from '@rsbuild/doctor-core/types';
import { ChunkGraph, ModuleGraph } from '@rsbuild/doctor-sdk/graph';
import { DoctorWebpackSDK } from '@rsbuild/doctor-sdk/sdk';
import { Constants, Linter, Plugin } from '@rsbuild/doctor-types';
import { Process } from '@rsbuild/doctor-utils';
import { debug } from '@rsbuild/doctor-utils/logger';
import type { Node } from '@rsbuild/doctor-utils/ruleUtils';
import fse from 'fs-extra';
import { cloneDeep } from 'lodash';
import path from 'path';
import {
  Compiler,
  Configuration,
  ParserState,
  RuleSetRule,
  StatsCompilation,
} from 'webpack';
import {
  internalPluginTapPostOptions,
  internalPluginTapPreOptions,
  pluginTapName,
  pluginTapPostOptions,
  pluginTapPreOptions,
} from './constants';
import { InternalBundlePlugin } from './plugins/bundle';
import { InternalResolverPlugin } from './plugins/resolver';
import { InternalRulesPlugin } from './plugins/rules';

export class RsbuildDoctorWebpackPlugin<Rules extends Linter.ExtendRuleData[]>
  implements DoctorPluginInstance<Compiler, Rules>
{
  public readonly name = pluginTapName;

  public readonly options: DoctorPluginOptionsNormalized<Rules>;

  public readonly sdk: DoctorWebpackSDK;

  public modulesGraph: ModuleGraph;

  private outsideInstance = false;

  public _bootstrapTask!: Promise<unknown>;

  protected browserIsOpened = false;

  public chunkGraph: ChunkGraph;

  constructor(options?: DoctorWebpackPluginOptions<Rules>) {
    this.options = normalizeUserConfig<Rules>(options);
    this.sdk =
      this.options.sdkInstance ??
      new DoctorWebpackSDK({
        name: pluginTapName,
        root: process.cwd(),
        type: this.options.reportCodeType,
        config: { disableTOSUpload: this.options.disableTOSUpload },
      });
    this.outsideInstance = Boolean(this.options.sdkInstance);
    this.modulesGraph = new ModuleGraph();
    this.chunkGraph = new ChunkGraph();
  }

  // avoid hint error from ts type validation
  apply(compiler: unknown): unknown;

  apply(compiler: Compiler) {
    // bootstrap sdk in apply()
    // avoid to has different sdk instance in one plugin, because of webpack-chain toConfig() will new every webpack plugins.
    if (!this._bootstrapTask) {
      this._bootstrapTask = this.sdk.bootstrap();
    }

    // External instances do not need to be injected into the global.
    if (!this.outsideInstance) {
      setSDK(this.sdk);
    }

    new InternalSummaryPlugin<Compiler>(this).apply(compiler);

    if (this.options.features.loader) {
      new InternalLoaderPlugin<Compiler>(this).apply(compiler);
    }

    if (this.options.features.resolver) {
      new InternalResolverPlugin(this).apply(compiler);
    }

    if (this.options.features.plugins) {
      new InternalPluginsPlugin<Compiler>(this).apply(compiler);
    }

    if (this.options.features.bundle) {
      new InternalBundlePlugin<Compiler>(this).apply(compiler);
    }

    // InternalErrorReporterPlugin must called before InternalRulesPlugin, to avoid treat Doctor's lint warnings/errors as Webpack's warnings/errors.
    new InternalErrorReporterPlugin(this).apply(compiler);
    // InternalRulesPlugin will add lint errors and warnings to Webpack compilation as Webpack's warnings/errors.
    new InternalRulesPlugin(this).apply(compiler);

    new InternalProgressPlugin<Compiler>(this).apply(compiler);

    compiler.hooks.afterPlugins.tap(pluginTapPostOptions, this.afterPlugins);
    // watchRun will executed in watch mode.
    compiler.hooks.watchRun.tapPromise(pluginTapPostOptions, this.beforeRun);
    // beforeRun will not executed in watch mode.
    compiler.hooks.beforeRun.tapPromise(pluginTapPostOptions, this.beforeRun);
    compiler.hooks.done.tapPromise(
      {
        ...pluginTapPostOptions,
        stage: pluginTapPostOptions.stage! + 100,
      },
      this.done.bind(this),
    );
  }

  public afterPlugins = (compiler: Compiler): void => {
    if (compiler.isChild()) return;

    // deep clone before intercept
    const { plugins, infrastructureLogging, ...rest } = compiler.options;
    const _rest = cloneDeep(rest);

    makeRulesSerializable(_rest.module.defaultRules as RuleSetRule[]);
    makeRulesSerializable(_rest.module.rules as RuleSetRule[]);

    const configuration = {
      ..._rest,
      plugins: plugins.map((e) => e?.constructor.name),
    } as unknown as Configuration;

    // save webpack configuration to sdk
    this.sdk.reportConfiguration({
      name: 'webpack',
      version: compiler.webpack?.version || 'unknown',
      config: configuration,
    });

    this.sdk.setOutputDir(
      path.resolve(compiler.outputPath, `./${Constants.DoctorOutputFolder}`),
    );

    if (configuration.name) {
      this.sdk.setName(configuration.name);
    }
  };

  public beforeRun = async (compiler: Compiler): Promise<void> => {
    if (compiler.isChild()) return;

    await this._bootstrapTask.then(() => {
      if (!this.options.disableClientServer && !this.browserIsOpened) {
        this.browserIsOpened = true;
        this.sdk.server.openClientPage();
      }
    });
  };

  private _modulesGraphApplied = false;

  /**
   * @description Generate ModuleGraph and ChunkGraph from stats and webpack module apis;
   * @param {Compiler} compiler
   * @return {*}
   * @memberof DoctorWebpackPlugin
   */
  public ensureModulesChunksGraphApplied(compiler: Compiler) {
    if (this._modulesGraphApplied) return;
    this._modulesGraphApplied = true;

    const context: Required<ModuleGraphBuildUtils.TransformContext> = {
      astCache: new Map(),
      packagePathMap: new Map(),
      getSourceMap: (file: string) => {
        return this.sdk.getSourceMap(file);
      },
    };

    compiler.hooks.normalModuleFactory.tap(
      internalPluginTapPostOptions('moduleGraph'),
      (factory: Types.NormalModuleFactory) => {
        const record = (parser: ParserState) => {
          parser.hooks.program.tap(pluginTapPreOptions, (ast: Node.Program) => {
            context.astCache!.set(parser.state.current, ast);
          });
        };

        factory.hooks.parser
          .for('javascript/auto')
          .tap(pluginTapPostOptions, record);
        factory.hooks.parser
          .for('javascript/dynamic')
          .tap(pluginTapPostOptions, record);
        factory.hooks.parser
          .for('javascript/esm')
          .tap(pluginTapPostOptions, record);
      },
    );

    compiler.hooks.done.tapPromise(
      internalPluginTapPreOptions('moduleGraph'),
      async (stats) => {
        const statsJson = stats.toJson();

        debug(Process.getMemoryUsageMessage, '[Before Generate ModuleGraph]');

        this.chunkGraph = ChunksBuildUtils.chunkTransform(new Map(), statsJson);

        /** generate module graph */
        this.modulesGraph = await ModuleGraphBuildUtils.getModuleGraphByStats(
          stats.compilation,
          statsJson,
          process.cwd(),
          this.chunkGraph,
          this.options.features,
          context,
        );

        debug(Process.getMemoryUsageMessage, '[After Generate ModuleGraph]');

        /** Tree Shaking */
        // TODO: Add Tree Shaking functions
        // if (this.options.features.treeShaking) {
        //   this.modulesGraph = ModuleGraphBuildUtils.appendTreeShaking(this.modulesGraph, stats.compilation);
        //   this.sdk.addClientRoutes([Manifest.DoctorManifestClientRoutes.TreeShaking]);

        //   debug(Process.getMemoryUsageMessage, '[After AppendTreeShaking to ModuleGraph]');
        // }

        /** transform modules graph */
        await this.getModulesInfosByStats(
          compiler,
          statsJson,
          this.modulesGraph,
        );

        debug(Process.getMemoryUsageMessage, '[After Transform ModuleGraph]');

        this.modulesGraph &&
          (await this.sdk.reportModuleGraph(this.modulesGraph));
        await this.sdk.reportChunkGraph(this.chunkGraph);

        /** Generate webpack-bundle-analyzer tile graph */
        const reportFilePath = await ChunksBuildUtils.generateTileGraph(
          statsJson as Plugin.BaseStats,
          {
            reportFilename: ChunksBuildUtils.TileGraphReportName,
            reportTitle: 'bundle-analyzer',
          },
          compiler.outputPath,
        );

        reportFilePath &&
          (await this.sdk.reportTileHtml(
            fse.readFileSync(reportFilePath, 'utf-8'),
          ));
      },
    );
  }

  public done = async (): Promise<void> => {
    try {
      this.sdk.server.broadcast();
      debug(Process.getMemoryUsageMessage, '[Before Write Manifest]');
      await this.sdk.writeStore();
      debug(Process.getMemoryUsageMessage, '[After Write Manifest]');

      if (this.options.disableClientServer) {
        await this.sdk.dispose();
        debug(Process.getMemoryUsageMessage, '[After SDK Dispose]');
      }
    } catch (e) {}
  };

  /**
   * @protected
   * @description This function to get module parsed code and size;
   * @param {Compiler} compiler
   * @param {StatsCompilation} stats
   * @param {ModuleGraph} moduleGraph
   * @return {*}
   * @memberof DoctorWebpackPlugin
   */
  protected async getModulesInfosByStats(
    compiler: Compiler,
    stats: StatsCompilation,
    moduleGraph: ModuleGraph,
  ) {
    if (!moduleGraph) {
      return;
    }
    try {
      const parsedModulesData =
        (await ChunksBuildUtils.getAssetsModulesData(
          stats,
          compiler.outputPath,
        )) || {};
      ChunkUtils.transformAssetsModulesData(parsedModulesData, moduleGraph);
    } catch (e) {}
  }
}
