import type { ModuleInstance, DependencyInstance } from './module';
import type { StatementInstance, StatementData } from './statement';
import type { NonFunctionProperties } from '../common';

/** Variable data */
export interface VariableInstance {
  /** Variable number */
  readonly id: number;
  /** Variable name */
  readonly name: string;
  /** Module */
  readonly module: ModuleInstance;
  /** Is it used */
  readonly usedInfo: string;
  /** variable identifier declaration location */
  readonly identifier: StatementInstance;

  /** Set as export variable */
  setExportInfo(info: ExportInstance): void;
  /** Get export information */
  getExportInfo(): ExportInstance | undefined;
  /** Get data */
  toData(): VariableData;
}

export interface VariableData
  extends Omit<
    NonFunctionProperties<VariableInstance>,
    'identifier' | 'module'
  > {
  identifier: StatementData;
  module: number;
  exported?: number;
}

/** Export variable */
export interface ExportInstance {
  /** Number */
  readonly id: number;
  /**
   * Export name
   * - Default export is 'default'
   */
  readonly name: string;
  /**
   * Variable data
   * - This item is empty when the original variable does not exist
   */
  readonly variable?: VariableInstance;
  /**
   * The position of the export variable in the export statement
   * - If it is exported as namespace or reexport, this item does not exist
   */
  readonly identifier?: StatementInstance;
  /** Is it a re-export */
  readonly isReExport: boolean;

  /** Set as export variable */
  addSideEffect(info: SideEffectInstance): void;
  /** Get all side effects */
  getSideEffects(): SideEffectInstance[];

  /** Set superior export */
  setFromExport(from: ExportInstance): void;
  /**
   * Obtain superior data
   * Will return to itself when there is no superior data
   * @param [number] - depth is Infinity by default, get the original export, get the superior export when it is 1
   */
  getRecursiveExport(depth?: number): ExportInstance;

  toData(): ExportData;
}

/** Export variable data */
export interface ExportData
  extends Omit<
    NonFunctionProperties<ExportInstance>,
    'identifier' | 'variable'
  > {
  from?: number;
  root?: number;
  used: number[];
  identifier?: StatementData;
  variable?: number;
}

/** Import variable data */
export interface SideEffectInstance {
  /** Number */
  readonly id: number;
  /**
   * Import name
   * - default import is 'default'
   */
  readonly name: string;
  /**
   * Import original name
   * - default import is 'default'
   * - 'namespace' for full import
   */
  readonly originName?: string;
  /** Module */
  readonly module: ModuleInstance;

  /** The position of the imported variable in the statement */
  readonly identifier: StatementInstance;
  /** Variable data */
  readonly variable?: VariableInstance;
  /** Superior export statement */
  readonly exports?: ExportInstance[];
  /** Whether it is a named import */
  readonly isNameSpace: boolean;
  /**
   * Dependency derived from side effects
   * - This item is empty when it is a local side effect
   */
  readonly fromDependency?: DependencyInstance;

  /** Connect all exported data of the module */
  setModuleExport(module: ModuleGraphModuleInstance): void;

  /** Connect to export data */
  setExportInfo(info: ExportInstance): void;
  toData(): SideEffectData;
}

export interface SideEffectData
  extends Omit<
    NonFunctionProperties<SideEffectInstance>,
    | 'module'
    | 'exports'
    | 'identifier'
    | 'variable'
    | 'isNameSpace'
    | 'fromDependency'
  > {
  module: number;
  identifier: StatementData;
  fromDependency?: number;
  variable?: number;
  exports?: number[];
  isNameSpace?: boolean;
}

export interface ModuleGraphModuleInstance {
  /** Current Module */
  readonly module: ModuleInstance;
  /**
   * Dynamic reference
   * - indicates that when referencing this module, the module's exportsType is 'dynamic ' , and tree-shaking analysis will be ignored
   */
  readonly dynamic: boolean;

  /** Add export data */
  addExportInfo(data: ExportInstance): void;
  /** Add side effect data */
  addSideEffect(data: SideEffectInstance): void;
  /** Add variable data */
  addVariable(data: VariableInstance): void;
  /** Get all exports */
  getExports(): ExportInstance[];
  /** Get all imports */
  getSideEffects(name?: string): SideEffectInstance[];
  /** Get local export */
  getOwnExports(): ExportInstance[];
  /** Get export data */
  getExport(name: string): ExportInstance | undefined;

  /** Get self-exported data */
  getOwnExport(name: string): ExportInstance | undefined;
  /** Get re-exported data */
  getReExport(name: string): ExportInstance | undefined;
  toData(): ModuleGraphModuleData;
}

export interface ModuleGraphModuleData
  extends Omit<NonFunctionProperties<ModuleGraphModuleInstance>, 'module'> {
  /** Module number */
  module: number;

  /** Export data */
  exports: number[];
  /** Side effect data */
  sideEffects: number[];
  /** Variable data */
  variables: number[];
}
