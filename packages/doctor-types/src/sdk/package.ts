import type { ModuleInstance, DependencyInstance, ModuleSize } from './module';
import type { NonFunctionProperties } from '../common';

export interface PackageJSONData {
  /** package name */
  name: string;
  version: string;
}

export interface PackageBasicData extends PackageJSONData {
  /** Directory where the package is located */
  root: string;
}

export interface PackageInstance extends PackageBasicData {
  id: number;
  /** Get all modules contained in the package */
  getModules(): ModuleInstance[];
  /** Get all dependencies */
  getDependencies(): PackageDependencyInstance[];
  /** Get the dependency chain of the current package */
  getDependenciesChain(
    graph: PackageGraphInstance,
  ): PackageDependencyInstance[];
  /** Get all dependencies */
  getImported(): PackageInstance[];
  addModule(module: ModuleInstance): void;
  /** Add package dependencies */
  addDependency(dep: PackageDependencyInstance): void;

  /** Add dependency */
  addImported(pkg: PackageInstance): void;

  /** Whether this path is included */
  contain(path: string): boolean;

  /** Is it the same package */
  isSame(pkg: PackageInstance): boolean;

  /** Get package size */
  getSize(): ModuleSize;

  /** Get data */
  toData(): PackageData;
}

export interface PackageData extends NonFunctionProperties<PackageInstance> {
  modules: number[];
  size: ModuleSize;
}

export interface PackageDependencyInstance {
  /** Number */
  id: number;

  /** Dependency package */
  dependency: PackageInstance;
  /**
   * Current package
   * - This item is local package data when using user code
   */
  package: PackageInstance;

  /** Module dependency where the dependency statement is located */
  refDependency: DependencyInstance;

  /** Is it the same reference */
  isSame(dep: PackageDependencyInstance): boolean;

  /** Get data */
  toData(): PackageDependencyData;
}

export interface PackageDependencyData
  extends Omit<
    NonFunctionProperties<PackageDependencyInstance>,
    'dependency' | 'package' | 'refDependency'
  > {
  dependency: number;
  package: number;
  refDependency: number;
}

/**
 * Get the contents of the package.json file
 * @param {string} Relative project root directory path
 */
export type GetPackageFile = (path: string) => PackageJSONData | undefined;

export interface PackageGraphInstance {
  /**
   * Get all package data
   */
  getPackages(): PackageInstance[];
  /**
   * Get package data from module
   * The new package will create new data and join the cache
   * - If created, old data will be returned
   */
  getPackageByModule(
    module: ModuleInstance,
    readFile?: GetPackageFile,
  ): PackageInstance | undefined;
  /**
   * Get package data from file
   * - No new data will be created
   */
  getPackageByFile(file: string): PackageInstance | undefined;
  /**
   * Get package data from data
   * - No new data will be created
   */
  getPackageByData(data: PackageBasicData): PackageInstance | undefined;
  /**
   * Get package data from name
   */
  getPackagesByName(name: string): PackageInstance[];
  /**
   * Get dependencies from package
   * - The input package is dependent
   */
  getDependenciesFromPackage(pkg: PackageInstance): PackageDependencyInstance[];
  /** Get package dependencies imported from user code */
  getDependenciesFromOrigin(): PackageDependencyInstance[];
  /** Add package data */
  addPackage(pkg: PackageInstance): void;

  /** Add dependency data */
  addDependency(dep: PackageDependencyInstance): void;

  /** Get duplicate package data */
  getDuplicatePackages(): PackageInstance[][];
  toData(): PackageGraphData;
}

export interface PackageGraphData {
  packages: PackageData[];
  dependencies: PackageDependencyData[];
}

export interface OtherReports {
  tileReportHtml?: string;
}
