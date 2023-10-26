import { SDK } from '@rsbuild/doctor-types';
import { Statement } from '../statement';
import { Variable } from './variable';
import type { SideEffect } from './side-effect';

let id = 1;

export class ExportInfo implements SDK.ExportInstance {
  static init() {
    id = 1;
  }

  id = id++;

  name: string;

  identifier?: Statement;

  private from?: ExportInfo;

  private _variable?: Variable | false;

  private _sideEffects: SideEffect[] = [];

  constructor(name: string, identifier?: Statement, variable?: Variable) {
    this.name = name;
    this.identifier = identifier;
    this._variable = variable;
  }

  get isReExport() {
    return Boolean(this.from);
  }

  set variable(data: Variable | undefined) {
    this._variable = data;
  }

  get variable(): Variable | undefined {
    if (this._variable) {
      return this._variable;
    }

    if (!this.from || this._variable === false) {
      this._variable = false;
      return;
    }

    const result = this.getRecursiveExport()?.variable;

    if (!result) {
      this._variable = false;
    }

    return result;
  }

  addSideEffect(info: SideEffect): void {
    if (this._sideEffects.every((item) => item.id !== info.id)) {
      this._sideEffects.push(info);

      // Recursively add side effects.
      if (this.from) {
        this.from.addSideEffect(info);
      }
    }
  }

  getSideEffects() {
    return this._sideEffects.slice();
  }

  setFromExport(from: ExportInfo): void {
    this.from = from;
  }

  getRecursiveExport(depth = Infinity) {
    if (depth === 0) {
      throw new Error(
        '`getRecursiveExport` method parameter depth must be greater than 1.',
      );
    }

    if (!this.from) {
      return this;
    }

    let currentDepth = 0;
    // eslint-disable-next-line no-this-alias
    let current: ExportInfo = this;

    while (current.from && currentDepth < depth) {
      currentDepth++;
      current = current.from!;
    }

    return current;
  }

  toData(): SDK.ExportData {
    const data: SDK.ExportData = {
      id: this.id,
      name: this.name,
      isReExport: this.isReExport,
      used: this._sideEffects.map((item) => item.id),
    };

    if (this.from) {
      data.from = this.from.id;
      data.root = this.getRecursiveExport().id;
    }

    if (this.variable) {
      data.variable = this.variable.id;
    }

    return data;
  }
}
