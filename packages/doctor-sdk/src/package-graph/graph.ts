import { unionBy } from 'lodash';
import { dirname, join, resolve } from 'path';
import { SDK } from '@rsbuild/doctor-types';
import { Package as PackageUtil } from '@rsbuild/doctor-utils/common';
import type { ModuleGraph, Module } from '../module-graph';
import { Package } from './package';
import { PackageDependency } from './dependency';

export class PackageGraph implements SDK.PackageGraphInstance {
  static fromModuleGraph(
    graph: ModuleGraph,
    root: string,
    getPackageFile?: SDK.GetPackageFile,
  ): PackageGraph {
    const pkgGraph = new PackageGraph(root);
    const modules = graph
      .getModules()
      .filter((item) => item.kind === SDK.ModuleKind.Normal);

    // Generate all package data.
    for (const item of modules) {
      const pkg = pkgGraph.getPackageByModule(item, getPackageFile);

      if (pkg) {
        pkgGraph.addPackage(pkg);
        pkg.addModule(item);
      }
    }

    // Generate all dependent data.
    for (const dep of graph.getDependencies()) {
      const modulePkg = pkgGraph.getPackageByFile(dep.module.path);
      const dependencyPkg = pkgGraph.getPackageByFile(dep.dependency.path);

      if (modulePkg && dependencyPkg && !modulePkg.isSame(dependencyPkg)) {
        const pkgDep = new PackageDependency(modulePkg, dependencyPkg, dep);
        pkgGraph.addDependency(pkgDep);
        modulePkg.addDependency(pkgDep);
      }
    }

    return pkgGraph;
  }

  private _root: string;

  private _dependencies: PackageDependency[] = [];

  private _packages: Package[] = [];

  private _pkgNameMap = new Map<string, Package[]>();

  private _pkgFileMap = new Map<string, Package>();

  constructor(root: string) {
    this._root = root;
  }

  getPackages() {
    return this._packages.slice();
  }

  getPackageByModule(module: Module, readFile?: SDK.GetPackageFile) {
    const { path: file, meta } = module;
    const { _pkgFileMap: pkgsMap } = this;
    const getPackageByData = (data: SDK.PackageBasicData) => {
      return (
        this.getPackageByData(data) ??
        new Package(data.name, data.root, data.version)
      );
    };

    if (pkgsMap.has(file)) {
      return pkgsMap.get(file);
    }

    if (meta.packageData) {
      const pkg = getPackageByData(meta.packageData);
      pkgsMap.set(file, pkg);
      return pkg;
    }

    const readPackageJson = (
      file: string,
      readFile?: SDK.GetPackageFile,
    ): SDK.PackageBasicData | undefined => {
      let result: SDK.PackageJSONData | undefined;
      let current = file;

      while (current !== '/' && !result) {
        if (dirname(current) === current) {
          break;
        }
        current = dirname(current);
        if (readFile) {
          result =
            readFile(join(current, 'package.json')) ||
            PackageUtil.getPackageMetaFromModulePath(file);
        }
        if (!readFile || !result?.name) {
          result = PackageUtil.getPackageMetaFromModulePath(file);
        }
      }

      if (!result) {
        return;
      }

      // Some packages will put an empty package.json in the source folder.
      if (readFile && (!result.name || !result.version)) {
        return readPackageJson(dirname(current), readFile);
      }

      return {
        ...result,
        root: current,
      };
    };

    const cache = this.getPackageContainFile(file);

    if (cache) {
      pkgsMap.set(file, cache);
      return cache;
    }
    const data = readPackageJson(file, readFile);

    if (!data) {
      return;
    }

    if (data.root.startsWith('.')) {
      data.root = resolve(this._root, data.root);
    }

    const pkg = getPackageByData(data);

    this.addPackage(pkg);
    pkgsMap.set(file, pkg);
    return pkg;
  }

  getPackageByFile(file: string) {
    return this._pkgFileMap.get(file);
  }

  getPackageContainFile(file: string) {
    return this._packages.find((pkg) => pkg.contain(file));
  }

  getPackagesByName(name: string) {
    return this._pkgNameMap.get(name) ?? [];
  }

  getPackageByData(data: SDK.PackageBasicData) {
    return this._pkgNameMap
      .get(data.name)
      ?.find(
        (item) => item.version === data.version && item.root === data.root,
      );
  }

  addPackage(pkg: Package) {
    if (this._packages.every((item) => !item.isSame(pkg))) {
      this._packages.push(pkg);

      const { _pkgNameMap: map } = this;
      const arr = map.get(pkg.name) ?? [];

      if (arr.every((item) => !item.isSame(pkg))) {
        arr.push(pkg);
        map.set(pkg.name, arr);
      }
    }
  }

  getDependenciesFromPackage(pkg: Package) {
    return this._dependencies.filter((dep) => dep.dependency === pkg);
  }

  addDependency(dep: PackageDependency) {
    if (this._dependencies.every((item) => !item.isSame(dep))) {
      this._dependencies.push(dep);
    }
  }

  getDependenciesFromOrigin() {
    return this._dependencies.filter((item) => !item.package);
  }

  getDuplicatePackages(): Package[][] {
    return unionBy(
      Array.from(this._pkgNameMap.values()).filter((pkgs) => pkgs.length > 1),
      (pkgs) => pkgs[0].name,
    );
  }

  toData(): SDK.PackageGraphData {
    return {
      packages: this._packages.map((e) => e.toData()),
      dependencies: this._dependencies.map((d) => d.toData()),
    };
  }
}
