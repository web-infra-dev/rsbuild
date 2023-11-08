import type { Compiler, NormalModule, Stats } from 'webpack';
import { ModuleGraph } from '@rsbuild/doctor-sdk/graph';
import { removeAbsModulePath } from '../common/utils';
import { Chunks, ModuleGraph as ModuleGraphBuildUtils } from '../../src/build-utils/build';

export class ModuleGraphTestPlugin {
  public readonly name = 'ModuleGraphTestPlugin';

  private root: string;

  public modulesGraph = new ModuleGraph();

  private astCache = new Map<NormalModule, any>();

  constructor(root: string) {
    this.root = root;
  }

  // avoid hint error from ts type validation
  apply(compiler: unknown): unknown;

  apply(compiler: Compiler) {
    const { astCache, name } = this;
    const preOptions = {
      name,
      stage: -999,
    };

    compiler.hooks.normalModuleFactory.tap(preOptions, (factory) => {
      const record = (parser: any) => {
        parser.hooks.program.tap(preOptions, (ast: any) => {
          astCache.set(parser.state.current, ast);
        });
      };

      factory.hooks.parser.for('javascript/auto').tap(preOptions, record);
      factory.hooks.parser.for('javascript/dynamic').tap(preOptions, record);
      factory.hooks.parser.for('javascript/esm').tap(preOptions, record);
    });

    compiler.hooks.done.tapPromise(preOptions, this.done.bind(this, compiler));
  }

  async done(_: Compiler, stats: Stats) {
    const statsData = stats.toJson();
    const chunkGraph = Chunks.chunkTransform(new Map(), statsData);

    this.modulesGraph = await ModuleGraphBuildUtils.getModuleGraphByStats(
      stats.compilation,
      statsData,
      this.root,
      chunkGraph,
      undefined,
      {
        astCache: this.astCache,
      },
    );
    this.modulesGraph = this.modulesGraph;
  }

  toData() {
    removeAbsModulePath(this.modulesGraph, this.root);
    return this.modulesGraph.toData();
  }
}
