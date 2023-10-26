import type { Program } from 'estree';
import type { SourceMapConsumer } from 'source-map';
import type { NonFunctionProperties } from '../common';
import type { ChunkInstance } from './chunk';
import type { StatementInstance, StatementData } from './statement';
import type { PackageData } from './package';
import type {
  ModuleGraphModuleInstance,
  ModuleGraphModuleData,
  ExportData,
  ExportInstance,
  SideEffectData,
  SideEffectInstance,
  VariableData,
  VariableInstance,
} from './tree-shaking';

export enum DependencyKind {
  Unknown,
  ImportStatement,
  DynamicImport,
  RequireCall,
  AMDRequire,
}

/** Source code location */
export interface SourcePosition {
  line?: number;
  column?: number;
  index?: number;
}

/** Source code range */
export interface SourceRange {
  start: SourcePosition;
  end?: SourcePosition;
}

/** Module size */
export interface ModuleSize {
  sourceSize: number;
  /** Code size after transformed */
  transformedSize: number;
  /**
   * Code size after compiled
   *   - The size the module occupies in the product after packing.
   */
  parsedSize: number;
}

/** Module source code */
export interface ModuleSource {
  /** source code */
  source: string;
  /** transformed code */
  transformed: string;
  /* code after parsed */
  parsedSource: string;
}

/** Module Metadata */
export interface ModuleBuildMeta {
  /**
   * Whether to include the esModule flag statement
   * ```js
   * Object.defineProperty(exports, "__esModule", { value: true });
   * ```
   *   - This statement usually appears in the object code of the tsc to cjs module.
   */
  hasSetEsModuleStatement: boolean;
  /**
   * Strict ESM module.
   */
  strictHarmonyModule: boolean;
  packageData?: PackageData;
}

/** Module type */
export enum ModuleKind {
  /** Normal module */
  Normal,
  /** Aggregation module */
  Concatenation,
}

export enum ToDataType {
  /** Normal mode */
  Normal,
  /** Lite mode */
  Lite,
  /** Lite & No Assets Code mode */
  LiteAndNoAsset,
}

export interface ModuleInstance {
  /** Module identifier */
  readonly id: number;
  /** webpack identifier */
  readonly webpackId: string;
  /** Module path */
  readonly path: string;
  readonly isEntry: boolean;
  readonly kind: ModuleKind;
  /** Root module in aggregate module */
  readonly rootModule?: ModuleInstance;
  /**
   * Preference to source location
   *   - Indicates that the source code is not empty and there is source code location mapping data.
   */
  isPreferSource: boolean;
  /** Build properties */
  meta: ModuleBuildMeta;

  /** Get the Chunks instance where the module in.*/
  getChunks(): ChunkInstance[];
  /** Add Chunk instance */
  addChunk(chunk: ChunkInstance): void;
  removeChunk(chunk: ChunkInstance): void;
  getDependencies(): DependencyInstance[];
  getDependencyByRequest(request: string): DependencyInstance | undefined;
  /** Get dependency data from module */
  getDependencyByModule(module: ModuleInstance): DependencyInstance | undefined;
  removeDependency(dependency: DependencyInstance): void;
  /** Remove dependency data from module */
  removeDependencyByModule(module: ModuleInstance): void;
  removeImported(module: ModuleInstance): void;
  getImported(): ModuleInstance[];
  addImported(module: ModuleInstance): void;
  addDependency(
    request: string,
    module: ModuleInstance,
    kind: DependencyKind,
    statements?: StatementInstance[],
  ): DependencyInstance | undefined;
  toData(contextPath?: string): ModuleData;
  setSource(source: Partial<ModuleSource>): void;
  getSource(): ModuleSource;
  /**Set code AST after transform */
  setProgram(program: Program): void;
  /** Get the converted code AST */
  getProgram(): Program | undefined;
  /** Set module size information */
  setSize(size: Partial<ModuleSize>): void;
  getSize(): ModuleSize;
  setSourceMap(sourcemap: SourceMapConsumer): void;
  /** Get source code mapping */
  getSourceMap(): SourceMapConsumer | undefined;
  /**
   * Generate statement instances
   * @param transformed {SourceRange} The location of the transformed code.
   */
  getStatement(transformed: SourceRange): StatementInstance | undefined;
  /**
   * Generate original code location
   * @param transformed {SourceRange} The location of the transformed code.
   */
  getSourceRange(transformed: SourceRange): SourceRange | undefined;
  /** Add connected submodules */
  addNormalModule(module: ModuleInstance): void;
  /** If it is currently a connection module, return all connected base subpackages */
  getNormalModules(): ModuleInstance[];
  /** Added aggregation module */
  addConcatenationModule(module: ModuleInstance): void;
  /** Get all aggregated modules to which the current module belongs */
  getConcatenationModules(): ModuleInstance[];
}

/** Depends on Metadata */
export interface DependencyBuildMeta {
  /**
   * Types of dependencies between modules
   *   - The basis for webpack to add runtime to modules.
   *
   * @link https://github.com/webpack/webpack/blob/v5.75.0/lib/Module.js#L428
   * @link https://github.com/webpack/webpack/blob/v4.46.0/lib/RuntimeTemplate.js#L215
   */
  exportsType: 'namespace' | 'default-only' | 'default-with-named' | 'dynamic';
}

