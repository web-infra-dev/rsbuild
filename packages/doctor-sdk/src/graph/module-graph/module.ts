import { SDK } from '@rsbuild/doctor-types';
import path from 'path';
import { isNumber } from 'lodash';
import type { SourceMapConsumer } from 'source-map';
import type { Program } from 'estree';
import { Dependency } from './dependency';
import { Statement } from './statement';
import { Chunk } from '../chunk-graph';
import { getModuleName } from './utils';

let id = 1;

export class Module implements SDK.ModuleInstance {
  static kind = SDK.ModuleKind;

  static init() {
    id = 1;
  }

  readonly id: number;

  readonly webpackId: string;

  readonly path: string;

  readonly isEntry: boolean;

  readonly kind: SDK.ModuleKind;

  private source: SDK.ModuleSource = {
    source: '',
    transformed: '',
    parsedSource: '',
  };

  private size: SDK.ModuleSize = {
    sourceSize: 0,
    transformedSize: 0,
    parsedSize: 0,
  };

  private sourceMap: SourceMapConsumer | undefined;

  private program: Program | undefined;

  private chunks: Chunk[] = [];

  private dependencies: Dependency[] = [];

  private imported: Module[] = [];

  private modules: Module[] = [];

  private concatenationModules: Module[] = [];

  private _isPreferSource?: boolean;

  meta: SDK.ModuleBuildMeta = {
    hasSetEsModuleStatement: false,
    strictHarmonyModule: false,
  };

  constructor(
    webpackId: string,
    path: string,
    isEntry = false,
    kind = SDK.ModuleKind.Normal,
  ) {
    this.id = id++;
    this.webpackId = webpackId;
    this.path = path;
    this.isEntry = isEntry;
    this.kind = kind;
  }

  get rootModule(): Module | undefined {
    return this.modules.find((item) => item.path === this.path);
  }

  get isPreferSource() {
    if (typeof this._isPreferSource === 'boolean') {
      return this._isPreferSource;
    }

    const result =
      this.source.source.length > 0 &&
      this.source.source !== 'test code' &&
      Boolean(this.sourceMap);
    this._isPreferSource = result;
    return result;
  }

  getChunks(): Chunk[] {
    return this.chunks.slice();
  }

  addChunk(chunk: Chunk): void {
    if (!this.chunks.includes(chunk)) {
      this.chunks.push(chunk);
      chunk.addModule(this);
    }
  }

  removeChunk(chunk: Chunk): void {
    this.chunks = this.chunks.filter((item) => item !== chunk);
  }

  getDependencies(): Dependency[] {
    return this.dependencies.slice();
  }

  getDependencyByRequest(request: string): Dependency | undefined {
    return this.dependencies.find((item) => item.request === request);
  }

  getDependencyByModule(module: Module): Dependency | undefined {
    return this.dependencies.find(
      (item) => item.originDependency === module || item.dependency === module,
    );
  }

  addDependency(
    request: string,
    module: Module,
    kind: SDK.DependencyKind,
    statements?: Statement[],
  ) {
    const dep = new Dependency(request, this, module, kind, statements);

    if (this.dependencies.every((item) => !item.isSameWithoutStatements(dep))) {
      this.dependencies.push(dep);
      module.addImported(this);

      if (module.rootModule) {
        module.rootModule.addImported(this);
      }

      return dep;
    }
  }

  removeDependency(dep: Dependency): void {
    this.dependencies = this.dependencies.filter((item) => item === dep);
  }

  removeDependencyByModule(module: Module): void {
    const dep = this.getDependencyByModule(module);
    if (dep) {
      this.removeDependency(dep);
    }
  }

  getImported(): Module[] {
    return this.imported.slice();
  }

  addImported(module: Module): void {
    if (!this.imported.includes(module)) {
      this.imported.push(module);
    }
  }

  removeImported(module: Module): void {
    this.imported = this.imported.filter((item) => item === module);
  }

  setProgram(program: Program) {
    this.program = program;
  }

  getProgram() {
    return this.program;
  }

  setSource(input: Partial<SDK.ModuleSource>): void {
    const { source } = this;
    source.source = input.source ?? source.source;
    source.transformed = input.transformed ?? source.transformed;
    source.parsedSource = input.parsedSource ?? source.parsedSource;
  }

