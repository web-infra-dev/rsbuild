import { SDK } from '@rsbuild/doctor-types';
import { Module } from '../module';
import { ExportInfo } from './export';
import { SideEffect } from './sideEffect';
import { Variable } from './variable';
import type { ModuleGraph } from '../graph';

export class ModuleGraphModule implements SDK.ModuleGraphModuleInstance {
  static init() {
    ExportInfo.init();
    SideEffect.init();
    Variable.init();
  }

  readonly module: Module;

  private exports: ExportInfo[] = [];

  private sideEffects: SideEffect[] = [];

  private variables: Variable[] = [];

  private _dynamic?: boolean;

  private _graph: ModuleGraph;

  constructor(module: Module, graph: ModuleGraph, dynamic?: boolean) {
    this.module = module;
    this._graph = graph;

    if (typeof this._dynamic === 'boolean') {
      this._dynamic = dynamic;
    }
  }

  get dynamic() {
    if (typeof this._dynamic === 'boolean') {
      return this._dynamic;
    }

    return this.module
      .getImported()
      .map((item) => item.getDependencyByModule(this.module))
      .some((item) => item && item.meta.exportsType === 'dynamic');
  }

  addExportInfo(data: ExportInfo) {
    this.exports.push(data);
    this._graph.addExportInfo(data);
  }

  addSideEffect(data: SideEffect) {
    this.sideEffects.push(data);
    this._graph.addSideEffect(data);
  }

  addVariable(data: Variable) {
    this.variables.push(data);
    this._graph.addVariable(data);
  }

  getExports() {
    return this.exports.slice();
  }

  getSideEffects(name?: string) {
    if (name) {
      return this.sideEffects.filter((item) => item.name === name);
    }

    return this.sideEffects.slice();
  }

  getOwnExports() {
    return this.exports.filter((item) => !item.isReExport);
  }

  getExport(name: string) {
    return this.exports.find((item) => item.name === name);
  }

  getReExports() {
    return this.exports.filter((item) => item.isReExport);
  }

  getOwnExport(name: string) {
    return this.getOwnExports().find((item) => item.name === name);
  }

  getReExport(name: string) {
    return this.getReExports().find((item) => item.name === name);
  }

  toData(): SDK.ModuleGraphModuleData {
    return {
      module: this.module.id,
      dynamic: this.dynamic,
      exports: this.exports.map((item) => item.id),
      sideEffects: this.sideEffects.map((item) => item.id),
      variables: this.variables.map((item) => item.id),
    };
  }
}
