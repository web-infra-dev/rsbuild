import type { SDK } from '@rsbuild/doctor-types';
import type { Package } from './package';
import type { Dependency } from '../module-graph';

let id = 1;

export class PackageDependency implements SDK.PackageDependencyInstance {
  id = id++;

  dependency: Package;

  package: Package;

  refDependency: Dependency;

  constructor(pack: Package, dep: Package, refDependency: Dependency) {
    this.package = pack;
    this.dependency = dep;
    this.refDependency = refDependency;
  }

  get name() {
    return this.dependency.name;
  }

  get version() {
    return this.dependency.version;
  }

  get root() {
    return this.dependency.root;
  }

  isSame(dep: PackageDependency) {
    return (
      this.refDependency === dep.refDependency &&
      this.dependency.isSame(dep.dependency)
    );
  }

  toData(): SDK.PackageDependencyData {
    return {
      id: this.id,
      dependency: this.dependency.id,
      package: this.package.id,
      refDependency: this.refDependency.id,
    };
  }
}
