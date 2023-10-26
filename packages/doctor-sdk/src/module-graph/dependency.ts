import { SDK } from '@rsbuild/doctor-types';
import type { Module } from './module';
import { Statement } from './statement';

let id = 1;

export class Dependency implements SDK.DependencyInstance {
  static kind = SDK.DependencyKind;

  static init() {
    id = 1;
  }

  readonly id: number;

  readonly request: string;

  readonly module: Module;

  readonly kind: SDK.DependencyKind;

  readonly statements: Statement[] = [];

  private _originDependency: Module;

  meta: SDK.DependencyBuildMeta = {
    exportsType: 'default-with-named',
  };

  constructor(
    request: string,
    module: Module,
    dependency: Module,
    kind: SDK.DependencyKind,
    statements?: Statement[],
  ) {
    this.id = id++;
    this.request = request;
    this.module = module;
    this._originDependency = dependency;
    this.kind = kind;
    this.statements = statements ?? [];
  }

  get resolvedRequest() {
    return this.dependency.path;
  }

  get dependency() {
    return this.originDependency.rootModule ?? this.originDependency;
  }

  get originDependency() {
    return this._originDependency;
  }

  get kindString() {
    return SDK.DependencyKind[this.kind] as keyof typeof SDK.DependencyKind;
  }

  get resolveConcatenationModule() {
    return this.dependency.kind === SDK.ModuleKind.Concatenation;
  }

  isSameWithoutStatements(dep: Dependency) {
    return (
      this.request === dep.request &&
      this.kind === dep.kind &&
      this.module.id === dep.module.id &&
      this.dependency.id === dep.dependency.id
    );
  }

  addStatement(statement: Statement): void {
    if (!this.hasStatement(statement)) {
      this.statements.push(statement);
    }
  }

  hasStatement(statement: Statement): boolean {
    return this.statements.some((item) => item.isSame(statement));
  }

  setBuildMeta(data: SDK.DependencyBuildMeta): void {
    this.meta = {
      ...this.meta,
      ...data,
    };
  }

  toData(): SDK.DependencyData {
    return {
      id: this.id,
      request: this.request,
      resolvedRequest: this.resolvedRequest,
      kind: this.kind,
      module: this.module.id,
      dependency: this.dependency.id,
      originDependency: this.originDependency.id,
      statements: this.statements.map((item) => item.toData()),
    };
  }
}
