import type { SDK } from '@rsbuild/doctor-types';
import { relative } from 'path';
import type { Module } from '../module-graph';
import type { PackageGraph } from './graph';
import { isPackagePath } from './utils';
import { PackageDependency } from './dependency';

let id = 1;

export class Package implements SDK.PackageInstance {
  id = id++;

  root: string;

  name: string;

  version: string;

  private _modules: Module[] = [];

  private _dependencies: PackageDependency[] = [];

  private _imported: Package[] = [];

  constructor(name: string, root: string, version: string) {
    this.name = name;
    this.root = root;
    this.version = version;
  }

  getModules(): Module[] {
    return this._modules.slice();
  }

  getDependencies(): PackageDependency[] {
    return this._dependencies.slice();
  }

  getImported(): Package[] {
    return this._imported.slice();
  }

  addModule(module: Module) {
    if (!this._modules.includes(module)) {
      this._modules.push(module);
    }
  }

  addDependency(dep: PackageDependency) {
    if (this._dependencies.every((item) => !item.isSame(dep))) {
      this._dependencies.push(dep);
      dep.dependency.addImported(this);
    }
  }

  getDependenciesChain(graph: PackageGraph) {
    function getImported(
      pkg: Package,
      ans: PackageDependency[],
    ): PackageDependency[] {
      const dependencies = graph.getDependenciesFromPackage(pkg);

      for (const dep of dependencies) {
        if (!dep.refDependency) {
          continue;
        }

        // The circular reference jumps out.
        if (ans.some((dep) => dep.dependency === pkg)) {
          continue;
        }

        // Go to the user's source code and end the query
        if (!dep.package) {
          return ans.concat(dep);
        }

        return getImported(dep.package, ans.concat(dep));
      }

      return ans;
    }

    return getImported(this, []);
  }

  addImported(pkg: Package) {
    if (!this._imported.includes(pkg)) {
      this._imported.push(pkg);
    }
  }

  contain(file: string) {
    const subPath = relative(this.root, file);

    // Non-identical directories.
    if (subPath.startsWith('..')) {
      return false;
    }

    // Some modules will be in the node_modules of the current module, and another judgment needs to be made here.
    return !isPackagePath(subPath);
  }

  isSame(pkg: Package) {
    return (
      this.root === pkg.root &&
      this.version === pkg.version &&
      this.name === pkg.name
    );
  }

  getSize(): SDK.ModuleSize {
    return this._modules.reduce(
      (ans, item) => {
        const size = item.getSize();
        ans.sourceSize += size.sourceSize;
        ans.transformedSize += size.transformedSize;
        ans.parsedSize += size.parsedSize;
        return ans;
      },
      {
        sourceSize: 0,
        transformedSize: 0,
        parsedSize: 0,
      },
    );
  }

  toData(): SDK.PackageData {
    return {
      id: this.id,
      name: this.name,
      root: this.root,
      version: this.version,
      modules: this.getModules().map((e) => e.id),
      size: this.getSize(),
    };
  }
}