export interface DependencyInstance {
  /** Identifier */
  readonly id: number;
  /**
   * Original request
   *  - refers to the original request in the import statement
   *  - @example `import {Instance} from'chalk'` in the statement 'chalk'
   */
  readonly request: string;
  /** actual requested path */
  readonly resolvedRequest: string;
  /** Module */
  readonly module: ModuleInstance;
  /**
   * Dependency Module
   * - Always non-aggregated modules
   */
  readonly dependency: ModuleInstance;
  /**
   * Original dependency module
   * - Aggregation module preferred
   */
  readonly originDependency: ModuleInstance;
  /**
   * Citation method
   * - Numeric enumeration
   */
  readonly kind: DependencyKind;
  /**
   * Citation method
   * - string enumeration
   */
  readonly kindString: keyof typeof DependencyKind;
  /** Whether to connect to the aggregation module */
  readonly resolveConcatenationModule: boolean;
  /** quote statement */
  readonly statements: StatementInstance[];
  /** build attribute */
  meta: DependencyBuildMeta;
  /** Generate data */
  toData(): DependencyData;
  /** Add statement */
  addStatement(statement: StatementInstance): void;
  /** Whether this statement is included */
  hasStatement(statement: StatementInstance): boolean;
  /**
   * Is it the same dependency?
   * - Check properties other than id and statements
   */
  isSameWithoutStatements(dep: DependencyInstance): boolean;
}

export type ModuleGraphToDataArgs = { contextPath: string };

export interface ModuleGraphInstance {
  /** Clear data */
  clear(): void;

  /** How many modules are there in total */
  size(): number;

  /** overwrite data */
  fromInstance(data: ModuleGraphInstance): void;

  /** Create module connection data */
  addModuleGraphModule(info: ModuleGraphModuleInstance): void;

  /** Get module connection data */
  getModuleGraphModule(module: ModuleInstance): ModuleGraphModuleInstance;

  /** Get all module connection data */
  getModuleGraphModules(): ModuleGraphModuleInstance[];

  /** Get all modules */
  getModules(): ModuleInstance[];

  /** Get all modules */
  getDependencies(): DependencyInstance[];

  /** Get connection by id */
  getDependencyById(id: number): DependencyInstance | undefined;

  /** Get entrance module */
  getEntryModules(): ModuleInstance[];

  /** Get the subgraph of the current node as the entry point */
  getSubGraphByModule(module: ModuleInstance): ModuleInstance[];

  /** Get module by id */
  getModuleById(id: number): ModuleInstance | undefined;

  /** get module by webpackId */
  getModuleByWebpackId(webpackId: string): ModuleInstance | undefined;

  /** Get module by path */
  getModuleByFile(file: string): ModuleInstance | undefined;

  /** Add Module */
  addModule(module: ModuleInstance): void;

  /** Add module connection */
  addDependency(module: DependencyInstance): void;
  /**
   * Remove module
   * - The connection relationship of this module will also be removed
   */
  removeModule(module: ModuleInstance): void;
  /**
   * Remove connection
   * - If one of the connected endpoints is an independent module, this module will also be removed from the module diagram
   */
  removeDependency(dependency: DependencyInstance): void;
  /** Add export data */
  addExportInfo(data: ExportInstance): void;

  /** Add side effect data */
  addSideEffect(data: SideEffectInstance): void;

  /** Add variable data */
  addVariable(data: VariableInstance): void;

  /** Generate data */
  toData(configs?: ModuleGraphToDataArgs): ModuleGraphData;

  /** Generate data */
  toCodeData(): ModuleCodeData;
}

export interface ModuleData
  extends Omit<
    NonFunctionProperties<ModuleInstance>,
    'rootModule' | 'isEntry' | 'concatenationModules' | 'meta'
  > {
  /** chunk identifier */
  chunks: string[];

  /** Module identifier on which the module depends */
  dependencies: number[];

  /** Identifier of the dependent module */
  imported: number[];

  /** Is it an entrance module */
  isEntry?: boolean | undefined;

  /** Use source code location first */
  isPreferSource: boolean;

  /** Module size */
  size: ModuleSize;

  /** Connected base subpackage */
  modules?: number[];

  /** root module number */
  rootModule?: number;

  /** Affiliated aggregation module number */
  concatenationModules?: number[];
  /** Module Id */
  webpackId: string;

  /** Build original attributes */
  meta?: Partial<Omit<ModuleBuildMeta, 'packageData'>>;
}

export type ModuleCodeData = Record<number, ModuleSource>;

export interface DependencyData
  extends Omit<
    NonFunctionProperties<DependencyInstance>,
    | 'module'
    | 'dependency'
    | 'statements'
    | 'originDependency'
    | 'kindString'
    | 'resolveConcatenationModule'
    | 'meta'
  > {
  /** Module Identifier */
  module: number;
  /** Dependency Module Identifier */
  dependency: number;
  /** Original module identifier */
  originDependency: number;
  /** quote statement */
  statements: StatementData[];
}

export interface ModuleGraphData {
  dependencies: DependencyData[];
  modules: ModuleData[];
  moduleGraphModules: ModuleGraphModuleData[];
  exports: ExportData[];
  sideEffects: SideEffectData[];
  variables: VariableData[];
}