  getSource(type: SDK.ToDataType = SDK.ToDataType.Normal) {
    return type === SDK.ToDataType.Lite
      ? {
          source: '',
          transformed: '',
          parsedSource: this.source.parsedSource,
        }
      : this.isPreferSource
      ? {
          source: this.source.source,
          transformed: '',
          parsedSource: '',
        }
      : {
          source: this.source.source,
          transformed: this.source.transformed,
          parsedSource: this.source.parsedSource,
        };
  }

  setSourceMap(sourceMap: SourceMapConsumer): void {
    this.sourceMap = sourceMap;
  }

  getSourceMap(): SourceMapConsumer | undefined {
    return this.sourceMap;
  }

  setSize(input: Partial<SDK.ModuleSize>): void {
    const { size } = this;
    size.sourceSize = input.sourceSize ?? size.sourceSize;
    size.transformedSize = input.transformedSize ?? size.transformedSize;
    size.parsedSize = input.parsedSize ?? size.parsedSize;
  }

  getSize() {
    return { ...this.size };
  }

  getStatement(transformed: SDK.SourceRange) {
    return new Statement(this, {
      source: this.getSourceRange(transformed),
      transformed: {
        start: { ...transformed.start },
        end: transformed.end ? { ...transformed.end } : undefined,
      },
    });
  }

  getSourceRange(transformed: SDK.SourceRange) {
    const { sourceMap } = this;

    if (!sourceMap) {
      return;
    }

    const source: SDK.SourceRange = {
      start: {},
    };
    const startInSource = sourceMap.originalPositionFor({
      line: transformed.start.line ?? 0,
      column: transformed.start.column ?? 0,
      // The largest lower bound.
      bias: 1,
    });

    if (isNumber(startInSource.line)) {
      source.start = {
        line: startInSource.line,
        column: startInSource.column ?? undefined,
      };
    }

    if (transformed.end) {
      const endInSource = sourceMap.originalPositionFor({
        line: transformed.end.line ?? 0,
        column: transformed.end.column ?? 0,
        // The smallest lower bound
        // bias: 2,
      });

      if (isNumber(endInSource.line)) {
        source.end = {
          line: endInSource.line,
          column: endInSource.column ?? undefined,
        };
      }
    }

    return source;
  }

  addNormalModule(module: Module): void {
    if (!this.modules.includes(module)) {
      this.modules.push(module);
      module.addConcatenationModule(this);
    }
  }

  getNormalModules() {
    return this.modules.slice();
  }

  addConcatenationModule(module: Module): void {
    if (!this.concatenationModules.includes(module)) {
      this.concatenationModules.push(module);
    }
  }

  getConcatenationModules(): Module[] {
    return this.concatenationModules.slice();
  }

  toData(contextPath?: string): SDK.ModuleData {
    const { isPreferSource } = this;
    const moduleName = getModuleName(this.webpackId);
    const data: SDK.ModuleData = {
      id: this.id,
      webpackId:
        contextPath && moduleName.indexOf('.') > 0
          ? path.relative(contextPath, moduleName)
          : this.webpackId,
      path: this.path,
      isPreferSource,
      dependencies: this.dependencies.map((item) => item.id),
      imported: this.imported.map((item) => item.id),
      chunks: this.chunks.map((item) => item.id),
      size: this.getSize(),
      kind: this.kind,
    };

    if (this.meta.hasSetEsModuleStatement || this.meta.strictHarmonyModule) {
      data.meta = {};

      if (this.meta.hasSetEsModuleStatement) {
        data.meta.hasSetEsModuleStatement = true;
      }

      if (this.meta.strictHarmonyModule) {
        data.meta.strictHarmonyModule = true;
      }
    }

    if (this.isEntry) {
      data.isEntry = this.isEntry;
    }

    if (this.modules.length > 0) {
      data.modules = this.modules.map((item) => item.id);
    }

    if (this.rootModule) {
      data.rootModule = this.rootModule.id;
    }

    if (this.concatenationModules.length > 0) {
      data.concatenationModules = this.concatenationModules.map(
        (data) => data.id,
      );
    }

    return data;
  }
}
