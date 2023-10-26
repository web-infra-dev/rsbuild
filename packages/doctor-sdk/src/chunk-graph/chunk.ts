import { SDK } from '@rsbuild/doctor-types';
import { Module } from '../module-graph';
import { Asset } from './asset';

export class Chunk implements SDK.ChunkInstance {
  readonly id: string;

  readonly name: string;

  readonly size: number;

  readonly initial: boolean;

  readonly entry: boolean;

  private _assets: Asset[] = [];

  private _modules: Module[] = [];

  private _dependencies: Chunk[] = [];

  private _imported: Chunk[] = [];

  private _parsedSize: number | undefined;

  constructor(
    id: string,
    name: string,
    size: number,
    initial: boolean,
    entry: boolean,
  ) {
    this.id = id;
    this.name = name;
    this.size = size;
    this.initial = initial;
    this.entry = entry;
  }

  isEntry() {
    return this.entry;
  }

  isChunkEntryModule(module: Module) {
    // The module is the project entrance, or the modules that rely on this module are not in the current Chunk.
    return (
      module.isEntry ||
      module.getImported().every((item) => !this.hasModule(item))
    );
  }

  hasModule(module: Module) {
    return this._modules.includes(module);
  }

  addModule(module: Module) {
    if (!this.hasModule(module)) {
      this._modules.push(module);
      module.addChunk(this);
    }
  }

  addAsset(asset: Asset) {
    this._assets.push(asset);
  }

  addModules(modules: Module[]) {
    modules.forEach((module: Module) => {
      if (!this.hasModule(module)) {
        this._modules.push(module);
        module.addChunk(this);
      }
    });
  }

  addDependency(dep: Chunk): void {
    if (!this._dependencies.includes(dep)) {
      this._dependencies.push(dep);
    }
  }

  addImported(imported: Chunk): void {
    if (!this._imported.includes(imported)) {
      this._imported.push(imported);
    }
  }

  getAssets(): Asset[] {
    return this._assets.slice();
  }

  getModules(): Module[] {
    return this._modules.slice();
  }

  getDependencies(): Chunk[] {
    return this._dependencies.slice();
  }

  getImported(): Chunk[] {
    return this._imported.slice();
  }

  setParsedSize(parsedSize: number) {
    this._parsedSize = parsedSize;
  }

  toData(): SDK.ChunkData {
    return {
      id: this.id,
      name: this.name,
      initial: this.initial,
      size: this.size,
      parsedSize: this._parsedSize || 0,
      entry: this.isEntry(),
      assets: this._assets.map(({ path }) => path),
      modules: this._modules.map(({ id }) => id),
      dependencies: this._dependencies.map(({ id }) => id),
      imported: this._imported.map(({ id }) => id),
    };
  }
}
