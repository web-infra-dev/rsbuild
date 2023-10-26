import { SDK } from '@rsbuild/doctor-types';
import { Statement } from '../statement';
import { Module } from '../module';
import { Variable } from './variable';
import { ExportInfo } from './export';
import { ModuleGraphModule } from './module';
import { Dependency } from '../dependency';

let id = 1;

export class SideEffect implements SDK.SideEffectInstance {
  static init() {
    id = 1;
  }

  /** Name import tags */
  static NamespaceSymbol = Symbol('namespace');

  readonly id = id++;

  readonly name: string;

  readonly originName?: string;

  readonly module: Module;

  readonly identifier: Statement;

  readonly isNameSpace: boolean;

  readonly fromDependency?: Dependency;

  private _exports: ExportInfo[] = [];

  private _variable?: Variable | false;

  constructor(
    name: string,
    module: Module,
    identifier: Statement,
    fromRequest?: string,
    originName?: string | symbol,
  ) {
    this.name = name;
    this.module = module;
    this.identifier = identifier;

    if (fromRequest) {
      this.fromDependency = this.module.getDependencyByRequest(fromRequest);
    }

    if (originName === SideEffect.NamespaceSymbol) {
      this.isNameSpace = true;
    } else {
      this.isNameSpace = false;
      this.originName = originName as string;
    }
  }

  get variable() {
    if (typeof this._variable !== 'undefined') {
      if (this._variable) {
        return this._variable;
      }

      return;
    }

    // TODO: When referring to a namespace, it needs to be handled separately.
    const result = this.exports[0]?.getRecursiveExport()?.variable;
    this._variable = result ?? false;
    return result;
  }

  get exports() {
    return this._exports?.slice() ?? [];
  }

  setModuleExport(mgm: ModuleGraphModule) {
    mgm.getExports().forEach((info) => this.setExportInfo(info));
  }

  setExportInfo(info: ExportInfo) {
    this._exports.push(info);
    info.addSideEffect(this);
  }

  toData(): SDK.SideEffectData {
    const data: SDK.SideEffectData = {
      id: this.id,
      name: this.name,
      identifier: this.identifier.toData(),
      module: this.module.id,
    };

    if (this.fromDependency) {
      data.fromDependency = this.fromDependency.id;
    }

    if (this.isNameSpace) {
      data.isNameSpace = this.isNameSpace;
    }

    if (this.exports.length > 0) {
      data.exports = this.exports.map((item) => item.id);
    }

    if (this.variable) {
      data.variable = this.variable.id;
    }

    return data;
  }
}
