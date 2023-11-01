import { SDK } from '@rsbuild/doctor-types';
import { Statement } from '../statement';
import { ExportInfo } from './export';
import { Module } from '../module';

let id = 1;

export class Variable implements SDK.VariableInstance {
  static init() {
    id = 1;
  }

  readonly id = id++;

  readonly name: string;

  readonly module: Module;

  readonly usedInfo: string;

  readonly identifier: Statement;

  private _exported?: ExportInfo;

  constructor(
    name: string,
    module: Module,
    usedInfo: string,
    identifier: Statement,
  ) {
    this.name = name;
    this.module = module;
    this.usedInfo = usedInfo;
    this.identifier = identifier;
  }

  get isUsed() {
    return this._exported ? this._exported.getSideEffects().length > 0 : false;
  }

  setExportInfo(info: ExportInfo): void {
    this._exported = info;
    info.variable = this;
  }

  getExportInfo() {
    return this._exported;
  }

  toData(): SDK.VariableData {
    const data: SDK.VariableData = {
      id: this.id,
      name: this.name,
      module: this.module.id,
      identifier: this.identifier.toData(),
      usedInfo: this.usedInfo,
    };

    if (this._exported) {
      data.exported = this._exported.id;
    }

    return data;
  }
}
